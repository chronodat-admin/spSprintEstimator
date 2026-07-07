/**
 * TEMPORARY: simulates mock team votes in demo workshops.
 * Remove with src/demo/ when mock data is no longer needed.
 */
import { RoundState } from '../models';
import { MOCK_TEAM_PARTICIPANTS } from './mockFixtures';
import { SessionEngine, SessionEngineState } from '../services/SessionEngine';

/** Poker estimates per mock voter, per backlog item index. */
const MOCK_VOTE_PLANS: string[][] = [
  ['5', '8', '13', '5', '3'],
  ['8', '8', '5', '13', '8'],
  ['3', '5', '5', '8', '3']
];

function getMockVoteValue(itemIndex: number, voterIndex: number): string {
  const plan = MOCK_VOTE_PLANS[itemIndex] || MOCK_VOTE_PLANS[0];
  return plan[voterIndex % plan.length] || '5';
}

function getPendingMockVoters(state: SessionEngineState, roundId: number): typeof MOCK_TEAM_PARTICIPANTS {
  return MOCK_TEAM_PARTICIPANTS.filter((participant) => {
    const existing = state.votes.find(
      (vote) => vote.roundId === roundId && vote.voterId === participant.id && (vote.value || vote.submittedAt)
    );
    return !existing;
  });
}

export interface ScheduleMockTeamVotesOptions {
  state: SessionEngineState;
  onUpdate: (updater: (current: SessionEngineState) => SessionEngineState) => void;
}

/**
 * Stagger mock team votes so facilitators see Card in! statuses during demos.
 * Returns a cleanup function to cancel pending timers.
 */
export function scheduleMockTeamVotes(options: ScheduleMockTeamVotesOptions): () => void {
  const round = SessionEngine.getCurrentRound(options.state);
  if (!round || round.state !== RoundState.Open) {
    return () => undefined;
  }

  const pending = getPendingMockVoters(options.state, round.id);
  if (pending.length === 0) {
    return () => undefined;
  }

  const timers: number[] = [];
  const roundId = round.id;
  const itemIndex = options.state.currentItemIndex;

  pending.forEach((participant, index) => {
    const voterIndex = MOCK_TEAM_PARTICIPANTS.findIndex((p) => p.id === participant.id);
    const delayMs = 600 + index * 900;
    const value = getMockVoteValue(itemIndex, voterIndex >= 0 ? voterIndex : index);

    timers.push(
      window.setTimeout(() => {
        options.onUpdate((current) => {
          const activeRound = SessionEngine.getCurrentRound(current);
          if (!activeRound || activeRound.id !== roundId || activeRound.state !== RoundState.Open) {
            return current;
          }

          const alreadyVoted = current.votes.some(
            (vote) => vote.roundId === roundId && vote.voterId === participant.id && (vote.value || vote.submittedAt)
          );
          if (alreadyVoted) {
            return current;
          }

          const result = SessionEngine.reduce(current, {
            type: 'SUBMIT_VOTE',
            voterId: participant.id,
            voterName: participant.displayName,
            value
          });

          return result.success && result.state ? result.state : current;
        });
      }, delayMs)
    );
  });

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}
