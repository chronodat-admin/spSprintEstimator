import { AnonymityMode } from './SessionType';
import { Participant } from './Participant';

/** Session-level configuration persisted as OptionsJson on Estimatr_Sessions. */
export interface SessionOptions {
  autoReveal: boolean;
  anonymity: AnonymityMode;
  timerSeconds?: number;
  allowChangeBeforeReveal: boolean;
  /** Confidence votes: minimum score to pass (default 3). */
  threshold?: number;
  /** Async mode: no live roster pressure; reveal at deadline or facilitator action. */
  asyncMode?: boolean;
  asyncDeadline?: string;
  /** Dot voting: total dots each participant may distribute. */
  dotBudget?: number;
  /** Survey-specific question configuration. */
  surveyOptions?: SurveyOptions;
  /** Lobby roster persisted for cross-client polling. */
  roster?: Participant[];
  /** Facilitator's current backlog pointer — persisted for skip/back navigation. */
  currentItemIndex?: number;
  /** Optional backlog writeback targets set during import. */
  integration?: IntegrationMetadata;
}

export interface IntegrationMetadata {
  adoOrg?: string;
  adoProject?: string;
}

export interface SurveyOptions {
  question: string;
  choices: string[];
  allowMultiple: boolean;
  allowFreeText: boolean;
}

export const DEFAULT_SESSION_OPTIONS: SessionOptions = {
  autoReveal: false,
  anonymity: AnonymityMode.Off,
  allowChangeBeforeReveal: true,
  threshold: 3,
  dotBudget: 3
};
