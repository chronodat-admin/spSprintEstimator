import { SessionOptions } from '../models/SessionOptions';
import { SessionType } from '../models/SessionType';
import { Vote } from '../models/Vote';

export interface VoteValidationContext {
  deckValues?: string[];
  dotBudget?: number;
  existingDotVotes?: Record<string, number>;
  surveyChoices?: string[];
  allowMultiple?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface RoundStatistics {
  average?: number;
  median?: number;
  mode?: string;
  /** Poker: suggested final from actual deck cards played (never a decimal average). */
  suggestedFinalEstimate?: string;
  min?: number;
  max?: number;
  minVoterIds: string[];
  maxVoterIds: string[];
  consensus: boolean;
  votedCount: number;
  /** Confidence: pass when median >= threshold. */
  thresholdPassed?: boolean;
  /** Fist-of-five: voters who scored ≤2. */
  lowConfidenceVoterIds?: string[];
  /** Dot voting: value is JSON map of itemId -> dots. */
  dotDistribution?: Record<string, number>;
  /** Survey: choice -> count. */
  choiceCounts?: Record<string, number>;
}

export interface ISessionTypeStrategy {
  readonly type: SessionType;
  validateVoteValue(value: string, context: VoteValidationContext): ValidationResult;
  computeStatistics(votes: Vote[], options: SessionOptions): RoundStatistics;
  parseNumericValue(value: string): number | undefined;
}

function median(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mode(values: string[]): string | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const counts: Record<string, number> = {};
  values.forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });
  let best: string | undefined;
  let bestCount = 0;
  Object.keys(counts).forEach((key) => {
    if (counts[key] > bestCount) {
      best = key;
      bestCount = counts[key];
    }
  });
  return best;
}

class PokerStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.Poker;

  public validateVoteValue(value: string, context: VoteValidationContext): ValidationResult {
    const deck = context.deckValues || [];
    if (deck.indexOf(value) < 0) {
      return { valid: false, error: 'Vote must be a valid deck card' };
    }
    return { valid: true };
  }

  public parseNumericValue(value: string): number | undefined {
    if (value === '?' || value === '∞' || value === '☕') {
      return undefined;
    }
    if (value === '½') {
      return 0.5;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  public computeStatistics(votes: Vote[], _options: SessionOptions): RoundStatistics {
    const numericVotes = votes
      .map((v) => ({ vote: v, num: this.parseNumericValue(v.value) }))
      .filter((entry): entry is { vote: Vote; num: number } => entry.num !== undefined);

    const numbers = numericVotes.map((entry) => entry.num);
    const avg = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : undefined;
    const med = median(numbers);
    const values = votes.map((v) => v.value);
    const consensus = values.length > 0 && values.every((v) => v === values[0]);

    let min: number | undefined;
    let max: number | undefined;
    const minVoterIds: string[] = [];
    const maxVoterIds: string[] = [];

    if (numbers.length > 0) {
      min = Math.min(...numbers);
      max = Math.max(...numbers);
      numericVotes.forEach(({ vote, num }) => {
        if (num === min && vote.voterId) {
          minVoterIds.push(vote.voterId);
        }
        if (num === max && vote.voterId) {
          maxVoterIds.push(vote.voterId);
        }
      });
    }

    return {
      average: avg,
      median: med,
      mode: mode(values),
      suggestedFinalEstimate: PokerStrategy._suggestFinalEstimate(numericVotes),
      min,
      max,
      minVoterIds,
      maxVoterIds,
      consensus,
      votedCount: votes.length
    };
  }

  /** Pick a deck card from votes — upper median when spread, consensus card when aligned. */
  private static _suggestFinalEstimate(
    numericVotes: Array<{ vote: Vote; num: number }>
  ): string | undefined {
    if (numericVotes.length === 0) {
      return undefined;
    }
    const sorted = [...numericVotes].sort((a, b) => a.num - b.num);
    if (sorted.every((entry) => entry.vote.value === sorted[0].vote.value)) {
      return sorted[0].vote.value;
    }
    const index = sorted.length % 2 === 0 ? sorted.length / 2 : Math.floor(sorted.length / 2);
    return sorted[index].vote.value;
  }
}

class ConfidenceStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.Confidence;

  public validateVoteValue(value: string, _context: VoteValidationContext): ValidationResult {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 5) {
      return { valid: false, error: 'Confidence vote must be 1–5' };
    }
    return { valid: true };
  }

  public parseNumericValue(value: string): number | undefined {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  public computeStatistics(votes: Vote[], options: SessionOptions): RoundStatistics {
    const numbers = votes.map((v) => this.parseNumericValue(v.value)).filter((n): n is number => n !== undefined);
    const threshold = options.threshold ?? 3;
    const med = median(numbers);
    const choiceCounts: Record<string, number> = {};
    votes.forEach((v) => {
      choiceCounts[v.value] = (choiceCounts[v.value] || 0) + 1;
    });

    return {
      average: numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : undefined,
      median: med,
      mode: mode(votes.map((v) => v.value)),
      min: numbers.length > 0 ? Math.min(...numbers) : undefined,
      max: numbers.length > 0 ? Math.max(...numbers) : undefined,
      minVoterIds: [],
      maxVoterIds: [],
      consensus: numbers.length > 0 && numbers.every((n) => n === numbers[0]),
      votedCount: votes.length,
      thresholdPassed: med !== undefined && med >= threshold,
      choiceCounts
    };
  }
}

class FistOfFiveStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.FistOfFive;

  public validateVoteValue(value: string, _context: VoteValidationContext): ValidationResult {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 5) {
      return { valid: false, error: 'Fist-of-five vote must be 0–5' };
    }
    return { valid: true };
  }

  public parseNumericValue(value: string): number | undefined {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  public computeStatistics(votes: Vote[], _options: SessionOptions): RoundStatistics {
    const numbers = votes.map((v) => this.parseNumericValue(v.value)).filter((n): n is number => n !== undefined);
    const lowConfidenceVoterIds = votes
      .filter((v) => {
        const num = this.parseNumericValue(v.value);
        return num !== undefined && num <= 2 && !!v.voterId;
      })
      .map((v) => v.voterId);

    return {
      average: numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : undefined,
      median: median(numbers),
      mode: mode(votes.map((v) => v.value)),
      min: numbers.length > 0 ? Math.min(...numbers) : undefined,
      max: numbers.length > 0 ? Math.max(...numbers) : undefined,
      minVoterIds: lowConfidenceVoterIds,
      maxVoterIds: [],
      consensus: numbers.length > 0 && numbers.every((n) => n === numbers[0]),
      votedCount: votes.length,
      lowConfidenceVoterIds
    };
  }
}

class RomanStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.Roman;
  private readonly _valid = ['👍', '😐', '👎'];

  public validateVoteValue(value: string, _context: VoteValidationContext): ValidationResult {
    if (this._valid.indexOf(value) < 0) {
      return { valid: false, error: 'Roman vote must be 👍, 😐, or 👎' };
    }
    return { valid: true };
  }

  public parseNumericValue(value: string): number | undefined {
    const map: Record<string, number> = { '👍': 1, '😐': 0, '👎': -1 };
    return map[value];
  }

  public computeStatistics(votes: Vote[], _options: SessionOptions): RoundStatistics {
    const values = votes.map((v) => v.value);
    return {
      mode: mode(values),
      consensus: values.length > 0 && values.every((v) => v === values[0]),
      votedCount: votes.length,
      minVoterIds: [],
      maxVoterIds: [],
      choiceCounts: values.reduce((acc: Record<string, number>, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

class DotStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.Dot;

  public validateVoteValue(value: string, context: VoteValidationContext): ValidationResult {
    let distribution: Record<string, number>;
    try {
      distribution = JSON.parse(value) as Record<string, number>;
    } catch {
      return { valid: false, error: 'Dot vote must be valid JSON' };
    }

    const budget = context.dotBudget ?? 0;
    let total = 0;
    for (const key of Object.keys(distribution)) {
      const dots = distribution[key];
      if (typeof dots !== 'number' || dots < 0 || !Number.isInteger(dots)) {
        return { valid: false, error: 'Each item dot count must be a non-negative integer' };
      }
      total += dots;
    }

    if (total > budget) {
      return { valid: false, error: `Dot budget exceeded (${total}/${budget})` };
    }
    return { valid: true };
  }

  public parseNumericValue(_value: string): number | undefined {
    return undefined;
  }

  public computeStatistics(votes: Vote[], _options: SessionOptions): RoundStatistics {
    const distribution: Record<string, number> = {};
    votes.forEach((vote) => {
      try {
        const map = JSON.parse(vote.value) as Record<string, number>;
        Object.keys(map).forEach((itemId) => {
          distribution[itemId] = (distribution[itemId] || 0) + map[itemId];
        });
      } catch {
        // ignore malformed votes in aggregate
      }
    });

    return {
      votedCount: votes.length,
      minVoterIds: [],
      maxVoterIds: [],
      consensus: false,
      dotDistribution: distribution
    };
  }
}

class SurveyStrategy implements ISessionTypeStrategy {
  public readonly type = SessionType.Survey;

  public validateVoteValue(value: string, context: VoteValidationContext): ValidationResult {
    const choices = context.surveyChoices || [];
    const allowMultiple = context.allowMultiple ?? false;

    if (allowMultiple) {
      let selected: string[];
      try {
        selected = JSON.parse(value) as string[];
      } catch {
        return { valid: false, error: 'Multi-select survey vote must be a JSON array' };
      }
      for (const choice of selected) {
        if (choices.indexOf(choice) < 0) {
          return { valid: false, error: `Invalid choice: ${choice}` };
        }
      }
      return { valid: true };
    }

    if (choices.indexOf(value) < 0 && value.trim().length === 0) {
      return { valid: false, error: 'Survey vote must be a valid choice or free text' };
    }
    return { valid: true };
  }

  public parseNumericValue(_value: string): number | undefined {
    return undefined;
  }

  public computeStatistics(votes: Vote[], _options: SessionOptions): RoundStatistics {
    const choiceCounts: Record<string, number> = {};
    votes.forEach((vote) => {
      try {
        const parsed = JSON.parse(vote.value) as string | string[];
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            choiceCounts[c] = (choiceCounts[c] || 0) + 1;
          });
        } else {
          choiceCounts[parsed] = (choiceCounts[parsed] || 0) + 1;
        }
      } catch {
        choiceCounts[vote.value] = (choiceCounts[vote.value] || 0) + 1;
      }
    });

    return {
      votedCount: votes.length,
      minVoterIds: [],
      maxVoterIds: [],
      consensus: false,
      choiceCounts,
      mode: mode(votes.map((v) => v.value))
    };
  }
}

const strategies: Record<SessionType, ISessionTypeStrategy> = {
  [SessionType.Poker]: new PokerStrategy(),
  [SessionType.Confidence]: new ConfidenceStrategy(),
  [SessionType.FistOfFive]: new FistOfFiveStrategy(),
  [SessionType.Roman]: new RomanStrategy(),
  [SessionType.Dot]: new DotStrategy(),
  [SessionType.Survey]: new SurveyStrategy()
};

export function getSessionTypeStrategy(type: SessionType): ISessionTypeStrategy {
  return strategies[type];
}
