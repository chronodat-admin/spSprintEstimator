# Partner Center & Billing Setup — Paste-Ready Text

Copy-paste reference for **Sprint Align** marketplace submission and Stripe product
configuration. Package version at time of writing: **1.1.3.29**.

---

## Partner Center — Offer identity

| Field | Value |
|-------|-------|
| **Product name** | Sprint Align |
| **Publisher display name** | Chronodat, LLC |
| **Offer type** | SharePoint solution (SPFx) |
| **Supported hosts** | SharePoint (full page + web part), Microsoft Teams tab & personal app |

---

## Partner Center — Search & classification

### Search keywords (max 3)

1. planning poker
2. agile estimation
3. SharePoint planning poker

### Categories (max 3)

- Productivity
- Workflow & Process Management
- IT/admin

### Industries (max 2)

- Professional Services
- Education

Check **Apps** under *Is your offer applicable to*.

### Search results summary (max 100 characters)

```
Planning poker for SharePoint and Teams — private votes, facilitator reveal, tenant-resident data.
```

(95 characters)

### Short description (≤256 characters — also in package metadata)

```
Planning poker, dot voting, and agile estimation for SharePoint and Teams. Session data stays in your site lists—no external backend.
```

(131 characters)

---

## Partner Center — Screenshot captions

Upload from `store-assets/generated/screenshots/`. Spec: **1366×768 PNG, ≤ 1024 KB each**.

| # | File | Caption |
|---|------|---------|
| 1 | `sprint-align-screenshot-01-home.png` | **Home** — Join sessions with a six-character code or start a new estimation workshop from a branded full-page home screen. |
| 2 | `sprint-align-screenshot-02-voting.png` | **Live voting** — Everyone votes privately; the facilitator tracks live participation and reveals the round together. |
| 3 | `sprint-align-screenshot-03-results.png` | **Results** — See average, median, range, and outliers at a glance, then save the agreed final estimate. |
| 4 | `sprint-align-screenshot-04-settings.png` | **Settings** — Site owners provision lists, set retention, branding, layout, and session-creation rules. |
| 5 | `sprint-align-screenshot-05-how-it-works.png` | **How it works** — End-to-end scrum flow: facilitator sets up, team joins, votes privately, reveals together, and agrees on estimates. |

### Store logo

| Asset | Path | Size |
|-------|------|------|
| Partner Center logo | `store-assets/generated/store-logo-300.png` | 300×300 PNG |

---

## Partner Center — Notes for certification

Paste into **Review and publish → Notes for certification**. Put real test account
passwords in Partner Center **secure notes** or an **Additional certification info** PDF.

```
TEST SITE: https://[your-tenant].sharepoint.com/sites/[test-site]
PACKAGE: estimatr.sppkg v1.1.3.29

ACCOUNTS (credentials in secure submission notes):
1) SharePoint/tenant admin — deploy .sppkg tenant-wide, approve Graph permissions, Sync to Teams
2) Site owner — add web part to modern page or Single App Page, run setup wizard
3) Team member — join session by code, vote, observe reveal

DEPLOY:
1. Upload estimatr.sppkg to tenant App Catalog and Deploy
2. SharePoint Admin Center > Advanced > API access > Approve Microsoft Graph User.ReadBasic.All and Presence.Read.All (optional but in package)
3. Add Sprint Align web part to a modern page or Single App Page; complete setup wizard

CORE TESTS (no extra services):
- Home: join by code, create session, launch demo workshop
- Session: private voting, live participation, facilitator reveal
- Results: average/median/range, outlier flags, save final estimate
- History: ended sessions, CSV export
- Settings: setup, governance, branding, home page, layout, subscription tabs
- Full-page layout and light/dark mode toggle

OPTIONAL (feature flags in Settings > Advanced):
- Microsoft Graph profile photos (User.ReadBasic.All)
- Microsoft Graph presence (Presence.Read.All)
- Azure DevOps backlog import (user_impersonation) — disabled by default

TEAMS:
- App Catalog > Sync to Teams; open personal app or channel tab
- Same join-by-code flow works inside Teams

LICENSING: 14-day trial per site collection. Support: https://www.chronodat.com/wiki/sprint-align
```

---

## Partner Center — API justification

Three permissions are declared in `config/package-solution.json` →
`webApiPermissionRequests`. All are **optional** — core estimation works without them.

