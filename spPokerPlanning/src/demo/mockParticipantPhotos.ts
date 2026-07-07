/**
 * TEMPORARY bundled portrait images for mock demo roster users.
 * Remove with src/demo/ when mock data is no longer needed.
 */

const samRiveraPhoto: string = require('./assets/sam-rivera.jpg');
const jordanLeePhoto: string = require('./assets/jordan-lee.jpg');
const alexChenPhoto: string = require('./assets/alex-chen.jpg');
const morganPatelPhoto: string = require('./assets/morgan-patel.jpg');
const taylorBrooksPhoto: string = require('./assets/taylor-brooks.jpg');

export const MOCK_PARTICIPANT_PHOTO_URLS: Record<string, string> = {
  'mock-sam-rivera': samRiveraPhoto,
  'mock-jordan-lee': jordanLeePhoto,
  'mock-alex-chen': alexChenPhoto,
  'mock-morgan-patel': morganPatelPhoto,
  'mock-taylor-brooks': taylorBrooksPhoto
};

export function isMockParticipantId(userId: string): boolean {
  return userId in MOCK_PARTICIPANT_PHOTO_URLS;
}

export function getMockParticipantPhotoUrl(userId: string): string | undefined {
  return MOCK_PARTICIPANT_PHOTO_URLS[userId];
}
