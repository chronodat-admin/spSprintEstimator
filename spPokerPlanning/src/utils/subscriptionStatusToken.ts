import type { ISubscriptionStatus } from '../models/ISubscription';

interface IStatusSigningKeyResponse {
  algorithm: string;
  issuer: string;
  audience: string;
  publicKey: string;
}

interface IStatusTokenPayload {
  status?: string;
  hasAccess?: boolean;
  tenantId?: string;
  siteUrl?: string;
  siteId?: string;
  productSlug?: string;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

let cachedCryptoKey: CryptoKey | undefined;
let verificationKeyPromise: Promise<CryptoKey | undefined> | undefined;

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJsonPart(value: string): IStatusTokenPayload {
  const text = new TextDecoder().decode(base64UrlToBytes(value));
  return JSON.parse(text) as IStatusTokenPayload;
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(pemContents);
  const spki = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    spki[i] = binary.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

async function getVerificationKey(apiBaseUrl: string): Promise<CryptoKey | undefined> {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  if (!verificationKeyPromise) {
    verificationKeyPromise = (async (): Promise<CryptoKey | undefined> => {
      const response = await fetch(`${apiBaseUrl}/api/subscription/status-signing-key`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        return undefined;
      }

      const data = (await response.json()) as IStatusSigningKeyResponse;
      if (!data.publicKey) {
        return undefined;
      }

      const importedKey = await importPublicKey(data.publicKey);
      cachedCryptoKey = importedKey;
      return importedKey;
    })();
  }

  return verificationKeyPromise;
}

export async function verifySubscriptionStatusToken(
  apiBaseUrl: string,
  statusToken: string,
  expected: {
    tenantId: string;
    siteUrl: string;
    siteId?: string;
    productSlug: string;
  }
): Promise<Pick<ISubscriptionStatus, 'status' | 'hasAccess'>> {
  const parts = statusToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid status token format.');
  }

  const header = decodeJsonPart(parts[0]) as { alg?: string };
  if (header.alg !== 'RS256') {
    throw new Error('Unsupported status token algorithm.');
  }

  const payload = decodeJsonPart(parts[1]);
  const key = await getVerificationKey(apiBaseUrl);
  if (!key) {
    throw new Error('Status signing key is not available.');
  }

  const signedBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToBytes(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedBytes);
  if (!valid) {
    throw new Error('Status token signature is invalid.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) {
    throw new Error('Status token has expired.');
  }

  if (payload.iss && payload.iss !== 'chronodat-subscription-api') {
    throw new Error('Status token issuer is invalid.');
  }

  const audience = payload.aud;
  const audiences = Array.isArray(audience) ? audience : audience ? [audience] : [];
  if (audiences.length && !audiences.includes('spfx-subscription-client')) {
    throw new Error('Status token audience is invalid.');
  }

  if (
    payload.tenantId &&
    payload.tenantId.toLowerCase() !== expected.tenantId.trim().toLowerCase()
  ) {
    throw new Error('Status token tenant mismatch.');
  }

  if (
    payload.siteUrl &&
    payload.siteUrl.toLowerCase() !== expected.siteUrl.trim().toLowerCase()
  ) {
    throw new Error('Status token site URL mismatch.');
  }

  if (
    expected.siteId &&
    payload.siteId &&
    payload.siteId.toLowerCase() !== expected.siteId.trim().toLowerCase()
  ) {
    throw new Error('Status token site ID mismatch.');
  }

  if (payload.productSlug && payload.productSlug !== expected.productSlug) {
    throw new Error('Status token product mismatch.');
  }

  if (typeof payload.hasAccess !== 'boolean' || !payload.status) {
    throw new Error('Status token is missing required claims.');
  }

  return {
    status: payload.status as ISubscriptionStatus['status'],
    hasAccess: payload.hasAccess
  };
}

export function clearStatusSigningKeyCache(): void {
  cachedCryptoKey = undefined;
  verificationKeyPromise = undefined;
}
