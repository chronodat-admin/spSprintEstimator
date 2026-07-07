import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  setup.skip(!baseURL, 'Set PLAYWRIGHT_BASE_URL to your Sprint Align SharePoint page URL.');

  await page.goto(baseURL!, { waitUntil: 'domcontentloaded' });

  const loadDebug = page.getByRole('button', { name: 'Load debug scripts', exact: true });
  if (await loadDebug.isVisible().catch(() => false)) {
    await loadDebug.click();
  }

  // Headed first run: complete Microsoft login if prompted (up to 5 minutes).
  await expect(page.locator('.estimatr-webpart-host')).toBeVisible({ timeout: 300_000 });

  await page.context().storageState({ path: authFile });
});
