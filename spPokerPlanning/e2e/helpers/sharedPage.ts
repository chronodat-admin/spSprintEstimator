import fs from 'fs';
import type { Browser, BrowserContext, Page } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

export type SharedPageSuite = {
  page: Page;
  context: BrowserContext;
};

/** One browser context + page for a serial describe block. */
export async function createSharedPage(browser: Browser): Promise<SharedPageSuite> {
  const context = await browser.newContext({
    ...(fs.existsSync(authFile) ? { storageState: authFile } : {}),
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  return { page, context };
}

export async function disposeSharedPage(suite: SharedPageSuite | undefined): Promise<void> {
  await suite?.context.close();
}
