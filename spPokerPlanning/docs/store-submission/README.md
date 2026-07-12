# AppSource Submission — Generation Guide

How every Microsoft Partner Center / AppSource submission artifact for **Sprint
Align** is generated from this repo: **images, AI prompts, the store description,
component/permission details, icons, screenshots, and version metadata.**

This is the index. Companion docs:

| Doc | Purpose |
|-----|---------|
| [`microsoft-store-submission.md`](../microsoft-store-submission.md) | Pre-submission checklist + upload rules |
| [`partner-center-long-description.html`](./partner-center-long-description.html) | Ready-to-paste store description (HTML) |
| [`partner-center-and-billing-setup.md`](./partner-center-and-billing-setup.md) | Paste-ready Partner Center + Stripe submission text |
| [`../../store-assets/STORE_LISTING.md`](../../store-assets/STORE_LISTING.md) | Copy-ready listing summary |
| [`../../store-assets/MARKETING_PROMPTS.md`](../../store-assets/MARKETING_PROMPTS.md) | AI image generation prompts |
| [`../../store-assets/README.md`](../../store-assets/README.md) | Image pipeline (screenshots, icons, crops) |

---

## Artifact map

| Artifact | Source of truth | Generated into | Command |
|----------|-----------------|----------------|---------|
| Short / long description | `config/package-solution.json` → `metadata` | package + manifests | `gulp package-solution --ship` |
| Partner Center HTML description | this repo (hand-authored from code) | `docs/store-submission/partner-center-long-description.html` | manual + review |
| Machine-readable fields | this repo | `store-assets/partner-center-fields.json` | manual + review |
| App icons (96/color/outline/store logo) | `store-assets/brand/sprint-align-app-icon.png` | `generated/`, `teams/`, `sharepoint/`, `src/` | `python store-assets/generate-icons.py` |
| Store screenshots (1366×768) | AI-embedded real UI + icon footer | `store-assets/generated/screenshots/` | `python store-assets/scripts/build-store-ai.py` |
| Full-page UI captures (reference) | Playwright e2e | `store-assets/generated/screenshots/full-page/` | `npm run test:e2e:fullpage` |
| Chronodat web assets | store screenshots + wiki figures | `C:/chronodatWeb/chronodat-web/img/sprint-align/` | `python store-assets/scripts/build-web-assets.py` |
| `.sppkg` package | `config/package-solution.json` | `sharepoint/solution/estimatr.sppkg` | `gulp bundle --ship && gulp package-solution --ship` |

---

## 1. Store description & metadata

### Short / long description (in-package)

Edit `config/package-solution.json` → `solution.metadata`:

```json
"shortDescription": { "default": "Planning poker, dot voting, and agile estimation for SharePoint and Teams" },
"longDescription":  { "default": "Sprint Align runs planning poker, confidence votes, fist-of-five, roman votes, dot voting, and surveys. All session data stays in SharePoint lists on the host site — no external backend." }
```

These flow into the Teams/M365 manifests during package build.

### Partner Center long description (HTML)

The rich store description lives at
[`partner-center-long-description.html`](./partner-center-long-description.html)
and is **derived directly from the codebase** so it stays truthful. When features
change, update these sources and regenerate the relevant section:

| Description section | Derived from |
|---------------------|--------------|
| Key Features | `SessionType` enum, Settings tabs, SessionView/VotingBoard |
| Microsoft Teams Integration | web part `supportedHosts` (`TeamsTab`, `TeamsPersonalApp`) |
| Optional Integrations | `src/config/featureFlags.ts` + `webApiPermissionRequests` |
| Component Information (policy 1170.1) | `EstimatrWebPart.manifest.json` |
| Prerequisites / Limitations | provisioning + platform constraints |
| Licensing / Get Started | `SubscriptionSettingsTab`, subscription API slug |

Paste it into **Marketplace offers → [offer] → Offer setup → Properties →
Description** and use **Preview** before publishing. The `!important` inline button
styles are intentional — they render the Product page / Knowledge base / Support
links as buttons in the store UI.

### Paste-ready Partner Center fields

