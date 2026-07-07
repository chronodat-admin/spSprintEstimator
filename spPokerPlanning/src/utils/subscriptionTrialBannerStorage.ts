const STORAGE_PREFIX = 'sprint-align-trial-banner-dismissed-v1';

function storageKey(siteUrl: string, trialEndsAt?: string): string {
  const site = siteUrl.trim().toLowerCase();
  const trial = (trialEndsAt || 'unknown').trim().toLowerCase();
  return `${STORAGE_PREFIX}:${site}:${trial}`;
}

export function isTrialBannerDismissed(siteUrl: string, trialEndsAt?: string): boolean {
  if (!siteUrl || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(storageKey(siteUrl, trialEndsAt)) === '1';
  } catch {
    return false;
  }
}

export function dismissTrialBanner(siteUrl: string, trialEndsAt?: string): void {
  if (!siteUrl || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(storageKey(siteUrl, trialEndsAt), '1');
  } catch {
    /* ignore */
  }
}
