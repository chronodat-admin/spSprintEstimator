export interface Vote {
  id: number;
  roundId: number;
  voterId: string;
  voterName: string;
  value: string;
  submittedAt: string;
  locked: boolean;
}

export interface VoteListItem {
  Id: number;
  RoundId: number;
  VoterId: string;
  VoterName: string;
  Value: string;
  SubmittedAt: string;
  Locked: boolean;
}
