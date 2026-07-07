/**
 * TEMPORARY mock/demo fixtures for marketplace screenshots and UX testing.
 * Remove this folder when mock data is no longer needed.
 */
import {
  DEFAULT_SESSION_OPTIONS,
  Participant,
  ParticipantRole,
  Round,
  RoundState,
  Session,
  SessionStatus,
  SessionType,
  Vote,
  WorkItem,
  WorkItemStatus
} from '../models';
import { DEFAULT_POKER_VALUES } from '../models/Deck';
import { resetSessionEngineIdCounter, SessionEngineState } from '../services/SessionEngine';

export const MOCK_DEMO_SESSION_CODE = 'DEMO01';

export interface MockDemoUser {
  userId: string;
  userName: string;
  userEmail?: string;
}

export const MOCK_TEAM_PARTICIPANTS: Participant[] = [
  {
    id: 'mock-sam-rivera',
    displayName: 'Sam Rivera',
    role: ParticipantRole.Voter,
    joinedAt: new Date(Date.now() - 3600000).toISOString(),
    email: 'sam.rivera@demo.local'
  },
  {
    id: 'mock-jordan-lee',
    displayName: 'Jordan Lee',
    role: ParticipantRole.Voter,
    joinedAt: new Date(Date.now() - 3500000).toISOString(),
    email: 'jordan.lee@demo.local'
  },
  {
    id: 'mock-alex-chen',
    displayName: 'Alex Chen',
    role: ParticipantRole.Voter,
    joinedAt: new Date(Date.now() - 3400000).toISOString(),
    email: 'alex.chen@demo.local'
  },
  {
    id: 'mock-morgan-patel',
    displayName: 'Morgan Patel',
    role: ParticipantRole.Voter,
    joinedAt: new Date(Date.now() - 3300000).toISOString(),
    email: 'morgan.patel@demo.local'
  },
  {
    id: 'mock-taylor-brooks',
    displayName: 'Taylor Brooks',
    role: ParticipantRole.Voter,
    joinedAt: new Date(Date.now() - 3200000).toISOString(),
    email: 'taylor.brooks@demo.local'
  }
];

/** Fake presence for demo roster when Graph presence is off. */
export const MOCK_DEMO_PRESENCES: Record<string, import('../services/PhotoService').PresenceAvailability> = {
  'mock-sam-rivera': 'Available',
  'mock-jordan-lee': 'Available',
  'mock-alex-chen': 'Busy',
  'mock-morgan-patel': 'Available',
  'mock-taylor-brooks': 'Away'
};

export function buildDemoEngineState(user: MockDemoUser): SessionEngineState {
  resetSessionEngineIdCounter(900500);

  const sessionId = 900001;
  const facilitator: Participant = {
    id: user.userId,
    displayName: user.userName,
    role: ParticipantRole.Facilitator,
    joinedAt: new Date(Date.now() - 7200000).toISOString(),
    email: user.userEmail
  };

  const roster = [facilitator, ...MOCK_TEAM_PARTICIPANTS];
  const items: WorkItem[] = [
    {
      id: 900101,
      sessionId,
      title: 'User onboarding flow redesign',
      description: 'Simplify first-run setup and reduce time-to-first-session for new sites.',
      orderIndex: 0,
      status: WorkItemStatus.Voting
    },
    {
      id: 900102,
      sessionId,
      title: 'Export session history to CSV',
      description: 'Let facilitators download ended session results for reporting.',
      orderIndex: 1,
      status: WorkItemStatus.Pending
    },
    {
      id: 900103,
      sessionId,
      title: 'Teams tab integration polish',
      description: 'Improve layout and setup messaging when hosted inside Microsoft Teams.',
      orderIndex: 2,
      status: WorkItemStatus.Pending
    }
  ];

  const round: Round = {
    id: 900201,
    itemId: items[0].id,
    roundNumber: 1,
    state: RoundState.Open,
    openedAt: new Date(Date.now() - 900000).toISOString()
  };

  const now = new Date().toISOString();
  const votes: Vote[] = [
    {
      id: 900301,
      roundId: round.id,
      voterId: 'mock-sam-rivera',
      voterName: 'Sam Rivera',
      value: '5',
      submittedAt: now,
      locked: false
    },
    {
      id: 900302,
      roundId: round.id,
      voterId: 'mock-jordan-lee',
      voterName: 'Jordan Lee',
      value: '8',
      submittedAt: now,
      locked: false
    },
    {
      id: 900303,
      roundId: round.id,
      voterId: 'mock-morgan-patel',
      voterName: 'Morgan Patel',
      value: '13',
      submittedAt: now,
      locked: false
    }
  ];

  const session: Session = {
    id: sessionId,
    title: 'Demo Sprint Planning Workshop',
    code: MOCK_DEMO_SESSION_CODE,
    type: SessionType.Poker,
    status: SessionStatus.Active,
    facilitatorId: user.userId,
    coFacilitators: [],
    deckJson: JSON.stringify(DEFAULT_POKER_VALUES),
    options: {
      ...DEFAULT_SESSION_OPTIONS,
      roster,
      currentItemIndex: 0
    },
    createdBy: user.userName,
    sprintTag: 'Demo'
  };

  return {
    session,
    items,
    participants: roster,
    rounds: [round],
    votes,
    currentItemIndex: 0,
    deckValues: [...DEFAULT_POKER_VALUES]
  };
}
