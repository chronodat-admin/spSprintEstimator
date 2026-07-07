export interface RealtimeConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastPollAt?: string;
  retryAfterMs?: number;
}

export interface IRealtimeSubscription {
  unsubscribe(): void;
}

export interface IRealtimeService {
  readonly connectionState: RealtimeConnectionState;
  start(): void;
  stop(): void;
  subscribe(onUpdate: () => void): IRealtimeSubscription;
  pause(): void;
  resume(): void;
}
