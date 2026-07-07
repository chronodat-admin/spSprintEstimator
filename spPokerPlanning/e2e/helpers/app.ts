import { expect, test, type Locator, type Page } from '@playwright/test';

export const APP_NAME = 'Sprint Align';

export function requireBaseUrl(): string {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL is required.');
  }
  return baseURL;
}

export function appRoot(page: Page): Locator {
  return page.locator('.estimatr-webpart-host');
}

export function appShell(page: Page): Locator {
  return appRoot(page).locator('.estimatr-app-shell');
}

export async function gotoApp(page: Page): Promise<void> {
  const baseURL = requireBaseUrl();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function acceptDebugScriptsIfPrompted(page: Page): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const loadDebug = page.getByRole('button', { name: 'Load debug scripts', exact: true });
    if (await loadDebug.isVisible().catch(() => false)) {
      await loadDebug.click({ force: true });
      await page
        .getByRole('alertdialog', { name: 'Allow debug scripts?' })
        .waitFor({ state: 'hidden', timeout: 30_000 })
        .catch(() => undefined);
      return;
    }

    const manifestError = page.getByRole('alertdialog', { name: 'Error loading debug manifests.' });
    if (await manifestError.isVisible().catch(() => false)) {
      throw new Error(
        'SPFx debug manifests failed to load. Start `gulp serve` or deploy the package to this page.'
      );
    }

    if (await appRoot(page).isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(500);
  }
}

export async function waitForApp(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await acceptDebugScriptsIfPrompted(page);
      await expect(appRoot(page)).toBeVisible({ timeout: 120_000 });
      await expect(appShell(page)).toBeVisible({ timeout: 60_000 });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
      await gotoApp(page);
    }
  }
}

export async function skipIfSubscriptionBlocked(page: Page): Promise<void> {
  const paywall = page.getByRole('heading', { name: /your free trial has ended/i });
  if (await paywall.isVisible().catch(() => false)) {
    test.skip(true, 'Subscription paywall is active. Subscribe or set Skip subscription check on the web part.');
  }

  const connectivity = page.getByRole('heading', { name: /can't reach the subscription service/i });
  if (await connectivity.isVisible().catch(() => false)) {
    test.skip(true, 'Subscription API unreachable. Check network or disable subscription checks for E2E.');
  }
}

export async function ensureSiteSetup(page: Page): Promise<void> {
  const setupButton = appRoot(page).getByRole('button', { name: new RegExp(`Set up ${APP_NAME}`, 'i') });
  if (!(await setupButton.isVisible().catch(() => false))) {
    return;
  }

  if (process.env.PLAYWRIGHT_AUTO_SETUP !== '1') {
    test.skip(true, `Site setup required. Run setup in Settings or set PLAYWRIGHT_AUTO_SETUP=1.`);
  }

  await setupButton.click();
  await expect(setupButton).toBeHidden({ timeout: 180_000 });
  await expect(appRoot(page).getByText('Site setup complete')).toBeVisible({ timeout: 180_000 });
}

export async function bootstrapApp(page: Page): Promise<void> {
  await gotoApp(page);
  await waitForApp(page);
  await skipIfSubscriptionBlocked(page);
  await ensureSiteSetup(page);
  await expect(appRoot(page).getByText(APP_NAME).first()).toBeVisible({ timeout: 60_000 });
}

export async function clickAppButton(page: Page, name: string | RegExp): Promise<void> {
  await appRoot(page).getByRole('button', { name, exact: typeof name === 'string' }).click();
}

export async function expectHeading(page: Page, name: string | RegExp): Promise<void> {
  await expect(appRoot(page).getByRole('heading', { name }).first()).toBeVisible({ timeout: 60_000 });
}

export function e2eTitle(prefix: string): string {
  return `E2E ${prefix} ${Date.now()}`;
}

export async function openSettingsTab(page: Page, tabName: string): Promise<void> {
  await clickAppButton(page, 'Settings');
  await expect(appRoot(page).getByRole('tab', { name: tabName })).toBeVisible({ timeout: 30_000 });
  await appRoot(page).getByRole('tab', { name: tabName }).click();
}

export async function completeSessionWizard(page: Page, sessionTitle: string): Promise<void> {
  await clickAppButton(page, 'Create session');
  await expectHeading(page, /create a clean voting room/i);

  await appRoot(page).getByLabel('Session name').fill(sessionTitle);
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Create session and open lobby');
  await expectHeading(page, /session lobby/i);
}

export async function readJoinCode(page: Page): Promise<string> {
  const toast = appRoot(page).getByText(/session created — code [A-Z0-9]{6}/i);
  if (await toast.isVisible().catch(() => false)) {
    const match = (await toast.textContent())?.match(/code ([A-Z0-9]{6})/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  const pillCode = appRoot(page).locator('span').filter({ hasText: /^[A-Z0-9]{6}$/ }).first();
  await expect(pillCode).toBeVisible({ timeout: 30_000 });
  const code = (await pillCode.textContent())?.trim() || '';
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  return code;
}

export async function startSessionFromLobby(page: Page): Promise<void> {
  await clickAppButton(page, 'Start voting session');
  await expect(appRoot(page).getByText(/current backlog item/i)).toBeVisible({ timeout: 60_000 });
}

export async function runSingleVotingRound(page: Page, voteLabel = 'Vote 5'): Promise<void> {
  await clickAppButton(page, 'Start voting on this item');
  await expect(appRoot(page).getByText('Choose your estimate')).toBeVisible({ timeout: 30_000 });
  await appRoot(page).getByRole('button', { name: voteLabel }).click();
  await expect(appRoot(page).getByText(/your vote:/i)).toBeVisible({ timeout: 30_000 });
  await clickAppButton(page, 'Reveal votes (R)');
  await expect(appRoot(page).getByText('Round results')).toBeVisible({ timeout: 60_000 });
  await clickAppButton(page, 'Save and next');
}

export async function joinSessionWithCode(page: Page, code: string): Promise<void> {
  await clickAppButton(page, 'Home');
  await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
  await appRoot(page).getByLabel('Session code').fill(code);
  await clickAppButton(page, 'Join session');
  await expect(
    appRoot(page).getByRole('heading', { name: /session lobby|current backlog item/i }).first()
  ).toBeVisible({ timeout: 60_000 });
}
