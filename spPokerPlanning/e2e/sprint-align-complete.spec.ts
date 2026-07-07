import { test, expect } from '@playwright/test';
import {
  APP_NAME,
  appRoot,
  bootstrapApp,
  clickAppButton,
  completeSessionWizard,
  e2eTitle,
  expectHeading,
  joinSessionWithCode,
  openSettingsTab,
  readJoinCode,
  runSingleVotingRound,
  startSessionFromLobby
} from './helpers/app';
import { createSharedPage, disposeSharedPage, type SharedPageSuite } from './helpers/sharedPage';

test.describe('Sprint Align complete flow', () => {
  test.describe.configure({ mode: 'serial' });

  let suite: SharedPageSuite | undefined;
  let sessionTitle = '';
  let joinCode = '';

  test.beforeAll(async ({ browser }) => {
    suite = await createSharedPage(browser);
    await bootstrapApp(suite.page);
    sessionTitle = e2eTitle('Planning poker');
  });

  test.afterAll(async () => {
    await disposeSharedPage(suite);
    suite = undefined;
  });

  test('loads home page with navigation and footer', { tag: '@smoke' }, async () => {
    const page = suite!.page;
    await expect(appRoot(page).getByText(APP_NAME).first()).toBeVisible();
    await expect(appRoot(page).getByText('Join a session')).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Create session' })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'History' })).toBeVisible();
    await expect(appRoot(page).getByRole('button', { name: 'Settings' })).toBeVisible();
    await expect(appRoot(page).locator('.estimatr-app-footer')).toBeVisible();
    await expect(appRoot(page).locator('.estimatr-app-footer')).toContainText(/\d+\.\d+\.\d+/);
  });

  test('opens settings and subscription tab', async () => {
    const page = suite!.page;
    await openSettingsTab(page, 'Subscription');
    await expect(
      appRoot(page).getByText(/subscription checking is not configured|yearly subscription|trial days remaining/i).first()
    ).toBeVisible({ timeout: 30_000 });
    await openSettingsTab(page, 'Setup');
    await expect(appRoot(page).getByText(/site setup/i).first()).toBeVisible();
    await clickAppButton(page, 'Back home');
  });

  test('opens session history', async () => {
    const page = suite!.page;
    await clickAppButton(page, 'History');
    await expectHeading(page, /review previous sessions/i);
    await clickAppButton(page, 'Back home');
    await expect(appRoot(page).getByText('Join a session')).toBeVisible({ timeout: 30_000 });
  });

  test('creates a session through the wizard', async () => {
    const page = suite!.page;
    await completeSessionWizard(page, sessionTitle);
    joinCode = await readJoinCode(page);
    await expect(appRoot(page).getByText(joinCode)).toBeVisible();
    await expect(appRoot(page).getByText(/participants/i).first()).toBeVisible();
  });

  test('starts voting from the lobby', async () => {
    const page = suite!.page;
    await startSessionFromLobby(page);
    await expect(appRoot(page).getByText('User story 1')).toBeVisible({ timeout: 30_000 });
  });

  test('casts a vote, reveals results, and advances', async () => {
    const page = suite!.page;
    await runSingleVotingRound(page, 'Vote 5');
    await expect(appRoot(page).getByText(/round results|current backlog item/i).first()).toBeVisible({
      timeout: 60_000
    });
  });

  test('returns home and rejoins with session code', async () => {
    const page = suite!.page;
    expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);
    await joinSessionWithCode(page, joinCode);
    await expect(appRoot(page).getByText(joinCode)).toBeVisible({ timeout: 30_000 });
  });

  test('navigates to deck editor from settings', async () => {
    const page = suite!.page;
    await clickAppButton(page, 'Home');
    await clickAppButton(page, 'Settings');
    await openSettingsTab(page, 'Governance');
    await clickAppButton(page, 'Manage decks');
    await expectHeading(page, /manage planning poker card values/i);
    await clickAppButton(page, 'Back');
    await clickAppButton(page, 'Back home');
  });
});
