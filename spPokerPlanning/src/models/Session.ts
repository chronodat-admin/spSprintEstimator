import { SessionOptions } from './SessionOptions';
import { SessionStatus, SessionType } from './SessionType';

export interface Session {
  id: number;
  title: string;
  code: string;
  type: SessionType;
  status: SessionStatus;
  facilitatorId: string;
  coFacilitators: string[];
  deckJson?: string;
  options: SessionOptions;
  createdBy: string;
  expiresAt?: string;
  sprintTag?: string;
}

export interface SessionListItem {
  Id: number;
  Title: string;
  Code: string;
  Type: string;
  Status: string;
  FacilitatorId: string;
  CoFacilitators?: string;
  DeckJson?: string;
  OptionsJson: string;
  CreatedBy: string;
  ExpiresAt?: string;
  SprintTag?: string;
}
