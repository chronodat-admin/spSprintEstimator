/**
 * TEMPORARY client-only session runner for demo workshops (no SharePoint I/O).
 * Remove with src/demo/ when mock data is no longer needed.
 */
import { AnonymityMode, RoundState } from '../models';
import { SessionEngine, SessionEngineState } from '../services/SessionEngine';
import { RoundStatistics } from '../services/sessionTypeStrategies';
import { getAnonymousVoterId } from '../utils/anonymity';

export class DemoSessionRunner {
  public constructor(
    private readonly _userId: string,
    private readonly _userName: string
  ) {}

  public get currentUserId(): string {
    return this._userId;
  }

  public isFacilitator(state: SessionEngineState): boolean {
    return state.session.facilitatorId === this._userId ||
      (state.session.coFacilitators || []).indexOf(this._userId) >= 0;
  }

  public resolveVoterId(state: SessionEngineState, userId: string = this._userId): string {
    if (state.session.options.anonymity === AnonymityMode.True) {
      return getAnonymousVoterId(state.session.id, userId);
    }
    return userId;
  }

  public configurePolling(): void {
    // Demo sessions do not poll SharePoint.
  }

  public async startVoting(state: SessionEngineState, itemId?: number): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'START_ITEM_VOTING', itemId });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Unable to start voting');
    }
    return result.state;
  }

  public async submitVote(state: SessionEngineState, value: string): Promise<{
    state: SessionEngineState;
    statistics?: RoundStatistics;
    autoRevealed?: boolean;
  }> {
    const result = SessionEngine.reduce(state, {
      type: 'SUBMIT_VOTE',
      voterId: this._userId,
      voterName: this._userName,
      value
    });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Vote failed');
    }
    return {
      state: result.state,
      statistics: result.statistics,
      autoRevealed: result.autoRevealed
    };
  }

  public async revealVotes(state: SessionEngineState): Promise<{
    state: SessionEngineState;
    statistics?: RoundStatistics;
  }> {
    const result = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Reveal failed');
    }
    return { state: result.state, statistics: result.statistics };
  }

  public async reVote(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'RE_VOTE' });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Re-vote failed');
    }
    return result.state;
  }

  public async saveFinalEstimateAndNext(
    state: SessionEngineState,
    finalEstimate: string
  ): Promise<SessionEngineState> {
    let current = state;
    const setResult = SessionEngine.reduce(current, { type: 'SET_FINAL_ESTIMATE', finalEstimate });
    if (!setResult.success || !setResult.state) {
      throw new Error(setResult.error || 'Save failed');
    }
    current = setResult.state;
    const nextResult = SessionEngine.reduce(current, { type: 'NEXT_ITEM' });
    if (!nextResult.success || !nextResult.state) {
      throw new Error(nextResult.error || 'Next item failed');
    }
    return nextResult.state;
  }

  public async skipItem(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'SKIP_ITEM' });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Skip failed');
    }
    return result.state;
  }

  public async previousItem(state: SessionEngineState): Promise<SessionEngineState> {
    return this.goToItem(state, state.currentItemIndex - 1);
  }

  public async forwardItem(state: SessionEngineState): Promise<SessionEngineState> {
    if (state.currentItemIndex >= state.items.length - 1) {
      throw new Error('Already at last item');
    }
    return this.goToItem(state, state.currentItemIndex + 1);
  }

  public async goToItem(state: SessionEngineState, index: number): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'GO_TO_ITEM', index });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Unable to change item');
    }
    return result.state;
  }

  public async endSession(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'END_SESSION' });
    if (!result.success || !result.state) {
      throw new Error(result.error || 'Unable to end session');
    }
    return result.state;
  }

  public getStatistics(state: SessionEngineState): RoundStatistics | undefined {
    const round = SessionEngine.getCurrentRound(state);
    if (!round || round.state !== RoundState.Revealed) {
      return undefined;
    }
    return SessionEngine.getRoundStatistics(state, round.id);
  }
}

export function isDemoSessionCode(code: string): boolean {
  return code.trim().toUpperCase() === 'DEMO01';
}
