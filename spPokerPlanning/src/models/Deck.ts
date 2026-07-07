export interface Deck {
  id: number;
  title: string;
  valuesJson: string;
  isDefault: boolean;
}

export interface DeckListItem {
  Id: number;
  Title: string;
  ValuesJson: string;
  IsDefault: boolean;
}

/** Standard planning poker deck including special cards. */
export const DEFAULT_POKER_VALUES: string[] = [
  '0', '½', '1', '2', '3', '5', '8', '13', '21', '?', '∞', '☕'
];
