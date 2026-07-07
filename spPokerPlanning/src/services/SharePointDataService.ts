import {
  AnonymityMode,
  Deck,
  DeckListItem,
  DEFAULT_SESSION_OPTIONS,
  Participant,
  Round,
  RoundListItem,
  RoundState,
  Session,
  SessionListItem,
  SessionOptions,
  SessionStatus,
  SessionType,
  SiteSettings,
  SiteSettingsListItem,
  Vote,
  VoteListItem,
  WorkItem,
  WorkItemListItem,
  WorkItemStatus
} from '../models';

export interface VoteStatusEntry {
  voterId: string;
  hasVoted: boolean;
}

export interface CreateSessionParams {
  title: string;
  code: string;
  type: SessionType;
  facilitatorId: string;
  coFacilitators?: string[];
  deckJson?: string;
  options: SessionOptions;
  createdBy: string;
  sprintTag?: string;
  roster?: Participant[];
}

export interface SessionFilter {
  type?: SessionType;
  sprintTag?: string;
  fromDate?: string;
  toDate?: string;
}

/** All SharePoint list CRUD via PnPjs — single responsibility. */
export class SharePointDataService {
  private readonly _sp: import('@pnp/sp').SPFI;

  public constructor(sp: import('@pnp/sp').SPFI) {
    this._sp = sp;
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  public async createSession(params: CreateSessionParams): Promise<Session> {
    const options: SessionOptions = {
      ...params.options,
      roster: params.roster || []
    };
    const result = await this._sp.web.lists.getByTitle('Estimatr_Sessions').items.add({
      Title: params.title,
      Code: params.code.toUpperCase(),
      Type: params.type,
      Status: SessionStatus.Lobby,
      FacilitatorId: params.facilitatorId,
      CoFacilitators: JSON.stringify(params.coFacilitators || []),
      DeckJson: params.deckJson,
      OptionsJson: JSON.stringify(options),
      CreatedBy: params.createdBy,
      SprintTag: params.sprintTag || ''
    });

    let session: Session | undefined;
    try {
      session = await this.getSessionById(this._getAddedItemId(result));
    } catch {
      session = undefined;
    }
    if (!session) {
      session = await this.getSessionByCode(params.code);
    }
    if (!session) {
      throw new Error('Session was saved but could not be loaded. Refresh and try joining with the session code.');
    }
    return session;
  }

  public async getSessionById(id: number): Promise<Session | undefined> {
    try {
      const item = await this._sp.web.lists
        .getByTitle('Estimatr_Sessions')
        .items.getById(id)
        .select('Id', 'Title', 'Code', 'Type', 'Status', 'FacilitatorId', 'CoFacilitators', 'DeckJson', 'OptionsJson', 'CreatedBy', 'ExpiresAt', 'SprintTag')();
      return this._mapSession(item as SessionListItem);
    } catch {
      return undefined;
    }
  }

  public async getSessionByCode(code: string): Promise<Session | undefined> {
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Sessions')
      .items.select('Id', 'Title', 'Code', 'Type', 'Status', 'FacilitatorId', 'CoFacilitators', 'DeckJson', 'OptionsJson', 'CreatedBy', 'ExpiresAt', 'SprintTag')
      .filter(`Code eq '${code.toUpperCase().replace(/'/g, "''")}'`)
      .top(1)();
    if (items.length === 0) {
      return undefined;
    }
    return this._mapSession(items[0] as SessionListItem);
  }

  public async listSessions(filter?: SessionFilter): Promise<Session[]> {
    let query = this._sp.web.lists
      .getByTitle('Estimatr_Sessions')
      .items.select('Id', 'Title', 'Code', 'Type', 'Status', 'FacilitatorId', 'CoFacilitators', 'DeckJson', 'OptionsJson', 'CreatedBy', 'ExpiresAt', 'SprintTag')
      .orderBy('Id', false)
      .top(200);

    const filters: string[] = [];
    if (filter?.type) {
      filters.push(`Type eq '${filter.type}'`);
    }
    if (filter?.sprintTag) {
      filters.push(`SprintTag eq '${filter.sprintTag.replace(/'/g, "''")}'`);
    }
    if (filters.length > 0) {
      query = query.filter(filters.join(' and '));
    }

    const items = await query();
    return (items as SessionListItem[]).map((i) => this._mapSession(i));
  }

  public async updateSession(id: number, patch: Partial<{
    title: string;
    status: SessionStatus;
    options: SessionOptions;
    deckJson: string;
    expiresAt: string;
  }>): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      update.Title = patch.title;
    }
    if (patch.status !== undefined) {
      update.Status = patch.status;
    }
    if (patch.options !== undefined) {
      update.OptionsJson = JSON.stringify(patch.options);
    }
    if (patch.deckJson !== undefined) {
      update.DeckJson = patch.deckJson;
    }
    if (patch.expiresAt !== undefined) {
      update.ExpiresAt = patch.expiresAt;
    }
    await this._sp.web.lists.getByTitle('Estimatr_Sessions').items.getById(id).update(update);
  }

  public async updateSessionRoster(sessionId: number, roster: Participant[], currentOptions: SessionOptions): Promise<void> {
    await this.updateSession(sessionId, {
      options: { ...currentOptions, roster }
    });
  }

  public async deleteSession(id: number): Promise<void> {
    const items = await this.getSessionItems(id);
    for (const item of items) {
      const rounds = await this.getRoundsForItem(item.id);
      for (const round of rounds) {
        const votes = await this.getVotesForRound(round.id, true);
        for (const vote of votes) {
          await this._sp.web.lists.getByTitle('Estimatr_Votes').items.getById(vote.id).delete();
        }
        await this._sp.web.lists.getByTitle('Estimatr_Rounds').items.getById(round.id).delete();
      }
      await this._sp.web.lists.getByTitle('Estimatr_Items').items.getById(item.id).delete();
    }
    await this._sp.web.lists.getByTitle('Estimatr_Sessions').items.getById(id).delete();
  }

  // ─── Work items ───────────────────────────────────────────────────────────

  public async createWorkItems(sessionId: number, items: Omit<WorkItem, 'id' | 'sessionId' | 'status'>[]): Promise<WorkItem[]> {
    const list = this._sp.web.lists.getByTitle('Estimatr_Items');
    const created: WorkItem[] = [];
    for (const item of items) {
      const result = await list.items.add({
        Title: item.title,
        SessionId: sessionId,
        Description: item.description || '',
        ExternalLink: item.externalLink || '',
        ExternalRef: item.externalRef || '',
        OrderIndex: item.orderIndex,
        Status: WorkItemStatus.Pending,
        VoteType: item.voteType || ''
      });
      created.push({
        id: this._getAddedItemId(result),
        sessionId,
        title: item.title,
        description: item.description,
        externalLink: item.externalLink,
        externalRef: item.externalRef,
        orderIndex: item.orderIndex,
        status: WorkItemStatus.Pending,
        voteType: item.voteType
      });
    }
    return created;
  }

  public async getSessionItems(sessionId: number): Promise<WorkItem[]> {
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Items')
      .items.select('Id', 'Title', 'SessionId', 'Description', 'ExternalLink', 'ExternalRef', 'OrderIndex', 'FinalEstimate', 'Status', 'VoteType')
      .filter(`SessionId eq ${sessionId}`)
      .orderBy('OrderIndex')();
    return (items as WorkItemListItem[]).map((item) => this._mapWorkItem(item));
  }

  public async updateWorkItem(id: number, patch: Partial<Pick<WorkItem, 'status' | 'finalEstimate' | 'title' | 'description'>>): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.status !== undefined) {
      update.Status = patch.status;
    }
    if (patch.finalEstimate !== undefined) {
      update.FinalEstimate = patch.finalEstimate;
    }
    if (patch.title !== undefined) {
      update.Title = patch.title;
    }
    if (patch.description !== undefined) {
      update.Description = patch.description;
    }
    await this._sp.web.lists.getByTitle('Estimatr_Items').items.getById(id).update(update);
  }

  // ─── Rounds ───────────────────────────────────────────────────────────────

  public async createRound(itemId: number, roundNumber: number): Promise<Round> {
    const now = new Date().toISOString();
    const result = await this._sp.web.lists.getByTitle('Estimatr_Rounds').items.add({
      Title: `Round ${roundNumber}`,
      ItemId: itemId,
      RoundNumber: roundNumber,
      State: RoundState.Open,
      OpenedAt: now
    });
    return {
      id: this._getAddedItemId(result),
      itemId,
      roundNumber,
      state: RoundState.Open,
      openedAt: now
    };
  }

  public async getRoundsForItem(itemId: number): Promise<Round[]> {
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Rounds')
      .items.select('Id', 'ItemId', 'RoundNumber', 'State', 'OpenedAt', 'RevealedAt')
      .filter(`ItemId eq ${itemId}`)
      .orderBy('RoundNumber')();
    return (items as RoundListItem[]).map((r) => this._mapRound(r));
  }

  public async getLatestRoundForItem(itemId: number): Promise<Round | undefined> {
    const rounds = await this.getRoundsForItem(itemId);
    return rounds.length > 0 ? rounds[rounds.length - 1] : undefined;
  }

  public async revealRound(roundId: number): Promise<void> {
    await this._sp.web.lists.getByTitle('Estimatr_Rounds').items.getById(roundId).update({
      State: RoundState.Revealed,
      RevealedAt: new Date().toISOString()
    });
  }

  // ─── Votes ────────────────────────────────────────────────────────────────

  public async submitVote(vote: Omit<Vote, 'id'>): Promise<Vote> {
    const existing = await this._sp.web.lists
      .getByTitle('Estimatr_Votes')
      .items.select('Id', 'RoundId', 'VoterId', 'VoterName', 'Value', 'SubmittedAt', 'Locked')
      .filter(`RoundId eq ${vote.roundId} and VoterId eq '${(vote.voterId || '__anon__').replace(/'/g, "''")}'`)
      .top(1)();

    if (existing.length > 0) {
      const existingVote = existing[0] as VoteListItem;
      if (existingVote.Locked) {
        throw new Error('Cannot edit a locked vote');
      }
      await this._sp.web.lists.getByTitle('Estimatr_Votes').items.getById(existingVote.Id).update({
        Value: vote.value,
        SubmittedAt: vote.submittedAt,
        VoterName: vote.voterName
      });
      return { ...vote, id: existingVote.Id, locked: existingVote.Locked };
    }

    const result = await this._sp.web.lists.getByTitle('Estimatr_Votes').items.add({
      Title: `Vote ${vote.roundId}`,
      RoundId: vote.roundId,
      VoterId: vote.voterId,
      VoterName: vote.voterName,
      Value: vote.value,
      SubmittedAt: vote.submittedAt,
      Locked: false
    });
    return { ...vote, id: this._getAddedItemId(result), locked: false };
  }

  public async lockVotesForRound(roundId: number): Promise<void> {
    const votes = await this.getVotesForRound(roundId, true);
    for (const vote of votes) {
      if (!vote.locked) {
        await this._sp.web.lists.getByTitle('Estimatr_Votes').items.getById(vote.id).update({ Locked: true });
      }
    }
  }

  public async getVoteStatusForRound(roundId: number): Promise<VoteStatusEntry[]> {
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Votes')
      .items.select('VoterId')
      .filter(`RoundId eq ${roundId}`)();
    return (items as { VoterId: string }[]).map((v) => ({
      voterId: v.VoterId,
      hasVoted: true
    }));
  }

  public async getVotesForRound(roundId: number, includeValues: boolean): Promise<Vote[]> {
    const select = includeValues
      ? 'Id,RoundId,VoterId,VoterName,Value,SubmittedAt,Locked'
      : 'Id,RoundId,VoterId,VoterName,SubmittedAt,Locked';
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Votes')
      .items.select(select)
      .filter(`RoundId eq ${roundId}`)();
    return (items as VoteListItem[]).map((v) => ({
      id: v.Id,
      roundId: v.RoundId,
      voterId: v.VoterId,
      voterName: v.VoterName,
      value: includeValues ? v.Value : '',
      submittedAt: v.SubmittedAt,
      locked: v.Locked
    }));
  }

  // ─── Decks ────────────────────────────────────────────────────────────────

  public async getDecks(): Promise<Deck[]> {
    const items = await this._sp.web.lists
      .getByTitle('Estimatr_Decks')
      .items.select('Id', 'Title', 'ValuesJson', 'IsDefault')();
    return (items as DeckListItem[]).map((d) => ({
      id: d.Id,
      title: d.Title,
      valuesJson: d.ValuesJson,
      isDefault: d.IsDefault
    }));
  }

  public async createDeck(title: string, valuesJson: string, isDefault: boolean = false): Promise<Deck> {
    const result = await this._sp.web.lists.getByTitle('Estimatr_Decks').items.add({
      Title: title,
      ValuesJson: valuesJson,
      IsDefault: isDefault
    });
    return { id: this._getAddedItemId(result), title, valuesJson, isDefault };
  }

  public async updateDeck(id: number, title: string, valuesJson: string): Promise<void> {
    await this._sp.web.lists.getByTitle('Estimatr_Decks').items.getById(id).update({
      Title: title,
      ValuesJson: valuesJson
    });
  }

  public async deleteDeck(id: number): Promise<void> {
    await this._sp.web.lists.getByTitle('Estimatr_Decks').items.getById(id).delete();
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  public async getSettings(): Promise<SiteSettings | undefined> {
    try {
      const items = await this._sp.web.lists
        .getByTitle('Estimatr_Settings')
        .items.select('Id', 'Title', 'RetentionDays', 'DefaultDeckId', 'WhoCanCreate', 'ProvisioningVersion', 'AppearanceJson', 'FeatureFlagsJson', 'IntegrationConfigJson')
        .top(1)();
      if (items.length === 0) {
        return undefined;
      }
      const item = items[0] as SiteSettingsListItem;
      return {
        id: item.Id,
        retentionDays: item.RetentionDays,
        defaultDeckId: item.DefaultDeckId,
        whoCanCreate: item.WhoCanCreate as SiteSettings['whoCanCreate'],
        provisioningVersion: item.ProvisioningVersion,
        appearanceJson: item.AppearanceJson,
        featureFlagsJson: item.FeatureFlagsJson,
        integrationConfigJson: item.IntegrationConfigJson
      };
    } catch {
      return undefined;
    }
  }

  public async updateSettings(settings: SiteSettings): Promise<void> {
    if (!settings.id) {
      return;
    }
    await this._sp.web.lists.getByTitle('Estimatr_Settings').items.getById(settings.id).update({
      RetentionDays: settings.retentionDays,
      DefaultDeckId: settings.defaultDeckId,
      WhoCanCreate: settings.whoCanCreate,
      AppearanceJson: settings.appearanceJson || '',
      FeatureFlagsJson: settings.featureFlagsJson || '',
      IntegrationConfigJson: settings.integrationConfigJson || ''
    });
  }

  public async trimExpiredSessions(retentionDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffIso = cutoff.toISOString();
    const sessions = await this.listSessions();
    let deleted = 0;
    for (const session of sessions) {
      if (session.status !== SessionStatus.Ended) {
        continue;
      }
      const endedAt = session.expiresAt || '';
      if (endedAt && endedAt > cutoffIso) {
        continue;
      }
      await this.deleteSession(session.id);
      deleted++;
    }
    return deleted;
  }

  // ─── Load full session state ──────────────────────────────────────────────

  public async loadSessionState(sessionId: number): Promise<{
    session: Session;
    items: WorkItem[];
    rounds: Round[];
    votes: Vote[];
  }> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    const items = await this.getSessionItems(sessionId);
    const rounds: Round[] = [];
    const votes: Vote[] = [];
    for (const item of items) {
      const itemRounds = await this.getRoundsForItem(item.id);
      rounds.push(...itemRounds);
      for (const round of itemRounds) {
        const includeValues = round.state === RoundState.Revealed;
        const roundVotes = await this.getVotesForRound(round.id, includeValues);
        votes.push(...roundVotes);
      }
    }
    return { session, items, rounds, votes };
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private _getAddedItemId(result: unknown): number {
    const payload = result as {
      Id?: number | string;
      ID?: number | string;
      id?: number | string;
      data?: { Id?: number | string; ID?: number | string; id?: number | string };
      d?: { Id?: number | string; ID?: number | string; id?: number | string };
    } | undefined;

    const candidates = [
      payload?.Id,
      payload?.ID,
      payload?.id,
      payload?.data?.Id,
      payload?.data?.ID,
      payload?.data?.id,
      payload?.d?.Id,
      payload?.d?.ID,
      payload?.d?.id
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && candidate > 0) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const parsed = parseInt(candidate, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    throw new Error('SharePoint did not return the new list item id');
  }

  private _mapSession(item: SessionListItem): Session {
    let options: SessionOptions;
    try {
      options = JSON.parse(item.OptionsJson) as SessionOptions;
    } catch {
      options = { ...DEFAULT_SESSION_OPTIONS, anonymity: AnonymityMode.Off };
    }
    let coFacilitators: string[] = [];
    if (item.CoFacilitators) {
      try {
        coFacilitators = JSON.parse(item.CoFacilitators) as string[];
      } catch {
        coFacilitators = [];
      }
    }
    return {
      id: item.Id,
      title: item.Title,
      code: item.Code,
      type: item.Type as SessionType,
      status: item.Status as SessionStatus,
      facilitatorId: item.FacilitatorId,
      coFacilitators,
      deckJson: item.DeckJson,
      options,
      createdBy: item.CreatedBy,
      expiresAt: item.ExpiresAt,
      sprintTag: item.SprintTag
    };
  }

  private _mapWorkItem(item: WorkItemListItem): WorkItem {
    return {
      id: item.Id,
      sessionId: item.SessionId,
      title: item.Title,
      description: item.Description,
      externalLink: item.ExternalLink,
      externalRef: item.ExternalRef,
      orderIndex: item.OrderIndex,
      finalEstimate: item.FinalEstimate,
      status: item.Status as WorkItemStatus,
      voteType: item.VoteType ? (item.VoteType as SessionType) : undefined
    };
  }

  private _mapRound(item: RoundListItem): Round {
    return {
      id: item.Id,
      itemId: item.ItemId,
      roundNumber: item.RoundNumber,
      state: item.State as RoundState,
      openedAt: item.OpenedAt,
      revealedAt: item.RevealedAt
    };
  }
}
