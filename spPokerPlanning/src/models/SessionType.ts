export enum SessionType {
  Poker = 'poker',
  Confidence = 'confidence',
  FistOfFive = 'fistOfFive',
  Roman = 'roman',
  Dot = 'dot',
  Survey = 'survey'
}

export enum SessionStatus {
  Lobby = 'lobby',
  Active = 'active',
  Ended = 'ended'
}

export enum AnonymityMode {
  Off = 'off',
  FacilitatorOnly = 'facilitatorOnly',
  True = 'true'
}

export enum WorkItemStatus {
  Pending = 'pending',
  Voting = 'voting',
  Revealed = 'revealed',
  Done = 'done'
}

export enum RoundState {
  Open = 'open',
  Revealed = 'revealed'
}

export enum ParticipantRole {
  Facilitator = 'facilitator',
  CoFacilitator = 'coFacilitator',
  Voter = 'voter',
  Observer = 'observer'
}
