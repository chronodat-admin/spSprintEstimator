import type { ISubscriptionStatus } from '../models/ISubscription';

const STORAGE_PREFIX = 'sprint-align-subscription-status-v1';

/** How long a successful subscription status is considered fresh before calling the API again. */
export const SUBSCRIPTION_STATUS_FRESH_MS = 60 * 60 * 1000;

/**
 * How long a cached subscription status remains usable when the Subscription API
 * cannot be reached. Within this window the last successful status is reused so a
 * transient outage or network block does not lock out paying customers.
 */
export const SUBSCRIPTION_STATUS_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

interface ICachedSubscriptionStatus {
  status: ISubscriptionStatus;
  cachedAt: number;
}

function storageKey(siteUrl: string, tenantId: string, productSlug: string): string {
  const site = siteUrl.trim().toLowerCase();
  const tenant = tenantId.trim().toLowerCase();
  const product = productSlug.trim().toLowerCase();
  return `${STORAGE_PREFIX}:${tenant}:${site}:${product}`;
}

export function writeCachedSubscriptionStatus(
  siteUrl: string,
  tenantId: string,
  productSlug: string,
  status: ISubscriptionStatus
): void {
  if (!siteUrl || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const payload: ICachedSubscriptionStatus = { status, cachedAt: Date.now() };
    localStorage.setItem(storageKey(siteUrl, tenantId, productSlug), JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export interface ICachedStatusResult {
  status: ISubscriptionStatus;
  cachedAt: number;
  ageMs: number;
  fresh: boolean;
  withinGrace: boolean;
}

export function readCachedSubscriptionStatus(
  siteUrl: string,
  tenantId: string,
  productSlug: string
): ICachedStatusResult | undefined {
  if (!siteUrl || typeof localStorage === 'undefined') {
    return undefined;
  }

  try {
    const raw = localStorage.getItem(storageKey(siteUrl, tenantId, productSlug));
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<ICachedSubscriptionStatus>;
    if (!parsed?.status || typeof parsed.cachedAt !== 'number') {
      return undefined;
    }

    const ageMs = Date.now() - parsed.cachedAt;
    return {
      status: parsed.status,
      cachedAt: parsed.cachedAt,
      ageMs,
      fresh: ageMs >= 0 && ageMs <= SUBSCRIPTION_STATUS_FRESH_MS,
      withinGrace: ageMs >= 0 && ageMs <= SUBSCRIPTION_STATUS_GRACE_MS
    };
  } catch {
    return undefined;
  }
}

export function clearCachedSubscriptionStatus(
  siteUrl: string,
  tenantId: string,
  productSlug: string
): void {
  if (!siteUrl || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(storageKey(siteUrl, tenantId, productSlug));
  } catch {
    /* ignore */
  }
}
