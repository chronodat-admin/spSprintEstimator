import { IProvisioningScope } from './onboardingStorage';

const STORAGE_KEY = 'sprint-align-welcome-modal-seen-v1';

/** Per site admin, during initial setup only — not shown after the site is provisioned. */
function scopeKey(scope: IProvisioningScope): string {
  return `${STORAGE_KEY}:${scope.tenantId}:${scope.siteUrl}:${scope.userId}`;
}

export function hasSeenWelcomeModal(scope: IProvisioningScope): boolean {
  if (typeof localStorage === 'undefined') {
    return true;
  }

  try {
    return localStorage.getItem(scopeKey(scope)) === '1';
  } catch {
    return true;
  }
}

export function markWelcomeModalSeen(scope: IProvisioningScope): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(scopeKey(scope), '1');
  } catch {
    /* ignore quota / privacy mode */
  }
}
