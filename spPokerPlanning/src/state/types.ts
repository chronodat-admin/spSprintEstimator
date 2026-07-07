export type AppView =
  | 'home'
  | 'wizard'
  | 'lobby'
  | 'session'
  | 'history'
  | 'settings'
  | 'decks';

export type SettingsTabKey =
  | 'setup'
  | 'governance'
  | 'branding'
  | 'home'
  | 'layout'
  | 'advanced'
  | 'subscription';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface AppUiState {
  view: AppView;
  isProvisioned: boolean;
  settingsTab?: SettingsTabKey;
  toast?: ToastMessage;
  spectatorMode: boolean;
  joinCodeInput: string;
  savingVote?: boolean;
  optimisticVoteValue?: string;
  /** TEMPORARY: client-only demo workshop — remove with src/demo/ when no longer needed. */
  isMockSession?: boolean;
}

export const INITIAL_UI_STATE: AppUiState = {
  view: 'home',
  isProvisioned: false,
  spectatorMode: false,
  joinCodeInput: ''
};
