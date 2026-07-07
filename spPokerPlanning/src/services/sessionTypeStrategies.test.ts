import { DEFAULT_SESSION_OPTIONS } from '../models';
import { SessionType } from '../models/SessionType';
import { Vote } from '../models/Vote';
import { getSessionTypeStrategy } from './sessionTypeStrategies';

describe('sessionTypeStrategies', () => {
  it('validates poker deck membership', () => {
    const strategy = getSessionTypeStrategy(SessionType.Poker);
    expect(strategy.validateVoteValue('5', { deckValues: ['1', '5', '8'] }).valid).toBe(true);
    expect(strategy.validateVoteValue('99', { deckValues: ['1', '5', '8'] }).valid).toBe(false);
  });

  it('parses poker half card', () => {
    const strategy = getSessionTypeStrategy(SessionType.Poker);
    expect(strategy.parseNumericValue('½')).toBe(0.5);
    expect(strategy.parseNumericValue('?')).toBeUndefined();
  });

  it('validates roman thumb votes', () => {
    const strategy = getSessionTypeStrategy(SessionType.Roman);
    expect(strategy.validateVoteValue('👍', {}).valid).toBe(true);
    expect(strategy.validateVoteValue('invalid', {}).valid).toBe(false);
    const stats = strategy.computeStatistics(
      [{ id: 1, roundId: 1, voterId: 'a', voterName: 'A', value: '👍', submittedAt: '', locked: true }],
      DEFAULT_SESSION_OPTIONS
    );
    expect(stats.consensus).toBe(true);
  });

  it('validates and aggregates survey votes', () => {
    const strategy = getSessionTypeStrategy(SessionType.Survey);
    const ctx = { surveyChoices: ['Yes', 'No'], allowMultiple: false };
    expect(strategy.validateVoteValue('Yes', ctx).valid).toBe(true);
    expect(strategy.validateVoteValue('', ctx).valid).toBe(false);

    const multiCtx = { surveyChoices: ['A', 'B'], allowMultiple: true };
    expect(strategy.validateVoteValue(JSON.stringify(['A', 'B']), multiCtx).valid).toBe(true);

    const stats = strategy.computeStatistics(
      [
        { id: 1, roundId: 1, voterId: 'a', voterName: 'A', value: 'Yes', submittedAt: '', locked: true },
        { id: 2, roundId: 1, voterId: 'b', voterName: 'B', value: 'No', submittedAt: '', locked: true }
      ] as Vote[],
      DEFAULT_SESSION_OPTIONS
    );
    expect(stats.choiceCounts).toEqual({ Yes: 1, No: 1 });
  });

  it('suggests a deck card for poker final estimate, not a decimal average', () => {
    const strategy = getSessionTypeStrategy(SessionType.Poker);
    const stats = strategy.computeStatistics(
      [
        { id: 1, roundId: 1, voterId: 'a', voterName: 'A', value: '5', submittedAt: '', locked: true },
        { id: 2, roundId: 1, voterId: 'b', voterName: 'B', value: '8', submittedAt: '', locked: true }
      ] as Vote[],
      DEFAULT_SESSION_OPTIONS
    );
    expect(stats.median).toBe(6.5);
    expect(stats.suggestedFinalEstimate).toBe('8');
  });

  it('rejects invalid dot distribution JSON', () => {
    const strategy = getSessionTypeStrategy(SessionType.Dot);
    expect(strategy.validateVoteValue('not-json', { dotBudget: 3 }).valid).toBe(false);
  });
});
