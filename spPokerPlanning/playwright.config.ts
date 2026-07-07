import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, 'e2e', '.env'));

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx/sp';
const authFile = 'e2e/.auth/user.json';
const hasAuth = fs.existsSync(authFile);
const runSetup = !hasAuth;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 360_000,
  expect: { timeout: 60_000 },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 120_000
  },
  projects: [
    ...(runSetup
      ? [
          {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            use: { headless: false }
          }
        ]
      : []),
    {
      name: 'chromium',
      dependencies: runSetup ? ['setup'] : [],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...(hasAuth || runSetup ? { storageState: authFile } : {})
      }
    }
  ]
});
