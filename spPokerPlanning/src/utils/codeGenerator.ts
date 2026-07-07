/** Characters that are easy to read aloud and distinguish (no 0/O, 1/I/l). */
const UNAMBIGUOUS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DEFAULT_CODE_LENGTH = 6;

/**
 * Generates a random session join code using unambiguous characters.
 */
export function generateSessionCode(length: number = DEFAULT_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length);
    code += UNAMBIGUOUS_CHARS.charAt(index);
  }
  return code;
}

export function isValidSessionCode(code: string): boolean {
  if (code.length !== DEFAULT_CODE_LENGTH) {
    return false;
  }
  return code.toUpperCase().split('').every((char) => UNAMBIGUOUS_CHARS.indexOf(char) >= 0);
}

export function parseSessionCodeFromUrl(search: string): string | undefined {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const code = params.get('estimatrSession');
  if (!code) {
    return undefined;
  }
  const normalized = code.trim().toUpperCase();
  return isValidSessionCode(normalized) ? normalized : undefined;
}

/** Remove session deep-link param so leaving the room does not auto-rejoin. */
export function clearSessionFromUrl(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  if (!url.searchParams.has('estimatrSession')) {
    return;
  }
  url.searchParams.delete('estimatrSession');
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}
