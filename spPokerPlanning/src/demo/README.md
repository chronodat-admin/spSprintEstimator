/**
 * TEMPORARY mock/demo mode for Sprint Align.
 * Remove this folder and enableMockData feature flag when no longer needed.
 *
 * Enable via Settings → Advanced → Mock demo data, or URL:
 * ?estimatrFlags={"enableMockData":true}
 */

export { buildDemoEngineState, MOCK_DEMO_SESSION_CODE, MOCK_TEAM_PARTICIPANTS } from './mockFixtures';
export { getMockParticipantPhotoUrl, MOCK_PARTICIPANT_PHOTO_URLS } from './mockParticipantPhotos';
export { DemoSessionRunner, isDemoSessionCode } from './DemoSessionRunner';
export { useSessionController } from './useSessionController';
