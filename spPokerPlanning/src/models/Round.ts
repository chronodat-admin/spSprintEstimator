import { RoundState } from './SessionType';

export interface Round {
  id: number;
  itemId: number;
  roundNumber: number;
  state: RoundState;
  openedAt: string;
  revealedAt?: string;
}

export interface RoundListItem {
  Id: number;
  ItemId: number;
  RoundNumber: number;
  State: string;
  OpenedAt: string;
  RevealedAt?: string;
}