All search keywords, categories, industries, search summary, certification notes,
API justification, and Stripe text are in
[`partner-center-and-billing-setup.md`](./partner-center-and-billing-setup.md).

---

## 2. Store screenshots (1366×768)

Current recommended pipeline — AI embeds real dark-mode UI + themed icon footer,
Python fits to store size without cropping:

```powershell
# 1. Generate AI masters (Cursor image generation) using MARKETING_PROMPTS.md
#    Save to store-assets/generated/marketing/_ai_clean/ai-embed-*.png

# 2. Fit to 1366×768 (≤1024 KB)
python store-assets/scripts/build-store-ai.py
```

Output: `store-assets/generated/screenshots/sprint-align-screenshot-0N-*.png`

**Brand rules:** product name always "Sprint Align"; platforms **SharePoint Online +
Microsoft Teams only**; AI never draws the Chronodat logo.

Alternative pipeline (real UI composited in Python, no AI footer):
`python store-assets/scripts/build-appsource-real.py` via `npm run assets:appsource`.

---

## 3. SPFx components & permissions (policy 1170.1)

Declare **every** component type in the store description. Source of truth:

| Component | Manifest | Host types |
|-----------|----------|------------|
| Client-side web part "Sprint Align" | `src/webparts/estimatr/EstimatrWebPart.manifest.json` | `SharePointWebPart`, `SharePointFullPage`, `TeamsTab`, `TeamsPersonalApp` |

**No form customizer** in this package (unlike Asset Management Hub).

**API permissions** (`config/package-solution.json` → `webApiPermissionRequests`) —
a tenant admin approves these once in SharePoint Admin Center → API access.
All are **optional** (disabled by default via feature flags):

| Scope | Used for |
|-------|----------|
| `User.ReadBasic.All` | Microsoft Graph profile photos (optional) |
| `Presence.Read.All` | Microsoft Graph presence indicators (optional) |
| Azure DevOps `user_impersonation` | Backlog import and story-point writeback (optional) |

**Component GUIDs** (fixed for the store upgrade path — never change):

| Component | GUID |
|-----------|------|
| Solution | `72d67433-2969-4168-9f32-34f6c9b994a0` |
| Feature | `5d3383f9-3ad9-4baa-93ee-4cf6bb322d02` |
| Web part | `28aa74f7-6fa5-46b3-8eeb-52e0619be118` |

---

## 4. Icons & screenshot specs

| Asset | Spec | Location |
|-------|------|----------|
| Partner Center logo | 300×300 PNG | `store-assets/generated/store-logo-300.png` |
| Store screenshots | **1366×768 PNG, ≤ 1024 KB** | `store-assets/generated/screenshots/` |
| AI marketing masters | 1536×1024 (do **not** upload) | `store-assets/generated/marketing/_ai_clean/` |
| Catalog / web part icon | 96×96 branded | generated by `generate-icons.py` |

All icons derive from `store-assets/brand/sprint-align-app-icon.png`.

---

## 5. Version, build, ship

```bash
# 1. Bump version in config/package-solution.json (solution.version + feature version)
# 2. Regenerate store screenshots if UI changed
python store-assets/scripts/build-store-ai.py
# 3. Build the package
gulp bundle --ship && gulp package-solution --ship
# 4. Upload estimatr.sppkg to tenant App Catalog for testing
# 5. Paste Partner Center fields from docs/store-submission/
```

For SharePoint App Catalog **Sync to Teams**, upload the `.sppkg` produced directly
by `gulp package-solution --ship`.

---

## End-to-end regeneration (all artifacts)

```bash
# Descriptions:   edit config/package-solution.json + partner-center-long-description.html
# UI screenshots:  npm run test:e2e:fullpage  (reference captures)
# Store images:    (AI generate) -> python store-assets/scripts/build-store-ai.py
# Icons:           python store-assets/generate-icons.py
# Web site assets: python store-assets/scripts/build-web-assets.py
# Wiki:            python store-assets/scripts/build-sprint-align-wiki.py
# Package:         gulp bundle --ship && gulp package-solution --ship
```
