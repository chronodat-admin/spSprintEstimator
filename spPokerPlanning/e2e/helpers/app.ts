import fs from 'fs';
import path from 'path';
import { expect, test, type Locator, type Page } from '@playwright/test';

export const APP_NAME = 'Sprint Align';

/** DEMO01 workshop code — matches MOCK_DEMO_SESSION_CODE in src/demo/mockFixtures.ts. */
export const DEMO_SESSION_CODE = 'DEMO01';

/** AppSource / SharePoint store screenshots are written here (matches package-solution screenshotPaths). */
export const STORE_SCREENSHOT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'store-assets',
  'generated',
  'screenshots'
);

/** Store screenshot canvas — Office Store recommends 1366×768 PNGs. */
export const STORE_SCREENSHOT_SIZE = { width: 1366, height: 768 } as const;

/** Full-page (whole-scroll) captures for review live in a separate folder. */
export const FULL_PAGE_SCREENSHOT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'store-assets',
  'generated',
  'screenshots',
  'full-page'
);

export function requireBaseUrl(): string {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) {
    throw new Error('PLAYWRIGHT_BASE_URL is required.');
  }
  return baseURL;
}

/** URL that forces the in-memory demo workshop on (Settings → Advanced → Mock demo data). */
export function demoAppUrl(): string {
  const baseURL = requireBaseUrl();
  const flags = encodeURIComponent(JSON.stringify({ enableMockData: true }));
  const separator = baseURL.includes('?') ? '&' : '?';
  return `${baseURL}${separator}estimatrFlags=${flags}`;
}

export function appRoot(page: Page): Locator {
  return page.locator('.estimatr-webpart-host');
}

export function appShell(page: Page): Locator {
  return appRoot(page).locator('.estimatr-app-shell');
}

async function gotoWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function gotoApp(page: Page): Promise<void> {
  await gotoWithRetry(page, requireBaseUrl());
}

