import {
  AnonymityMode,
  DEFAULT_SESSION_OPTIONS,
  Participant,
  ParticipantRole,
  Round,
  RoundState,
  Session,
  SessionOptions,
  SessionStatus,
  SessionType,
  Vote,
  WorkItem,
  WorkItemStatus
} from '../models';
import { getSessionTypeStrategy, RoundStatistics, VoteValidationContext } from './sessionTypeStrategies';

export interface SessionEngineState {
  session: Session;
  items: WorkItem[];
  participants: Participant[];
  rounds: Round[];
  votes: Vote[];
  currentItemIndex: number;
  deckValues?: string[];
}

export interface EngineActionResult {
  success: boolean;
  error?: string;
  state?: SessionEngineState;
  autoRevealed?: boolean;
  statistics?: RoundStatistics;
}

export type SessionEngineAction =
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'ADD_PARTICIPANT'; participant: Participant }
  | { type: 'START_ITEM_VOTING'; itemId?: number }
  | { type: 'SUBMIT_VOTE'; voterId: string; voterName: string; value: string }
  | { type: 'REVEAL_VOTES' }
  | { type: 'RE_VOTE' }
  | { type: 'SKIP_ITEM' }
  | { type: 'SET_FINAL_ESTIMATE'; finalEstimate: string }
  | { type: 'NEXT_ITEM' }
  | { type: 'GO_TO_ITEM'; index: number };

let _nextId = 1;
function nextId(): number {
  return _nextId++;
}

/** Reset internal ID counter — for tests only. */
export function resetSessionEngineIdCounter(startAt: number = 1): void {
  _nextId = startAt;
}

