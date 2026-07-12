# Microsoft Store Submission Guide — Sprint Align

**Version:** 1.1.3.29

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

- [ ] Set the real Partner Center MPN ID in `config/package-solution.json` → `developer.mpnId`.
- [ ] Set `developer.websiteUrl`, `privacyUrl`, and `termsOfUseUrl` in `config/package-solution.json`.
- [ ] Bump `version` in `config/package-solution.json` before each store upload (currently **1.1.3.29**).
- [ ] Run `npm run lint && npm test`.
- [ ] Run `python store-assets/generate-icons.py` (if icon changed).
- [ ] Run `python store-assets/scripts/build-store-ai.py` (regenerate 1366×768 store screenshots).
- [ ] Run `gulp bundle --ship && gulp package-solution --ship`.
- [ ] Upload Partner Center **logo** from `store-assets/generated/store-logo-300.png`.
- [ ] Upload screenshots from `store-assets/generated/screenshots/` (01–05).
- [ ] Paste HTML description from `docs/store-submission/partner-center-long-description.html`.
- [ ] Paste search keywords, categories, and search summary from `docs/store-submission/partner-center-and-billing-setup.md`.
- [ ] Use **Preview** in Partner Center before publish.

Current package version: **1.1.3.29** (update `config/package-solution.json` before each store upload).

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
python store-assets/scripts/build-store-ai.py
```

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
