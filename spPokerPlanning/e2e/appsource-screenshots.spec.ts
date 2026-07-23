import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import fs from 'fs';
import {
  APP_NAME,
  appRoot,
  bootstrapDemoApp,
  clickAppButton,
  launchDemoWorkshop,
  leaveSession,
  openSettingsTab,
  saveStoreScreenshot,
  STORE_SCREENSHOT_SIZE
} from './helpers/app';

const authFile = 'e2e/.auth/user.json';

/**
 * Drives the full Sprint Align experience with the in-memory demo workshop
 * (no SharePoint writes) and captures marketplace screenshots used for the
 * AppSource / SharePoint store listing. Filenames match package-solution
 * screenshotPaths and Partner Center upload names (01–05).
 */
test.describe('Sprint Align — AppSource screenshots (demo data)', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext | undefined;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      ...(fs.existsSync(authFile) ? { storageState: authFile } : {}),
      ignoreHTTPSErrors: true,
      viewport: { ...STORE_SCREENSHOT_SIZE },
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

  test('01 — home page with demo workshop', { tag: '@screenshots' }, async () => {
    await expect(appRoot(page).getByText(APP_NAME).first()).toBeVisible();
    await expect(appRoot(page).getByText('Join a session')).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Create session' })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Launch demo' })).toBeVisible();
    await saveStoreScreenshot(page, 'sprint-align-screenshot-01-home.png');
  });

  test('02 — live voting session', { tag: '@screenshots' }, async () => {
    await launchDemoWorkshop(page);

    await expect(appRoot(page).getByText('User onboarding flow redesign')).toBeVisible({ timeout: 30_000 });
    await expect(appRoot(page).getByText(/choose your estimate/i)).toBeVisible();
    await expect(appRoot(page).getByText(/team roster/i)).toBeVisible();
    await expect(appRoot(page).getByText('Sam Rivera')).toBeVisible();

    const voteCard = appRoot(page).getByRole('button', { name: 'Vote 5' });
    if (await voteCard.isVisible().catch(() => false)) {
      await voteCard.click();
      await expect(appRoot(page).getByText(/your vote:/i)).toBeVisible({ timeout: 15_000 });
    }

    await saveStoreScreenshot(page, 'sprint-align-screenshot-02-voting.png');
  });

  test('03 — revealed round results', { tag: '@screenshots' }, async () => {
    const reveal = appRoot(page).getByRole('button', { name: 'Reveal votes (R)' });
    if (await reveal.isVisible().catch(() => false)) {
      await reveal.click();
    }
    await expect(appRoot(page).getByText('Round results')).toBeVisible({ timeout: 30_000 });
    await saveStoreScreenshot(page, 'sprint-align-screenshot-03-results.png');
  });

  test('04 — settings and branding', { tag: '@screenshots' }, async () => {
    await leaveSession(page);

    await openSettingsTab(page, 'Branding');
    await expect(appRoot(page).getByRole('tab', { name: 'Branding' })).toBeVisible();
    await expect(appRoot(page).getByText(/brand preview/i).first()).toBeVisible({ timeout: 30_000 });
    await saveStoreScreenshot(page, 'sprint-align-screenshot-04-settings.png');
  });

  test('05 — session history (extra capture)', { tag: '@screenshots' }, async () => {
    await clickAppButton(page, 'Back home');
    await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });

    await clickAppButton(page, 'History');
    await expect(
      appRoot(page).getByRole('heading', { name: /review previous sessions|sessions/i }).first()
    ).toBeVisible({ timeout: 30_000 });
    await saveStoreScreenshot(page, 'sprint-align-screenshot-extra-history.png');
  });
});
