import { ParticipantRole } from './SessionType';

export interface Participant {
  id: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
  /** Used for profile photos and presence lookups. */
  email?: string;
}
