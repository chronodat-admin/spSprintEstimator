# End-to-end UI tests (Playwright)

Browser tests for **Sprint Align** against the live SharePoint page:

`https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx/sp`

## Prerequisites

1. Node 22 (matches `package.json` engines)
2. Sprint Align web part deployed on the page above
3. Site lists provisioned (Setup tab) or `PLAYWRIGHT_AUTO_SETUP=1`
4. Active subscription/trial, or **Skip subscription check** enabled on the web part

## Install

```bash
npm install
npm run test:e2e:install
```

## Configure

Copy `e2e/.env.example` to `e2e/.env`, or set:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://chronodat.sharepoint.com/sites/ChronodatProdApps/spfx/sp"
```

## First-time authentication

Microsoft login is saved once in a local session file:

```powershell
npm run test:e2e:setup
```

Sign in when the browser opens. Session is stored in `e2e/.auth/user.json` (gitignored).

## Run tests

```powershell
npm run test:e2e
npm run test:e2e:smoke
npm run test:e2e:headed
npm run test:e2e:ui
```

## What `sprint-align-complete.spec.ts` covers

1. Home page — branding, join/create actions, History/Settings, version footer
2. Settings — Subscription and Setup tabs
3. History — list view navigation
4. Session wizard — create room (4 steps) and lobby join code
5. Live session — start voting, cast estimate, reveal, save and next
6. Rejoin — return home and join with session code
7. Deck editor — governance navigation

Tests run serially in one browser session. Session titles are prefixed with `E2E`.

## AppSource screenshots (`appsource-screenshots.spec.ts`)

Generates the marketplace screenshots from the **in-memory demo workshop**, so
it needs no site setup and writes nothing to SharePoint. It appends
`?estimatrFlags={"enableMockData":true}` to the page URL, clicks **Launch demo**,
and walks the full experience while capturing 1366×768 PNGs.

```powershell
npm run test:e2e:screenshots
```

Output (overwrites in place) → `store-assets/generated/screenshots/`:

| File | Screen |
|------|--------|
| `sprint-align-screenshot-01-home.png` | Home page with demo workshop banner |
| `sprint-align-screenshot-02-sessions.png` | Live voting session (roster + poker cards) |
| `sprint-align-screenshot-03-settings.png` | Settings → Branding (brand preview) |
| `sprint-align-screenshot-04-results.png` | Revealed round results / consensus |
| `sprint-align-screenshot-05-history.png` | Session history |

The first three filenames are the `screenshotPaths` referenced in
`config/package-solution.json`, so re-running the build repackages the refreshed
images. It reuses the same saved Microsoft login as the other specs.

> The demo workshop relies on the temporary `enableMockData` flag / `src/demo/`
> folder. If that is removed before launch, generate screenshots by creating a
> real session instead.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tests skip immediately | Set `PLAYWRIGHT_BASE_URL` |
| Login loop | Delete `e2e/.auth/user.json` and run `test:e2e:setup` headed |
| Paywall / subscription skip | Subscribe, or enable **Skip subscription check** on the web part |
| Setup skip | Complete Setup in Settings, or set `PLAYWRIGHT_AUTO_SETUP=1` |
| Web part not found | Confirm the URL loads Sprint Align and you have access |

Open `playwright-report/index.html` after a run for traces and screenshots.