```
Sprint Align requests three optional API permissions, all disabled by default until a site administrator enables the related feature flags in Settings > Advanced:

1. Microsoft Graph User.ReadBasic.All — shows participant profile photos in the team roster when enableGraphPhotos is turned on. Tenant admin approves once in SharePoint Admin Center > API access.

2. Microsoft Graph Presence.Read.All — shows Teams presence indicators for participants when enableGraphPresence is turned on. Tenant admin approves once in SharePoint Admin Center > API access.

3. Azure DevOps user_impersonation (resource 499b84ac-1321-427f-aa17-267ca6975798) — imports backlog items and writes agreed story points back to Azure DevOps when enableAzureDevOps is turned on. Tenant admin approves once in SharePoint Admin Center > API access.

Core planning poker, voting, reveal, and session storage use SharePoint lists only. No external estimation backend is required. No Mail.Send or other Graph scopes are requested.
```

Short version (248 characters) if a tighter field appears:

```
Three optional permissions (User.ReadBasic.All, Presence.Read.All, Azure DevOps user_impersonation) support profile photos, presence, and backlog import when enabled in Settings > Advanced. Core estimation uses SharePoint lists only.
```

---

## Partner Center — Support & legal URLs

| Field | URL |
|-------|-----|
| **Support URL** | `https://www.chronodat.com/wiki/sprint-align` |
| **Privacy policy URL** | `https://www.chronodat.com/Privacy` |
| **Terms of use URL** | `https://www.chronodat.com/terms-conditions` |
| **Support contact email** | `support@chronodat.com` |
| **Product page** | `https://www.chronodat.com/sprint-align` |
| **Knowledge base** | `https://www.chronodat.com/wiki/sprint-align` |

Update `config/package-solution.json` → `developer.websiteUrl`, `privacyUrl`, and
`termsOfUseUrl` before publishing the package.

---

## Stripe — Product setup

Subscription is **one license per SharePoint site collection**, **yearly plan**,
**unlimited users** in the licensed site. Product slug in the SPFx app:
`sprint-align` (`src/constants/spfxComponents.ts`).

> **Note:** Set the actual annual price in Stripe and Partner Center before launch.
> Asset Management Hub uses $999 USD/year as a reference for Chronodat site-collection apps.

### Product name

```
Sprint Align — Annual Site License
```

### Product description

```
Annual subscription for Sprint Align on one SharePoint Online site collection. Run planning poker, confidence votes, dot voting, and agile estimation in SharePoint and Microsoft Teams. Includes unlimited users in the licensed site collection. All session data stays in your Microsoft 365 tenant. Includes a 14-day free trial. Sold by Chronodat.
```

### Short description

```
Annual license for one SharePoint site collection. Unlimited users. 14-day free trial. Planning poker and agile estimation in SharePoint and Teams; data stays in your tenant.
```

### Suggested Stripe fields

| Field | Value |
|-------|-------|
| Metadata | `productSlug: sprint-align` |
| Billing | Recurring, yearly |
| Price | *(set before launch — e.g. $499.00 USD / year)* |
| Price nickname | `Sprint Align Annual` |
| Statement descriptor | `CHRONODAT SPRINT` (max 22 chars) |

### Price description (invoices / receipts)

```
Covers one SharePoint site collection for 12 months. Renews annually until canceled. Manage billing in the app under Settings → Subscription.
```

### Internal note (Stripe Dashboard only)

```
SPFx app: Sprint Align. Subscription API: subscription.chronodat.com. Checkout via POST /api/subscription/checkout. One license gates one site URL. Trial starts automatically on first status check (14 days).
```

---

## Release notes — v1.1.3.29

```
- Planning poker, confidence, fist-of-five, roman, dot voting, and survey session types
- Join-by-code sessions with Microsoft 365 identity
- Private voting with facilitator reveal and round statistics
- Custom card decks, session history, and CSV export
- Unified Settings hub (setup, governance, branding, home page, layout, subscription, advanced)
- Full-page immersive layout with light/dark mode
- SharePoint-native data storage — no external estimation backend
- Microsoft Teams personal app and channel tab support
```

---

## Related docs

- [`partner-center-long-description.html`](./partner-center-long-description.html) — store HTML description
- [`../microsoft-store-submission.md`](../microsoft-store-submission.md) — pre-submission checklist
- [`../../store-assets/STORE_LISTING.md`](../../store-assets/STORE_LISTING.md) — copy-ready listing summary
- [`../../store-assets/partner-center-fields.json`](../../store-assets/partner-center-fields.json) — machine-readable fields
