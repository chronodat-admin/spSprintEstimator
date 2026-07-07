import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPPermission } from '@microsoft/sp-page-context';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';

import {
  AnonymityMode,
  DEFAULT_SESSION_OPTIONS,
  Participant,
  ParticipantRole,
  RoundState,
  Session,
  SessionStatus,
  SessionType,
  WorkItem,
  WorkItemStatus
} from '../models';
import { AzureDevOpsService } from './IntegrationServices';
import { PollingRealtimeService } from './PollingRealtimeService';
import { SharePointDataService } from './SharePointDataService';
import { SessionEngine, SessionEngineState } from './SessionEngine';
import { RoundStatistics } from './sessionTypeStrategies';
import { getAnonymousVoterId } from '../utils/anonymity';
import { generateSessionCode } from '../utils/codeGenerator';

export class SessionOrchestrator {
  private readonly _context: WebPartContext;
  private readonly _data: SharePointDataService;
  private readonly _realtime: PollingRealtimeService;
  private readonly _userId: string;
  private readonly _userName: string;
  private readonly _userEmail: string;

  public constructor(
    context: WebPartContext,
    realtime: PollingRealtimeService
  ) {
    this._context = context;
    this._data = new SharePointDataService(spfi().using(SPFx(context)));
    this._realtime = realtime;
    this._userId = context.pageContext.legacyPageContext.userId?.toString() || context.pageContext.user.loginName;
    this._userName = context.pageContext.user.displayName;
    this._userEmail = context.pageContext.user.email || context.pageContext.user.loginName;
  }

  public get dataService(): SharePointDataService {
    return this._data;
  }

  public get currentUserId(): string {
    return this._userId;
  }

  public get currentUserName(): string {
    return this._userName;
  }

  public get currentUserEmail(): string {
    return this._userEmail;
  }

  public resolveVoterId(state: SessionEngineState, userId: string = this._userId): string {
    if (state.session.options.anonymity === AnonymityMode.True) {
      return getAnonymousVoterId(state.session.id, userId);
    }
    return userId;
  }

  public async createSession(params: {
    title: string;
    type: SessionType;
    options: typeof DEFAULT_SESSION_OPTIONS;
    items: Omit<WorkItem, 'id' | 'sessionId' | 'status'>[];
    deckValues?: string[];
    sprintTag?: string;
  }): Promise<{ session: Session; engineState: SessionEngineState }> {
    const settings = await this._data.getSettings();
    if (!this.canCreateSession(settings)) {
      throw new Error('You do not have permission to create sessions on this site');
    }

    const code = generateSessionCode();
    const facilitator: Participant = {
      id: this._userId,
      displayName: this._userName,
      role: ParticipantRole.Facilitator,
      joinedAt: new Date().toISOString(),
      email: this._userEmail
    };
    const session = await this._data.createSession({
      title: params.title,
      code,
      type: params.type,
      facilitatorId: this._userId,
      options: params.options,
      createdBy: this._userName,
      deckJson: params.deckValues ? JSON.stringify(params.deckValues) : undefined,
      sprintTag: params.sprintTag,
      roster: [facilitator]
    });
    const items = await this._data.createWorkItems(session.id, params.items);
    const engineState = this._buildEngineState(session, items, [facilitator], [], [], params.deckValues);
    return { session, engineState };
  }

  public async joinSession(code: string): Promise<{ session: Session; engineState: SessionEngineState }> {
    const session = await this._data.getSessionByCode(code);
    if (!session) {
      throw new Error('Session not found');
    }
    const participant: Participant = {
      id: this._userId,
      displayName: this._userName,
      role: ParticipantRole.Voter,
      joinedAt: new Date().toISOString(),
      email: this._userEmail
    };
    const roster = session.options.roster || [];
    if (!roster.some((p) => p.id === this._userId)) {
      roster.push(participant);
      await this._data.updateSessionRoster(session.id, roster, session.options);
      session.options.roster = roster;
    }
    const loaded = await this._data.loadSessionState(session.id);
    const deckValues = loaded.session.deckJson ? JSON.parse(loaded.session.deckJson) as string[] : undefined;
    return {
      session: loaded.session,
      engineState: this._buildEngineState(
        loaded.session,
        loaded.items,
        loaded.session.options.roster || roster,
        loaded.rounds,
        loaded.votes,
        deckValues,
        this._currentItemIndex(loaded.items, loaded.session)
      )
    };
  }

  public async refreshSession(sessionId: number): Promise<SessionEngineState> {
    const loaded = await this._data.loadSessionState(sessionId);
    const deckValues = loaded.session.deckJson ? JSON.parse(loaded.session.deckJson) as string[] : undefined;
    return this._buildEngineState(
      loaded.session,
      loaded.items,
      loaded.session.options.roster || [],
      loaded.rounds,
      loaded.votes,
      deckValues,
      this._currentItemIndex(loaded.items, loaded.session)
    );
  }

