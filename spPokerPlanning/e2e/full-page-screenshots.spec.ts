import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import fs from 'fs';
import {
  APP_NAME,
  appRoot,
  bootstrapDemoApp,
  clickAppButton,
  clickSettingsTab,
  expectHeading,
  launchDemoWorkshop,
  leaveSession,
  openSettingsTab,
  saveFullPageScreenshot,
  setColorMode
} from './helpers/app';

const authFile = 'e2e/.auth/user.json';

/** Every settings tab, in the order it appears in the Pivot. */
const SETTINGS_TABS: ReadonlyArray<{ label: string; slug: string }> = [
  { label: 'Setup', slug: 'setup' },
  { label: 'Governance', slug: 'governance' },
  { label: 'Branding', slug: 'branding' },
  { label: 'Home page', slug: 'home-page' },
  { label: 'Layout', slug: 'layout' },
  { label: 'Subscription', slug: 'subscription' },
  { label: 'Advanced', slug: 'advanced' }
];

/**
 * Walks every primary screen and every settings tab with the in-memory demo
 * workshop (no SharePoint writes) and saves a full-page (whole-scroll) capture
 * of each. Assumes we start on the home screen and returns to home when done, so
 * it can be run once per color mode. `prefix` (light|dark) namespaces the files.
 */
async function captureFullTour(page: Page, prefix: string): Promise<void> {
  // 01 — home
  await expect(appRoot(page).getByText(APP_NAME).first()).toBeVisible();
  await expect(appRoot(page).getByText('Join a session')).toBeVisible();
  await saveFullPageScreenshot(page, `${prefix}-01-home.png`);

  // 02 — live voting session (facilitator casts a vote for a full board)
  await launchDemoWorkshop(page);
  await expect(appRoot(page).getByText(/choose your estimate/i)).toBeVisible({ timeout: 30_000 });
  const voteCard = appRoot(page).getByRole('button', { name: 'Vote 5' });
  if (await voteCard.isVisible().catch(() => false)) {
    await voteCard.click();
    await expect(appRoot(page).getByText(/your vote:/i)).toBeVisible({ timeout: 15_000 });
  }
  await saveFullPageScreenshot(page, `${prefix}-02-session-voting.png`);

  // 03 — revealed round results
  const reveal = appRoot(page).getByRole('button', { name: 'Reveal votes (R)' });
  if (await reveal.isVisible().catch(() => false)) {
    await reveal.click();
  }
  await expect(appRoot(page).getByText('Round results')).toBeVisible({ timeout: 30_000 });
  await saveFullPageScreenshot(page, `${prefix}-03-session-results.png`);

  await leaveSession(page);

  // 04-10 — every settings tab
  await openSettingsTab(page, SETTINGS_TABS[0].label);
  for (let i = 0; i < SETTINGS_TABS.length; i++) {
    const tab = SETTINGS_TABS[i];
    if (i > 0) {
      await clickSettingsTab(page, tab.label);
    }
    await expect(appRoot(page).getByRole('tab', { name: tab.label })).toBeVisible();
    // Give the tab body a beat to render before the capture.
    await page.waitForTimeout(400);
    const index = String(i + 4).padStart(2, '0');
    await saveFullPageScreenshot(page, `${prefix}-${index}-settings-${tab.slug}.png`);
  }

  // 11 — deck editor (Governance → Manage decks)
  await clickSettingsTab(page, 'Governance');
  await clickAppButton(page, 'Manage decks');
  await expectHeading(page, /manage planning poker card values/i);
  await saveFullPageScreenshot(page, `${prefix}-11-deck-editor.png`);
  await clickAppButton(page, 'Back to settings');

  // 12 — session history
  await clickAppButton(page, 'Back home');
  await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
  await clickAppButton(page, 'History');
  await expect(
    appRoot(page).getByRole('heading', { name: /review previous sessions|sessions/i }).first()
  ).toBeVisible({ timeout: 30_000 });
  await saveFullPageScreenshot(page, `${prefix}-12-history.png`);
  await clickAppButton(page, 'Back home');
  await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
}

/**
 * Full-page captures of every scenario and every settings tab, in both light and
 * dark mode. Color mode is toggled from the home screen (stored per-site in
 * localStorage) so the dark pass also exercises "dark mode forced on a light
 * SharePoint page". Output: store-assets/generated/screenshots/full-page/.
 */
test.describe('Sprint Align — full-page screenshots (demo data)', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext | undefined;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      ...(fs.existsSync(authFile) ? { storageState: authFile } : {}),
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: 'light'
    });
    page = await context.newPage();
    await bootstrapDemoApp(page);
  });

  test.afterAll(async () => {
    await context?.close();
    context = undefined;
  });

  test('light mode — all scenarios and settings', { tag: '@screenshots' }, async () => {
    await setColorMode(page, 'light');
    await captureFullTour(page, 'light');
  });

  test('dark mode — all scenarios and settings', { tag: '@screenshots' }, async () => {
    await setColorMode(page, 'dark');
    await captureFullTour(page, 'dark');
    // Reset to light so the shared context / stored preference is left clean.
    await setColorMode(page, 'light');
  });
});
