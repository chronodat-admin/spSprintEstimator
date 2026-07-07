/** Stable pseudonymous voter id per session — avoids SharePoint vote row collisions. */
export function getAnonymousVoterId(sessionId: number, userId: string): string {
  let hash = 0;
  const input = `${sessionId}:${userId}`;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return `anon_${Math.abs(hash)}`;
}
