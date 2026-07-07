import { SharePointDataService } from './SharePointDataService';
import { IRealtimeService, IRealtimeSubscription, RealtimeConnectionState } from './RealtimeService';

export type PollScope = 'lobby' | 'voting' | 'session-status';

export interface IPollPayload {
  scope: PollScope;
  sessionId?: number;
  roundId?: number;
}

export class PollingRealtimeService implements IRealtimeService {
  private _connectionState: RealtimeConnectionState = { connected: true, reconnecting: false };
  private _timer: number | undefined;
  private _intervalMs = 2500;
  private _callbacks: Array<() => void> = [];
  private _dataService: SharePointDataService;
  private _payload: IPollPayload = { scope: 'session-status' };
  private _paused = false;
  private _active = false;

  public constructor(dataService: SharePointDataService) {
    this._dataService = dataService;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  public get connectionState(): RealtimeConnectionState {
    return { ...this._connectionState };
  }

  public configure(payload: IPollPayload, active: boolean = true): void {
    this._payload = payload;
    this._active = active;
    this._intervalMs = active ? 2500 : 15000;
  }

  public start(): void {
    this._schedulePoll(0);
  }

  public stop(): void {
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  public subscribe(onUpdate: () => void): IRealtimeSubscription {
    this._callbacks.push(onUpdate);
    return {
      unsubscribe: () => {
        this._callbacks = this._callbacks.filter((cb) => cb !== onUpdate);
      }
    };
  }

  public pause(): void {
    this._paused = true;
    this.stop();
  }

  public resume(): void {
    this._paused = false;
    this.start();
  }

  private _onVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  private _schedulePoll(delayMs: number): void {
    this.stop();
    if (this._paused) {
      return;
    }
    this._timer = window.setTimeout(() => this._poll(), delayMs);
  }

  private async _poll(): Promise<void> {
    try {
      await this._executePoll();
      this._connectionState = {
        connected: true,
        reconnecting: false,
        lastPollAt: new Date().toISOString()
      };
      this._intervalMs = this._active ? 2500 : 15000;
    } catch (error) {
      const retryAfter = this._extractRetryAfter(error);
      this._connectionState = {
        connected: false,
        reconnecting: true,
        retryAfterMs: retryAfter
      };
      this._intervalMs = retryAfter || Math.min(this._intervalMs * 2, 15000);
    }
    this._notify();
    this._schedulePoll(this._intervalMs);
  }

  private async _executePoll(): Promise<void> {
    const { scope, sessionId } = this._payload;
    if (!sessionId) {
      return;
    }
    if (scope === 'lobby' || scope === 'session-status') {
      await this._dataService.getSessionById(sessionId);
    }
    if (scope === 'voting' && this._payload.roundId) {
      await this._dataService.getVoteStatusForRound(this._payload.roundId);
      await this._dataService.getSessionById(sessionId);
    }
  }

  private _extractRetryAfter(error: unknown): number | undefined {
    const err = error as { status?: number; response?: { headers?: { get?: (k: string) => string } } };
    if (err?.status === 429 || err?.status === 503) {
      const header = err.response?.headers?.get?.('Retry-After');
      if (header) {
        const seconds = parseInt(header, 10);
        if (!isNaN(seconds)) {
          return seconds * 1000;
        }
      }
      return 5000;
    }
    return undefined;
  }

  private _notify(): void {
    this._callbacks.forEach((cb) => cb());
  }
}
