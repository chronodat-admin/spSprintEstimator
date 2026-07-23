/**
 * TEMPORARY bundled portrait images for mock demo roster users.
 * Remove with src/demo/ when mock data is no longer needed.
 */

import samRiveraPhoto from './assets/sam-rivera.jpg';
import jordanLeePhoto from './assets/jordan-lee.jpg';
import alexChenPhoto from './assets/alex-chen.jpg';
import morganPatelPhoto from './assets/morgan-patel.jpg';
import taylorBrooksPhoto from './assets/taylor-brooks.jpg';

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
