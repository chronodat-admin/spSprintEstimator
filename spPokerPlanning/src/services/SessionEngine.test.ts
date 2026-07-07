import {
  AnonymityMode,
  DEFAULT_SESSION_OPTIONS,
  ParticipantRole,
  RoundState,
  SessionStatus,
  SessionType,
  WorkItemStatus
} from '../models';
import {
  createInitialEngineState,
  createTestSessionState,
  resetSessionEngineIdCounter,
  SessionEngine
} from './SessionEngine';

function advanceToVoting(): ReturnType<typeof createTestSessionState> {
  resetSessionEngineIdCounter(100);
  let current = createTestSessionState();
  let result = SessionEngine.reduce(current, { type: 'START_SESSION' });
  expect(result.success).toBe(true);
  current = result.state!;

  result = SessionEngine.reduce(current, {
    type: 'ADD_PARTICIPANT',
    participant: {
      id: 'voter-1',
      displayName: 'Voter One',
      role: ParticipantRole.Voter,
      joinedAt: new Date().toISOString()
    }
  });
  current = result.state!;

  result = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' });
  expect(result.success).toBe(true);
  return result.state!;
}

describe('SessionEngine', () => {
  beforeEach(() => {
    resetSessionEngineIdCounter(1);
  });

  describe('session lifecycle', () => {
    it('starts session from lobby', () => {
      const state = createTestSessionState();
      expect(state.session.status).toBe(SessionStatus.Lobby);

      const result = SessionEngine.reduce(state, { type: 'START_SESSION' });
      expect(result.success).toBe(true);
      expect(result.state!.session.status).toBe(SessionStatus.Active);
    });

    it('rejects start when not in lobby', () => {
      let state = createTestSessionState();
      state = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      const result = SessionEngine.reduce(state, { type: 'START_SESSION' });
      expect(result.success).toBe(false);
    });

    it('ends session', () => {
      let state = createTestSessionState();
      state = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      const result = SessionEngine.reduce(state, { type: 'END_SESSION' });
      expect(result.state!.session.status).toBe(SessionStatus.Ended);
    });
  });

  describe('voting rules', () => {
    it('cannot vote when round is revealed', () => {
      let state = advanceToVoting();

      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;

      state = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' }).state!;

      const result = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '5'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/revealed/i);
    });

    it('cannot edit locked votes after reveal', () => {
      let state = advanceToVoting();
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;
      state = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' }).state!;

      const vote = state.votes.find((v) => v.voterId === 'facilitator-1');
      expect(vote?.locked).toBe(true);

      const reVoteResult = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '8'
      });
      expect(reVoteResult.success).toBe(false);
      expect(reVoteResult.error).toMatch(/revealed/i);
    });

    it('re-vote creates a new round with incremented round number', () => {
      let state = advanceToVoting();
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;
      state = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' }).state!;

      const round1 = SessionEngine.getCurrentRound(state);
      expect(round1?.roundNumber).toBe(1);

      state = SessionEngine.reduce(state, { type: 'RE_VOTE' }).state!;
      const round2 = SessionEngine.getCurrentRound(state);
      expect(round2?.roundNumber).toBe(2);
      expect(round2?.state).toBe(RoundState.Open);
    });

    it('auto-reveals when all eligible voters have voted and autoReveal is enabled', () => {
      resetSessionEngineIdCounter(200);
      let state = createTestSessionState({
        session: {
          ...createTestSessionState().session,
          options: { ...DEFAULT_SESSION_OPTIONS, autoReveal: true }
        }
      });

      state = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      state = SessionEngine.reduce(state, {
        type: 'ADD_PARTICIPANT',
        participant: {
          id: 'voter-1',
          displayName: 'Voter',
          role: ParticipantRole.Voter,
          joinedAt: new Date().toISOString()
        }
      }).state!;
      state = SessionEngine.reduce(state, { type: 'START_ITEM_VOTING' }).state!;

      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;

      const result = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'voter-1',
        voterName: 'Voter',
        value: '5'
      });

      expect(result.success).toBe(true);
      expect(result.autoRevealed).toBe(true);
      expect(SessionEngine.getCurrentRound(result.state!)?.state).toBe(RoundState.Revealed);
    });

    it('rejects vote change when allowChangeBeforeReveal is false', () => {
      resetSessionEngineIdCounter(300);
      let state = createTestSessionState({
        session: {
          ...createTestSessionState().session,
          options: { ...DEFAULT_SESSION_OPTIONS, allowChangeBeforeReveal: false }
        }
      });
      state = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      state = SessionEngine.reduce(state, { type: 'START_ITEM_VOTING' }).state!;

      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;

      const result = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '5'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('final estimate and navigation', () => {
    it('sets final estimate after reveal and marks item done', () => {
      let state = advanceToVoting();
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '5'
      }).state!;
      state = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' }).state!;

      state = SessionEngine.reduce(state, { type: 'SET_FINAL_ESTIMATE', finalEstimate: '5' }).state!;
      const item = SessionEngine.getCurrentItem(state);
      expect(item?.finalEstimate).toBe('5');
      expect(item?.status).toBe(WorkItemStatus.Done);
    });

    it('advances to next item and ends session after last item', () => {
      resetSessionEngineIdCounter(400);
      const state = createInitialEngineState({
        session: {
          title: 'Multi',
          code: 'MULTI1',
          type: SessionType.Poker,
          facilitatorId: 'facilitator-1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS },
          createdBy: 'facilitator-1'
        },
        items: [
          { title: 'A', orderIndex: 0 },
          { title: 'B', orderIndex: 1 }
        ],
        facilitator: {
          id: 'facilitator-1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        }
      });

      let current = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'NEXT_ITEM' }).state!;
      expect(SessionEngine.getCurrentItem(current)?.title).toBe('B');

      current = SessionEngine.reduce(current, { type: 'NEXT_ITEM' }).state!;
      expect(current.session.status).toBe(SessionStatus.Ended);
    });
  });

  describe('session type strategies', () => {
    it('confidence threshold pass/fail', () => {
      resetSessionEngineIdCounter(500);
      const state = createInitialEngineState({
        session: {
          title: 'Confidence',
          code: 'CONF01',
          type: SessionType.Confidence,
          facilitatorId: 'f1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS, threshold: 4 },
          createdBy: 'f1'
        },
        items: [{ title: 'Risk review', orderIndex: 0 }],
        facilitator: {
          id: 'f1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        }
      });

      let current = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;
      current = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '3'
      }).state!;
      current = SessionEngine.reduce(current, { type: 'REVEAL_VOTES' }).state!;

      const round = SessionEngine.getCurrentRound(current)!;
      const stats = SessionEngine.getRoundStatistics(current, round.id);
      expect(stats?.thresholdPassed).toBe(false);

      current = SessionEngine.reduce(current, { type: 'RE_VOTE' }).state!;
      current = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '5'
      }).state!;
      current = SessionEngine.reduce(current, { type: 'REVEAL_VOTES' }).state!;
      const statsPass = SessionEngine.getRoundStatistics(current, SessionEngine.getCurrentRound(current)!.id);
      expect(statsPass?.thresholdPassed).toBe(true);
    });

    it('fist-of-five flags voters with score ≤2', () => {
      resetSessionEngineIdCounter(600);
      let current = createInitialEngineState({
        session: {
          title: 'FoF',
          code: 'FOF001',
          type: SessionType.FistOfFive,
          facilitatorId: 'f1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS },
          createdBy: 'f1'
        },
        items: [{ title: 'Commitment', orderIndex: 0 }],
        facilitator: {
          id: 'f1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        }
      });

      current = SessionEngine.reduce(current, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, {
        type: 'ADD_PARTICIPANT',
        participant: {
          id: 'v1',
          displayName: 'V1',
          role: ParticipantRole.Voter,
          joinedAt: new Date().toISOString()
        }
      }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;
      current = SessionEngine.reduce(current, { type: 'SUBMIT_VOTE', voterId: 'f1', voterName: 'Fac', value: '1' }).state!;
      current = SessionEngine.reduce(current, { type: 'SUBMIT_VOTE', voterId: 'v1', voterName: 'V1', value: '4' }).state!;
      current = SessionEngine.reduce(current, { type: 'REVEAL_VOTES' }).state!;

      const stats = SessionEngine.getRoundStatistics(current, SessionEngine.getCurrentRound(current)!.id);
      expect(stats?.lowConfidenceVoterIds).toContain('f1');
      expect(stats?.lowConfidenceVoterIds).not.toContain('v1');
    });

    it('enforces dot budget', () => {
      resetSessionEngineIdCounter(700);
      let current = createInitialEngineState({
        session: {
          title: 'Dots',
          code: 'DOT001',
          type: SessionType.Dot,
          facilitatorId: 'f1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS, dotBudget: 3 },
          createdBy: 'f1'
        },
        items: [{ title: 'Theme A', orderIndex: 0 }],
        facilitator: {
          id: 'f1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        }
      });

      current = SessionEngine.reduce(current, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;

      const overBudget = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: JSON.stringify({ '1': 2, '2': 2 })
      });
      expect(overBudget.success).toBe(false);

      const valid = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: JSON.stringify({ '1': 2, '2': 1 })
      });
      expect(valid.success).toBe(true);
    });

    it('supports mixed queue vote types per item', () => {
      resetSessionEngineIdCounter(800);
      const base = createInitialEngineState({
        session: {
          title: 'Mixed',
          code: 'MIX001',
          type: SessionType.Poker,
          facilitatorId: 'f1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS },
          createdBy: 'f1'
        },
        items: [
          { title: 'Poker story', orderIndex: 0, voteType: SessionType.Poker },
          { title: 'Confidence check', orderIndex: 1, voteType: SessionType.Confidence }
        ],
        facilitator: {
          id: 'f1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        },
        deckValues: ['1', '2', '3', '5', '8']
      });

      let current = SessionEngine.reduce(base, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;

      const invalidConfidenceOnPoker = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '9'
      });
      expect(invalidConfidenceOnPoker.success).toBe(false);

      current = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '3'
      }).state!;
      current = SessionEngine.reduce(current, { type: 'REVEAL_VOTES' }).state!;
      current = SessionEngine.reduce(current, { type: 'SET_FINAL_ESTIMATE', finalEstimate: '3' }).state!;
      current = SessionEngine.reduce(current, { type: 'NEXT_ITEM' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;

      const invalidPokerOnConfidence = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '8'
      });
      expect(invalidPokerOnConfidence.success).toBe(false);

      const validConfidence = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'f1',
        voterName: 'Fac',
        value: '4'
      });
      expect(validConfidence.success).toBe(true);
    });

    it('true-anonymous mode strips voter identity from stored votes', () => {
      resetSessionEngineIdCounter(900);
      let current = createTestSessionState({
        session: {
          ...createTestSessionState().session,
          options: { ...DEFAULT_SESSION_OPTIONS, anonymity: AnonymityMode.True }
        }
      });
      current = SessionEngine.reduce(current, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;
      current = SessionEngine.reduce(current, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '5'
      }).state!;

      const vote = current.votes[0];
      expect(vote.voterId).toBe('');
      expect(vote.voterName).toBe('');
    });
  });

  describe('poker statistics', () => {
    it('computes consensus when all votes match', () => {
      let state = advanceToVoting();
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '5'
      }).state!;
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'voter-1',
        voterName: 'Voter One',
        value: '5'
      }).state!;

      const reveal = SessionEngine.reduce(state, { type: 'REVEAL_VOTES' });
      expect(reveal.statistics?.consensus).toBe(true);
      expect(reveal.statistics?.median).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('rejects duplicate participant', () => {
      const state = createTestSessionState();
      const result = SessionEngine.reduce(state, {
        type: 'ADD_PARTICIPANT',
        participant: {
          id: 'facilitator-1',
          displayName: 'Facilitator',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        }
      });
      expect(result.success).toBe(false);
    });

    it('skips current item and advances', () => {
      resetSessionEngineIdCounter(1000);
      const state = createInitialEngineState({
        session: {
          title: 'Skip',
          code: 'SKIP01',
          type: SessionType.Poker,
          facilitatorId: 'f1',
          coFacilitators: [],
          options: { ...DEFAULT_SESSION_OPTIONS },
          createdBy: 'f1'
        },
        items: [
          { title: 'First', orderIndex: 0 },
          { title: 'Second', orderIndex: 1 }
        ],
        facilitator: {
          id: 'f1',
          displayName: 'Fac',
          role: ParticipantRole.Facilitator,
          joinedAt: new Date().toISOString()
        },
        deckValues: ['1', '2', '3']
      });

      let current = SessionEngine.reduce(state, { type: 'START_SESSION' }).state!;
      current = SessionEngine.reduce(current, { type: 'START_ITEM_VOTING' }).state!;
      current = SessionEngine.reduce(current, { type: 'SKIP_ITEM' }).state!;
      expect(SessionEngine.getCurrentItem(current)?.title).toBe('Second');
    });

    it('rejects final estimate before reveal', () => {
      let state = advanceToVoting();
      state = SessionEngine.reduce(state, {
        type: 'SUBMIT_VOTE',
        voterId: 'facilitator-1',
        voterName: 'Facilitator',
        value: '3'
      }).state!;

      const result = SessionEngine.reduce(state, { type: 'SET_FINAL_ESTIMATE', finalEstimate: '3' });
      expect(result.success).toBe(false);
    });
  });
});
