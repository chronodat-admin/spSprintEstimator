# Sprint Align — Microsoft Marketplace listing content

Copy-ready text for Partner Center, SharePoint Store, and AppSource.

> **Full submission pack (HTML description, categories, keywords, certification notes,
> Stripe text):** see [`docs/store-submission/`](../docs/store-submission/README.md)
> and [`docs/microsoft-store-submission.md`](../docs/microsoft-store-submission.md).

---

## Offer identity

| Field | Value |
|-------|-------|
| **Product name** | Sprint Align |
| **Publisher display name** | Chronodat, LLC |
| **Category** | Productivity |
| **Categories (max 3)** | Productivity · Workflow & Process Management · IT/admin |
| **Industries (max 2)** | Professional Services · Education |
| **Supported hosts** | SharePoint (full page + web part), Microsoft Teams tab & personal app |

---

## Short description (≤256 characters)

Planning poker, dot voting, and agile estimation for SharePoint and Teams. Session data stays in your site lists—no external backend.

---

## Search results summary (≤100 characters)

Planning poker for SharePoint and Teams — private votes, facilitator reveal, tenant-resident data.

---

## Search keywords (Partner Center — max 3)

1. planning poker
2. agile estimation
3. SharePoint planning poker

### Extended keywords (reference / SEO)

planning poker, agile estimation, story points, sprint planning, scrum, dot voting, fist of five, confidence vote, SharePoint, Microsoft Teams, retrospective, backlog grooming, facilitator, estimation session

---

## Long description (AppSource / marketplace)

**Paste the HTML version from [`docs/store-submission/partner-center-long-description.html`](../docs/store-submission/partner-center-long-description.html)** — Partner Center renders supported HTML tags and the styled Help & Support buttons.

Plain-text summary:

**Align your team on story points, confidence, and priorities—inside Microsoft 365.**

Sprint Align is a full-page SharePoint Framework app for Scrum teams, product owners, and delivery leads who want fast, facilitator-led estimation without exporting backlog data to another SaaS tool.

### Why teams choose Sprint Align

- **SharePoint-native** — Sessions, votes, decks, and settings live in lists on the host site. Your data stays in your tenant.
- **Multiple vote types** — Planning poker, confidence (1–5), fist-of-five, roman votes, dot voting, and quick surveys in one app.
- **Join by code** — Participants open a link or enter a six-character code; identity comes from Microsoft 365 automatically.
- **Full-page experience** — Immersive single-app page layout with optional SharePoint chrome hiding for workshop-style sessions.
- **Facilitator controls** — Open rounds, reveal votes, re-vote, advance items, and export results to CSV.
- **Site governance** — Owners provision once, set retention, control who can create sessions, and apply custom branding.

### Optional integrations (feature flags)

When enabled by your administrator in Settings → Advanced:

- Microsoft Graph profile photos (`User.ReadBasic.All`)
- Microsoft Graph presence indicators (`Presence.Read.All`)
- Azure DevOps backlog import and story-point writeback (`user_impersonation`)

Core estimation does **not** require data to leave SharePoint.

### Getting started

1. Deploy the solution from your tenant app catalog.
2. Add **Sprint Align** to a Single App Page (recommended) or modern page.
3. A site owner completes one-time setup in **Settings**.
4. Create a session, share the join code, and start voting.

### Requirements

- Microsoft 365 with SharePoint Online
- Site owner permissions for first-time list provisioning
- Modern SharePoint pages (SharePoint Framework 1.21)

---

## Value proposition bullets (for listing “Features” section)

1. **Planning poker & six vote types** — Fibonacci decks, confidence scales, dot budgets, roman votes, surveys, and more.
2. **Data in SharePoint lists** — No external estimation server; lists are provisioned on your site.
3. **Join-by-code sessions** — Six-character codes and deep links for fast participant onboarding.
4. **Full-page workshop mode** — Hide SharePoint chrome for focused estimation meetings.
5. **CSV export & history** — Review ended sessions and download results for reporting.
6. **Custom decks & branding** — Site-level card decks, colors, and home-page hero text.

---

## Screenshot captions (use with files in `generated/screenshots/`)

| File | Caption |
|------|---------|
| `sprint-align-screenshot-01-home.png` | **Home** — Join sessions with a six-character code or start a new estimation workshop from a branded full-page home screen. |
| `sprint-align-screenshot-02-voting.png` | **Live voting** — Everyone votes privately; the facilitator tracks live participation and reveals the round together. |
| `sprint-align-screenshot-03-results.png` | **Results** — See average, median, range, and outliers at a glance, then save the agreed final estimate. |
| `sprint-align-screenshot-04-settings.png` | **Settings** — Site owners provision lists, set retention, branding, layout, and session-creation rules. |
| `sprint-align-screenshot-05-how-it-works.png` | **How it works** — End-to-end scrum flow: facilitator sets up, team joins, votes privately, reveals together, and agrees on estimates. |

All screenshots are **1366×768 PNG, ≤ 1024 KB**. Regenerate with `python store-assets/scripts/build-store-ai.py`.

---

## Support & legal

| Field | URL |
|-------|-----|
| **Support URL** | `https://www.chronodat.com/wiki/sprint-align` |
| **Product page** | `https://www.chronodat.com/sprint-align` |
| **Privacy policy URL** | `https://www.chronodat.com/Privacy` |
| **Terms of use URL** | `https://www.chronodat.com/terms-conditions` |
| **Support contact email** | `support@chronodat.com` |

---

## Release notes — v1.1.3.30

- Planning poker, confidence, fist-of-five, roman, dot voting, and survey session types
- Join-by-code sessions with Microsoft 365 identity
- Private voting with facilitator reveal and round statistics
- Custom card decks, session history, and CSV export
- Unified Settings hub (setup, governance, branding, home page, layout, subscription, advanced)
- Full-page immersive layout with light/dark mode
- SharePoint-native data storage — no external estimation backend

---

## Pricing (Partner Center / Stripe)

| Model | Notes |
|-------|-------|
| **14-day free trial** | Per site collection; starts on first use |
| **Yearly subscription** | One license per site collection; unlimited users |
| **Stripe product slug** | `sprint-align` |

See [`docs/store-submission/partner-center-and-billing-setup.md`](../docs/store-submission/partner-center-and-billing-setup.md) for Stripe product name, description, and suggested fields.

---

## Asset checklist

| Asset | Path | Size |
|-------|------|------|
| App catalog / trust dialog | `sharepoint/assets/appicon.png` | 96×96 |
| Large store logo | `generated/store-logo-300.png` | 300×300 |
| Alternate logo | `generated/store-logo-216.png` | 216×216 |
| Teams color icon | `teams/28aa74f7-6fa5-46b3-8eeb-52e0619be118_color.png` | 192×192 |
| Teams outline icon | `teams/28aa74f7-6fa5-46b3-8eeb-52e0619be118_outline.png` | 32×32 |
| Web part toolbox icon | `src/webparts/estimatr/assets/icon-64.png` | 64×64 |
| Single app page preview | `src/webparts/estimatr/assets/full-page-icon.png` | 193×158 |
| Screenshots (×5) | `generated/screenshots/sprint-align-screenshot-0N-*.png` | 1366×768 |

Run `python store-assets/generate-icons.py` to regenerate icons after design tweaks.

---

## Machine-readable fields

JSON summary for scripts and automation: [`partner-center-fields.json`](./partner-center-fields.json)
