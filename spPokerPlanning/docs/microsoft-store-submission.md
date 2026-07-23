# Microsoft Store Submission Guide — Sprint Align

**Version:** 1.1.3.30

> For how every submission artifact (images, AI prompts, store description, component
> and permission details, icons, screenshots, version metadata) is generated, see
> [`store-submission/README.md`](./store-submission/README.md).

## Marketing image guidelines (Partner Center)

- **Product name in all store/marketing artwork:** **Sprint Align** (consistent spelling and casing).
- **App icon:** use `store-assets/brand/sprint-align-app-icon.png` (same source as generated store logos).
- **Chronodat logo:** `store-assets/brand/chronodat-logo.png` — composited via Python scripts only; never let AI draw the wordmark.
- **Platform references in images:** **SharePoint Online** and **Microsoft Teams** only. Do not show Microsoft 365, M365, or SPFx badges in store screenshots.
- **Screenshot specs:** 1366×768 PNG, ≤ 1024 KB each — upload from `store-assets/generated/screenshots/sprint-align-screenshot-0N-*.png`.
- **Do not upload** 1536×1024 AI masters from `store-assets/generated/marketing/_ai_clean/`.

## Pre-submission checklist

- [x] Set `developer.websiteUrl`, `privacyUrl`, and `termsOfUseUrl` in `config/package-solution.json` (synced from `config/publisher.json`).
- [ ] Set the real Partner Center MPN ID in `config/publisher.json` → `mpnId` (or `CHRONODAT_MPN_ID` env var).
- [ ] Bump `version` in `config/package-solution.json` before each store upload (currently **1.1.3.30**).
- [x] Run `npm test` (unit tests).
- [x] Run `npm run lint` (ESLint on `src/`).
- [ ] Run `npm run assets:store-screenshots` after UI or marketing image changes.
- [ ] Run `gulp bundle --ship && gulp package-solution --ship`.
- [ ] Upload Partner Center **logo** from `store-assets/generated/store-logo-300.png`.
- [ ] Upload screenshots from `store-assets/generated/screenshots/` (01–05).
- [ ] Paste HTML description from `docs/store-submission/partner-center-long-description.html`.
- [ ] Paste search keywords, categories, and search summary from `docs/store-submission/partner-center-and-billing-setup.md`.
- [ ] Configure Stripe product `sprint-align` and Partner Center commercial offer ($499/year suggested).
- [ ] Use **Preview** in Partner Center before publish.

Current package version: **1.1.3.30** (update `config/package-solution.json` before each store upload).

## Screenshot files (current)

| File | Scene |
|------|-------|
| `sprint-align-screenshot-01-home.png` | Home — join / create session |
| `sprint-align-screenshot-02-voting.png` | Live private voting |
| `sprint-align-screenshot-03-results.png` | Reveal results & consensus |
| `sprint-align-screenshot-04-settings.png` | Branding & governance |
| `sprint-align-screenshot-05-how-it-works.png` | End-to-end scrum flow |

Regenerate with:

```powershell
npm run assets:store-screenshots
```

> `gulp bundle` regenerates icons only — it no longer overwrites listing screenshots.

## Partner Center paste locations

| What | Where in Partner Center | Source file |
|------|-------------------------|-------------|
| Product name | Offer setup → Properties | `Sprint Align` |
| Short description | Offer setup → Properties | `partner-center-and-billing-setup.md` |
| Long description (HTML) | Offer setup → Properties → Description | `partner-center-long-description.html` |
| Search keywords (×3) | Offer listing → Search keywords | `partner-center-and-billing-setup.md` |
| Categories (×3) | Offer listing → Categories | `partner-center-and-billing-setup.md` |
| Search results summary | Offer listing | `partner-center-and-billing-setup.md` |
| Screenshots (×5) | Offer listing → Screenshots | `store-assets/generated/screenshots/` |
| Logo | Offer listing → Logos | `store-assets/generated/store-logo-300.png` |
| Notes for certification | Review and publish | `partner-center-and-billing-setup.md` |

## Publisher metadata

Legal URLs and publisher name live in `config/publisher.json`. The build applies them to
`config/package-solution.json` automatically via `scripts/apply-publisher-metadata.js`.

Set your MPN ID in `config/publisher.json` before AppSource submission:

```json
"mpnId": "YOUR_PARTNER_CENTER_MPN_ID"
```