  public configurePolling(sessionId: number, scope: 'lobby' | 'voting', roundId?: number): void {
    this._realtime.configure({ scope, sessionId, roundId }, scope === 'voting');
    this._realtime.start();
  }

  public async startSession(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'START_SESSION' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    await this._data.updateSession(state.session.id, { status: SessionStatus.Active });
    return result.state;
  }

  public async startVoting(state: SessionEngineState, itemId?: number): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'START_ITEM_VOTING', itemId });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    const item = SessionEngine.getCurrentItem(result.state)!;
    const roundNumber = state.rounds.filter((r) => r.itemId === item.id).length + 1;
    await this._data.updateWorkItem(item.id, { status: WorkItemStatus.Voting });
    await this._data.createRound(item.id, roundNumber);
    return await this.refreshSession(state.session.id);
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
      throw new Error(result.error);
    }
    const round = SessionEngine.getCurrentRound(result.state)!;
    const anonymize = state.session.options.anonymity === AnonymityMode.True;
    const voterId = this.resolveVoterId(state);
    await this._data.submitVote({
      roundId: round.id,
      voterId,
      voterName: anonymize ? '' : this._userName,
      value,
      submittedAt: new Date().toISOString(),
      locked: false
    });

    if (result.autoRevealed) {
      await this._persistReveal(result.state, round.id);
    }
    const refreshed = await this.refreshSession(state.session.id);
    return { state: refreshed, statistics: result.statistics, autoRevealed: result.autoRevealed };
  }

  public async revealVotes(state: SessionEngineState): Promise<{ state: SessionEngineState; statistics?: RoundStatistics }> {
    const result = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    const round = SessionEngine.getCurrentRound(result.state)!;
    await this._persistReveal(result.state, round.id);
    const refreshed = await this.refreshSession(state.session.id);
    return { state: refreshed, statistics: result.statistics };
  }

  public async reVote(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'RE_VOTE' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    const item = SessionEngine.getCurrentItem(result.state)!;
    const round = SessionEngine.getCurrentRound(result.state)!;
    await this._data.updateWorkItem(item.id, { status: WorkItemStatus.Voting });
    await this._data.createRound(item.id, round.roundNumber);
    return await this.refreshSession(state.session.id);
  }

  public async setFinalEstimate(state: SessionEngineState, finalEstimate: string): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'SET_FINAL_ESTIMATE', finalEstimate });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    const item = SessionEngine.getCurrentItem(result.state)!;
    await this._data.updateWorkItem(item.id, { status: WorkItemStatus.Done, finalEstimate });
    return result.state;
  }

  public async saveFinalEstimateAndNext(
    state: SessionEngineState,
    finalEstimate: string,
    writeback: { ado: boolean }
  ): Promise<SessionEngineState> {
    const item = SessionEngine.getCurrentItem(state);
    await this.setFinalEstimate(state, finalEstimate);
    if (item?.externalRef) {
      try {
        await this._writebackEstimate(state, item, finalEstimate, writeback);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'External writeback failed');
      }
    }
    return await this.nextItem(state);
  }

  public async nextItem(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'NEXT_ITEM' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    await this._persistCurrentItemIndex(result.state, result.state.currentItemIndex);
    if (result.state.session.status === SessionStatus.Ended) {
      await this._data.updateSession(state.session.id, {
        status: SessionStatus.Ended,
        expiresAt: new Date().toISOString()
      });
    }
    return await this.refreshSession(state.session.id);
  }

  public async goToItem(state: SessionEngineState, index: number): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'GO_TO_ITEM', index });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    await this._persistCurrentItemIndex(result.state, index);
    return await this.refreshSession(state.session.id);
  }

  public async previousItem(state: SessionEngineState): Promise<SessionEngineState> {
    return await this.goToItem(state, state.currentItemIndex - 1);
  }

  public async forwardItem(state: SessionEngineState): Promise<SessionEngineState> {
    if (state.currentItemIndex >= state.items.length - 1) {
      throw new Error('Already at last item');
    }
    return await this.goToItem(state, state.currentItemIndex + 1);
  }

  public async skipItem(state: SessionEngineState): Promise<SessionEngineState> {
    const item = SessionEngine.getCurrentItem(state);
    const round = SessionEngine.getCurrentRound(state);
    const result = SessionEngine.reduce(state, { type: 'SKIP_ITEM' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    if (item) {
      await this._data.updateWorkItem(item.id, { status: WorkItemStatus.Done, finalEstimate: 'skipped' });
    }
    if (round && round.state === RoundState.Open) {
      await this._data.revealRound(round.id);
      await this._data.lockVotesForRound(round.id);
    }
    if (result.state.session.status === SessionStatus.Ended) {
      await this._data.updateSession(state.session.id, {
        status: SessionStatus.Ended,
        expiresAt: new Date().toISOString()
      });
    }
    await this._persistCurrentItemIndex(result.state, result.state.currentItemIndex);
    return await this.refreshSession(state.session.id);
  }

  public async endSession(state: SessionEngineState): Promise<SessionEngineState> {
    const result = SessionEngine.reduce(state, { type: 'END_SESSION' });
    if (!result.success || !result.state) {
      throw new Error(result.error);
    }
    await this._data.updateSession(state.session.id, {
      status: SessionStatus.Ended,
      expiresAt: new Date().toISOString()
    });
    return await this.refreshSession(state.session.id);
  }

  public canCreateSession(settings: { whoCanCreate?: string } | undefined): boolean {
    const role = settings?.whoCanCreate || 'members';
    if (role === 'everyone') {
      return true;
    }
    if (role === 'owners') {
      return this._isSiteOwner();
    }
    return this._isSiteMember();
  }

  /** Site owners may delete any session; creators may delete sessions they started. */
  public canDeleteSession(session: Session): boolean {
    if (this._isSiteOwner()) {
      return true;
    }
    if (session.facilitatorId === this._userId) {
      return true;
    }
    return !!session.createdBy && session.createdBy === this._userName;
  }

  public async deleteSession(sessionId: number): Promise<void> {
    const session = await this._data.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (!this.canDeleteSession(session)) {
      throw new Error('You do not have permission to delete this session');
    }
    await this._data.deleteSession(sessionId);
  }

  public isSiteOwner(): boolean {
    return this._isSiteOwner();
  }

  private _isSiteOwner(): boolean {
    return !!this._context.pageContext.legacyPageContext.isSiteAdmin;
  }

  private _isSiteMember(): boolean {
    if (this._context.pageContext.user.isExternalGuestUser) {
      return false;
    }

    const permissions = this._context.pageContext.web.permissions;
    return permissions.hasPermission(SPPermission.addListItems) ||
      permissions.hasPermission(SPPermission.editListItems) ||
      permissions.hasPermission(SPPermission.manageLists) ||
      this._isSiteOwner();
  }

  private async _writebackEstimate(
    state: SessionEngineState,
    item: WorkItem,
    finalEstimate: string,
    flags: { ado: boolean }
  ): Promise<void> {
    const integration = state.session.options.integration;
    if (!integration || !item.externalRef) {
      return;
    }
    const refId = parseInt(item.externalRef, 10);
    if (isNaN(refId)) {
      return;
    }

    if (flags.ado && integration.adoOrg && integration.adoProject) {
      const points = parseFloat(finalEstimate);
      if (!isNaN(points)) {
        const ado = new AzureDevOpsService(this._context);
        await ado.updateStoryPoints(integration.adoOrg, integration.adoProject, refId, points);
      }
    }
  }

  private async _persistReveal(state: SessionEngineState, roundId: number): Promise<void> {
    await this._data.revealRound(roundId);
    await this._data.lockVotesForRound(roundId);
    const item = SessionEngine.getCurrentItem(state);
    if (item) {
      await this._data.updateWorkItem(item.id, { status: WorkItemStatus.Revealed });
    }
  }

  private _currentItemIndex(items: WorkItem[], session?: Session): number {
    const stored = session?.options?.currentItemIndex;
    if (typeof stored === 'number' && stored >= 0 && stored < items.length) {
      return stored;
    }
    const votingIdx = items.findIndex((i) => i.status === WorkItemStatus.Voting || i.status === WorkItemStatus.Revealed);
    if (votingIdx >= 0) {
      return votingIdx;
    }
    const pendingIdx = items.findIndex((i) => i.status === WorkItemStatus.Pending);
    return pendingIdx >= 0 ? pendingIdx : 0;
  }

  private async _persistCurrentItemIndex(state: SessionEngineState, index: number): Promise<void> {
    await this._data.updateSession(state.session.id, {
      options: { ...state.session.options, currentItemIndex: index }
    });
  }

  private _buildEngineState(
    session: Session,
    items: WorkItem[],
    participants: Participant[],
    rounds: import('../models').Round[],
    votes: import('../models').Vote[],
    deckValues?: string[],
    currentItemIndex?: number
  ): SessionEngineState {
    return {
      session,
      items,
      participants,
      rounds,
      votes,
      currentItemIndex: currentItemIndex ?? 0,
      deckValues
    };
  }

  public isFacilitator(state: SessionEngineState): boolean {
    return state.session.facilitatorId === this._userId ||
      (state.session.coFacilitators || []).indexOf(this._userId) >= 0;
  }

  public getStatistics(state: SessionEngineState): RoundStatistics | undefined {
    const round = SessionEngine.getCurrentRound(state);
    if (!round || round.state !== RoundState.Revealed) {
      return undefined;
    }
    return SessionEngine.getRoundStatistics(state, round.id);
  }
}
