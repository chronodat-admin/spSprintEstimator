import { SessionType, WorkItemStatus } from './SessionType';

export interface WorkItem {
  id: number;
  sessionId: number;
  title: string;
  description?: string;
  externalLink?: string;
  externalRef?: string;
  orderIndex: number;
  finalEstimate?: string;
  status: WorkItemStatus;
  /** Per-item vote type for mixed queues; falls back to session type when unset. */
  voteType?: SessionType;
}

export interface WorkItemListItem {
  Id: number;
  Title: string;
  SessionId: number;
  Description?: string;
  ExternalLink?: string;
  ExternalRef?: string;
  OrderIndex: number;
  FinalEstimate?: string;
  Status: string;
  VoteType?: string;
}
