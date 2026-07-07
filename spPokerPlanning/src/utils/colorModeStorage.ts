import { ColorModePreference } from './branding';
import { IProvisioningScope } from './onboardingStorage';

const STORAGE_KEY = 'sprint-align-user-color-mode-v1';

function scopeKey(scope: IProvisioningScope): string {
  return `${STORAGE_KEY}:${scope.tenantId}:${scope.siteUrl}:${scope.userId}`;
}

export function getUserColorModePreference(scope: IProvisioningScope): ColorModePreference | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }

  try {
    const value = localStorage.getItem(scopeKey(scope));
    return value === 'light' || value === 'dark' ? value : undefined;
  } catch {
    return undefined;
  }
}

export function setUserColorModePreference(scope: IProvisioningScope, mode: ColorModePreference): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    if (mode === 'light' || mode === 'dark') {
      localStorage.setItem(scopeKey(scope), mode);
      return;
    }
    localStorage.removeItem(scopeKey(scope));
  } catch {
    /* ignore quota / privacy mode */
  }
}