export async function gotoDemoApp(page: Page): Promise<void> {
  await gotoWithRetry(page, demoAppUrl());
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

export async function waitForApp(page: Page, reload: (p: Page) => Promise<void> = gotoApp): Promise<void> {
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
      await reload(page);
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

/** Switches to a settings tab when already on the settings page. */
export async function clickSettingsTab(page: Page, tabName: string): Promise<void> {
  const tab = appRoot(page).getByRole('tab', { name: tabName });
  await expect(tab).toBeVisible({ timeout: 30_000 });
  await tab.click();
}

/** Opens settings from home (or any view with a Settings button), then a tab. */
export async function openSettingsTab(page: Page, tabName: string): Promise<void> {
  await clickAppButton(page, 'Settings');
  await clickSettingsTab(page, tabName);
}

/** Leaves the active (including demo) session and returns to home. */
export async function leaveSession(page: Page): Promise<void> {
  await clickAppButton(page, 'Leave');
  await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
}

/**
 * Returns to the home screen from any view. The lobby exposes a "Home" button
 * while an active session exposes "Leave", so try whichever is present.
 */
export async function goHome(page: Page): Promise<void> {
  const leave = appRoot(page).getByRole('button', { name: 'Leave', exact: true });
  const home = appRoot(page).getByRole('button', { name: 'Home', exact: true });
  if (await leave.isVisible().catch(() => false)) {
    await leave.click();
  } else if (await home.isVisible().catch(() => false)) {
    await home.click();
  }
  await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
}

export async function completeSessionWizard(page: Page, sessionTitle: string): Promise<void> {
  await clickAppButton(page, 'Create session');
  await expectHeading(page, /create a clean voting room/i);

  await appRoot(page).getByLabel('Session name').fill(sessionTitle);
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Continue');
  await clickAppButton(page, 'Create session and open lobby');
  // "Session lobby" is an eyebrow label (text), not a heading; the heading is the session title.
  await expect(appRoot(page).getByText('Session lobby').first()).toBeVisible({ timeout: 60_000 });
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
  const startButton = appRoot(page).getByRole('button', { name: 'Start voting on this item', exact: true });
  const estimatePrompt = appRoot(page).getByText('Choose your estimate');
  await startButton.click();
  // Opening a round writes to SharePoint; if the first click doesn't take, retry
  // once before failing so a slow round-open doesn't flake the run.
  try {
    await expect(estimatePrompt).toBeVisible({ timeout: 15_000 });
  } catch {
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }
    await expect(estimatePrompt).toBeVisible({ timeout: 30_000 });
  }
  await appRoot(page).getByRole('button', { name: voteLabel }).click();
  await expect(appRoot(page).getByText(/your vote:/i)).toBeVisible({ timeout: 30_000 });
  await clickAppButton(page, 'Reveal votes (R)');
  await expect(appRoot(page).getByText('Round results')).toBeVisible({ timeout: 60_000 });
  await clickAppButton(page, 'Save and next');
}

export async function joinSessionWithCode(page: Page, code: string): Promise<void> {
  await goHome(page);
  await appRoot(page).getByLabel('Session code').fill(code);
  await clickAppButton(page, 'Join session');
  await expect(
    appRoot(page).getByText(/session lobby|current backlog item/i).first()
  ).toBeVisible({ timeout: 60_000 });
}

/** Boots the app with the demo workshop flag on and waits for the home screen. */
export async function bootstrapDemoApp(page: Page): Promise<void> {
  await gotoDemoApp(page);
  await waitForApp(page, gotoDemoApp);
  await skipIfSubscriptionBlocked(page);
  await expect(appRoot(page).getByText(APP_NAME).first()).toBeVisible({ timeout: 60_000 });
  await expect(appRoot(page).getByText(/try the demo workshop/i)).toBeVisible({ timeout: 30_000 });
}

/** Clicks "Launch demo" and waits for the in-memory voting session to open. */
export async function launchDemoWorkshop(page: Page): Promise<void> {
  await clickAppButton(page, 'Launch demo');
  await expect(appRoot(page).getByText(/current backlog item/i)).toBeVisible({ timeout: 30_000 });
}

/**
 * Captures a store-sized screenshot into store-assets/generated/screenshots.
 * Clips to the recommended 1366×768 canvas so every image is upload-ready and
 * consistent. Assumes the browser context viewport is at least that size.
 */
export async function saveStoreScreenshot(page: Page, fileName: string): Promise<void> {
  fs.mkdirSync(STORE_SCREENSHOT_DIR, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  // Let Fluent animations / spinners settle before the shot.
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(STORE_SCREENSHOT_DIR, fileName),
    clip: { x: 0, y: 0, width: STORE_SCREENSHOT_SIZE.width, height: STORE_SCREENSHOT_SIZE.height }
  });
}

/**
 * Captures the entire app surface (whole scroll height) into
 * store-assets/generated/screenshots/full-page. Screenshots the app host element
 * so the SharePoint page chrome/status bar is excluded and every screen is
 * captured top-to-bottom regardless of viewport height.
 */
export async function saveFullPageScreenshot(page: Page, fileName: string): Promise<void> {
  fs.mkdirSync(FULL_PAGE_SCREENSHOT_DIR, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  // Let Fluent animations / spinners settle before the shot.
  await page.waitForTimeout(700);
  await appRoot(page).screenshot({ path: path.join(FULL_PAGE_SCREENSHOT_DIR, fileName) });
}

/**
 * Switches the app color mode via the Light/Dark toggle on the home screen.
 * The preference is stored per-site in localStorage, so it persists across the
 * rest of the tour and is reset when the context closes. Must be called from home.
 */
export async function setColorMode(page: Page, mode: 'light' | 'dark'): Promise<void> {
  const label = mode === 'dark' ? 'Dark' : 'Light';
  const toggle = appRoot(page).getByRole('button', { name: label, exact: true });
  await expect(toggle).toBeVisible({ timeout: 30_000 });
  await toggle.click();
  await page.waitForTimeout(500);
}