export function createInitialEngineState(params: {
  session: Omit<Session, 'id' | 'status'>;
  items: Omit<WorkItem, 'id' | 'sessionId' | 'status'>[];
  facilitator: Participant;
  deckValues?: string[];
}): SessionEngineState {
  const sessionId = nextId();
  const session: Session = {
    ...params.session,
    id: sessionId,
    status: SessionStatus.Lobby
  };

  const items: WorkItem[] = params.items
    .map((item, index) => ({
      ...item,
      id: nextId(),
      sessionId,
      orderIndex: item.orderIndex ?? index,
      status: WorkItemStatus.Pending
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    session,
    items,
    participants: [params.facilitator],
    rounds: [],
    votes: [],
    currentItemIndex: 0,
    deckValues: params.deckValues
  };
}

function cloneState(state: SessionEngineState): SessionEngineState {
  return {
    session: { ...state.session, options: { ...state.session.options } },
    items: state.items.map((item) => ({ ...item })),
    participants: state.participants.map((p) => ({ ...p })),
    rounds: state.rounds.map((r) => ({ ...r })),
    votes: state.votes.map((v) => ({ ...v })),
    currentItemIndex: state.currentItemIndex,
    deckValues: state.deckValues ? [...state.deckValues] : undefined
  };
}

function getCurrentItem(state: SessionEngineState): WorkItem | undefined {
  return state.items[state.currentItemIndex];
}

function getCurrentRound(state: SessionEngineState): Round | undefined {
  const item = getCurrentItem(state);
  if (!item) {
    return undefined;
  }
  const itemRounds = state.rounds
    .filter((r) => r.itemId === item.id)
    .sort((a, b) => b.roundNumber - a.roundNumber);
  return itemRounds[0];
}

function getVoteTypeForItem(state: SessionEngineState, item: WorkItem): SessionType {
  return item.voteType ?? state.session.type;
}

function getEligibleVoters(state: SessionEngineState): Participant[] {
  return state.participants.filter(
    (p) => p.role === ParticipantRole.Voter || p.role === ParticipantRole.Facilitator || p.role === ParticipantRole.CoFacilitator
  );
}

function getRoundVotes(state: SessionEngineState, roundId: number): Vote[] {
  return state.votes.filter((v) => v.roundId === roundId);
}

function shouldAnonymizeVote(options: SessionOptions): boolean {
  return options.anonymity === AnonymityMode.True;
}

function buildVoteValidationContext(state: SessionEngineState, item: WorkItem): VoteValidationContext {
  const voteType = getVoteTypeForItem(state, item);
  const context: VoteValidationContext = {
    deckValues: state.deckValues,
    dotBudget: state.session.options.dotBudget,
    surveyChoices: state.session.options.surveyOptions?.choices,
    allowMultiple: state.session.options.surveyOptions?.allowMultiple
  };

  if (voteType === SessionType.Dot) {
    context.existingDotVotes = {};
  }

  return context;
}

function allEligibleVotersHaveVoted(state: SessionEngineState, round: Round): boolean {
  const voters = getEligibleVoters(state);
  const roundVotes = getRoundVotes(state, round.id);
  return voters.every((voter) => roundVotes.some((v) => v.voterId === voter.id));
}

function lockRoundVotes(state: SessionEngineState, roundId: number): void {
  state.votes.forEach((vote) => {
    if (vote.roundId === roundId) {
      vote.locked = true;
    }
  });
}

function revealRound(state: SessionEngineState, round: Round): RoundStatistics {
  round.state = RoundState.Revealed;
  round.revealedAt = new Date().toISOString();
  lockRoundVotes(state, round.id);

  const item = state.items.find((i) => i.id === round.itemId);
  if (item) {
    item.status = WorkItemStatus.Revealed;
  }

  const itemRef = item || getCurrentItem(state);
  const voteType = itemRef ? getVoteTypeForItem(state, itemRef) : state.session.type;
  const strategy = getSessionTypeStrategy(voteType);
  const roundVotes = getRoundVotes(state, round.id);
  return strategy.computeStatistics(roundVotes, state.session.options);
}

/**
 * Pure state machine for session/round lifecycle. No I/O.
 */
export class SessionEngine {
  public static reduce(state: SessionEngineState, action: SessionEngineAction): EngineActionResult {
    const next = cloneState(state);

    switch (action.type) {
      case 'START_SESSION':
        return SessionEngine._startSession(next);
      case 'END_SESSION':
        return SessionEngine._endSession(next);
      case 'ADD_PARTICIPANT':
        return SessionEngine._addParticipant(next, action.participant);
      case 'START_ITEM_VOTING':
        return SessionEngine._startItemVoting(next, action.itemId);
      case 'SUBMIT_VOTE':
        return SessionEngine._submitVote(next, action.voterId, action.voterName, action.value);
      case 'REVEAL_VOTES':
        return SessionEngine._revealVotes(next);
      case 'RE_VOTE':
        return SessionEngine._reVote(next);
      case 'SKIP_ITEM':
        return SessionEngine._skipItem(next);
      case 'SET_FINAL_ESTIMATE':
        return SessionEngine._setFinalEstimate(next, action.finalEstimate);
      case 'NEXT_ITEM':
        return SessionEngine._nextItem(next);
      case 'GO_TO_ITEM':
        return SessionEngine._goToItem(next, action.index);
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  public static getCurrentRound(state: SessionEngineState): Round | undefined {
    return getCurrentRound(state);
  }

  public static getCurrentItem(state: SessionEngineState): WorkItem | undefined {
    return getCurrentItem(state);
  }

  public static getRoundStatistics(state: SessionEngineState, roundId: number): RoundStatistics | undefined {
    const round = state.rounds.find((r) => r.id === roundId);
    if (!round || round.state !== RoundState.Revealed) {
      return undefined;
    }
    const item = state.items.find((i) => i.id === round.itemId);
    if (!item) {
      return undefined;
    }
    const voteType = getVoteTypeForItem(state, item);
    const strategy = getSessionTypeStrategy(voteType);
    return strategy.computeStatistics(getRoundVotes(state, roundId), state.session.options);
  }

  private static _startSession(state: SessionEngineState): EngineActionResult {
    if (state.session.status !== SessionStatus.Lobby) {
      return { success: false, error: 'Session can only start from lobby' };
    }
    state.session.status = SessionStatus.Active;
    return { success: true, state };
  }

  private static _endSession(state: SessionEngineState): EngineActionResult {
    state.session.status = SessionStatus.Ended;
    return { success: true, state };
  }

  private static _addParticipant(state: SessionEngineState, participant: Participant): EngineActionResult {
    if (state.participants.some((p) => p.id === participant.id)) {
      return { success: false, error: 'Participant already joined' };
    }
    state.participants.push(participant);
    return { success: true, state };
  }

  private static _startItemVoting(state: SessionEngineState, itemId?: number): EngineActionResult {
    if (state.session.status !== SessionStatus.Active) {
      return { success: false, error: 'Session must be active to start voting' };
    }

    let item: WorkItem | undefined;
    if (itemId !== undefined) {
      const index = state.items.findIndex((i) => i.id === itemId);
      if (index < 0) {
        return { success: false, error: 'Item not found' };
      }
      state.currentItemIndex = index;
      item = state.items[index];
    } else {
      item = getCurrentItem(state);
    }

    if (!item) {
      return { success: false, error: 'No items in session' };
    }

    if (item.status === WorkItemStatus.Done) {
      return { success: false, error: 'Item is already done' };
    }

    const existingOpen = state.rounds.find((r) => r.itemId === item!.id && r.state === RoundState.Open);
    if (existingOpen) {
      return { success: false, error: 'Item already has an open round' };
    }

    const priorRounds = state.rounds.filter((r) => r.itemId === item!.id);
    const round: Round = {
      id: nextId(),
      itemId: item.id,
      roundNumber: priorRounds.length + 1,
      state: RoundState.Open,
      openedAt: new Date().toISOString()
    };

    item.status = WorkItemStatus.Voting;
    state.rounds.push(round);
    return { success: true, state };
  }

  private static _submitVote(
    state: SessionEngineState,
    voterId: string,
    voterName: string,
    value: string
  ): EngineActionResult {
    const round = getCurrentRound(state);
    if (!round) {
      return { success: false, error: 'No active round' };
    }
    if (round.state !== RoundState.Open) {
      return { success: false, error: 'Cannot vote on a revealed round' };
    }

    const item = state.items.find((i) => i.id === round.itemId);
    if (!item) {
      return { success: false, error: 'Round item not found' };
    }

    const existingVote = state.votes.find((v) => v.roundId === round.id && v.voterId === voterId);
    if (existingVote?.locked) {
      return { success: false, error: 'Cannot edit a locked vote' };
    }

    if (existingVote && !state.session.options.allowChangeBeforeReveal) {
      return { success: false, error: 'Vote changes are not allowed before reveal' };
    }

    const voteType = getVoteTypeForItem(state, item);
    const strategy = getSessionTypeStrategy(voteType);
    const validation = strategy.validateVoteValue(value, buildVoteValidationContext(state, item));
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const anonymize = shouldAnonymizeVote(state.session.options);
    const votePayload: Omit<Vote, 'id'> = {
      roundId: round.id,
      voterId: anonymize ? '' : voterId,
      voterName: anonymize ? '' : voterName,
      value,
      submittedAt: new Date().toISOString(),
      locked: false
    };

    if (existingVote) {
      existingVote.value = value;
      existingVote.submittedAt = votePayload.submittedAt;
    } else {
      state.votes.push({ ...votePayload, id: nextId() });
    }

    let autoRevealed = false;
    let statistics: RoundStatistics | undefined;

    if (state.session.options.autoReveal && allEligibleVotersHaveVoted(state, round)) {
      statistics = revealRound(state, round);
      autoRevealed = true;
    }

    return { success: true, state, autoRevealed, statistics };
  }

  private static _revealVotes(state: SessionEngineState): EngineActionResult {
    const round = getCurrentRound(state);
    if (!round) {
      return { success: false, error: 'No active round' };
    }
    if (round.state !== RoundState.Open) {
      return { success: false, error: 'Round is already revealed' };
    }

    const statistics = revealRound(state, round);
    return { success: true, state, statistics };
  }

  private static _reVote(state: SessionEngineState): EngineActionResult {
    const round = getCurrentRound(state);
    if (!round) {
      return { success: false, error: 'No round to re-vote' };
    }
    if (round.state !== RoundState.Revealed) {
      return { success: false, error: 'Can only re-vote after reveal' };
    }

    const item = state.items.find((i) => i.id === round.itemId);
    if (!item) {
      return { success: false, error: 'Round item not found' };
    }

    const newRound: Round = {
      id: nextId(),
      itemId: item.id,
      roundNumber: round.roundNumber + 1,
      state: RoundState.Open,
      openedAt: new Date().toISOString()
    };

    item.status = WorkItemStatus.Voting;
    state.rounds.push(newRound);
    return { success: true, state };
  }

  private static _skipItem(state: SessionEngineState): EngineActionResult {
    const item = getCurrentItem(state);
    if (!item) {
      return { success: false, error: 'No current item' };
    }

    const openRound = state.rounds.find((r) => r.itemId === item.id && r.state === RoundState.Open);
    if (openRound) {
      openRound.state = RoundState.Revealed;
      openRound.revealedAt = new Date().toISOString();
      lockRoundVotes(state, openRound.id);
    }

    item.status = WorkItemStatus.Done;
    return SessionEngine._nextItem(state);
  }

  private static _setFinalEstimate(state: SessionEngineState, finalEstimate: string): EngineActionResult {
    const item = getCurrentItem(state);
    if (!item) {
      return { success: false, error: 'No current item' };
    }

    const round = getCurrentRound(state);
    if (!round || round.state !== RoundState.Revealed) {
      return { success: false, error: 'Final estimate requires a revealed round' };
    }

    item.finalEstimate = finalEstimate;
    item.status = WorkItemStatus.Done;
    return { success: true, state };
  }

  private static _nextItem(state: SessionEngineState): EngineActionResult {
    if (state.currentItemIndex >= state.items.length - 1) {
      state.session.status = SessionStatus.Ended;
      return { success: true, state };
    }

    state.currentItemIndex += 1;
    const nextItem = getCurrentItem(state);
    if (nextItem && nextItem.status === WorkItemStatus.Pending) {
      // ready for facilitator to start voting
    }
    return { success: true, state };
  }

  private static _goToItem(state: SessionEngineState, index: number): EngineActionResult {
    if (index < 0 || index >= state.items.length) {
      return { success: false, error: 'Item not found' };
    }
    const openRound = state.rounds.find(
      (r) => r.itemId === getCurrentItem(state)?.id && r.state === RoundState.Open
    );
    if (openRound) {
      return { success: false, error: 'Reveal or skip the current item before navigating' };
    }
    state.currentItemIndex = index;
    return { success: true, state };
  }

  /** Summary stats for a completed session. */
  public static getSessionSummary(state: SessionEngineState): {
    total: number;
    estimated: number;
    skipped: number;
    pending: number;
    items: WorkItem[];
  } {
    const items = [...state.items].sort((a, b) => a.orderIndex - b.orderIndex);
    const skipped = items.filter((i) => i.finalEstimate === 'skipped').length;
    const estimated = items.filter(
      (i) => i.status === WorkItemStatus.Done && i.finalEstimate && i.finalEstimate !== 'skipped'
    ).length;
    const pending = items.filter((i) => i.status === WorkItemStatus.Pending).length;
    return { total: items.length, estimated, skipped, pending, items };
  }
}

/** Factory helper for tests and future UI. */
export function createTestSessionState(overrides?: Partial<SessionEngineState>): SessionEngineState {
  const base = createInitialEngineState({
    session: {
      title: 'Test Session',
      code: 'ABC123',
      type: SessionType.Poker,
      facilitatorId: 'facilitator-1',
      coFacilitators: [],
      options: { ...DEFAULT_SESSION_OPTIONS },
      createdBy: 'facilitator-1'
    },
    items: [{ title: 'Story 1', orderIndex: 0 }],
    facilitator: {
      id: 'facilitator-1',
      displayName: 'Facilitator',
      role: ParticipantRole.Facilitator,
      joinedAt: new Date().toISOString()
    },
    deckValues: ['1', '2', '3', '5', '8']
  });

  return overrides ? { ...base, ...overrides } : base;
}
