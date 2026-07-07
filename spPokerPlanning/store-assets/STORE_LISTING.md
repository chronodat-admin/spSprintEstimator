# Sprint Align — Microsoft Marketplace listing content

Copy-ready text for Partner Center, SharePoint Store, and AppSource. Replace placeholder URLs before submission.

---

## Offer identity

| Field | Value |
|-------|-------|
| **Product name** | Sprint Align |
| **Publisher display name** | *(your company name)* |
| **Category** | Productivity |
| **Industries** | Cross-industry |
| **Supported hosts** | SharePoint (full page + web part), Microsoft Teams tab |

---

## Short description (≤256 characters)

Planning poker, dot voting, and agile estimation for SharePoint and Teams. Session data stays in your site lists—no external backend.

---

## Long description (AppSource / marketplace)

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

When enabled by your administrator:

- Microsoft Graph profile photos
- Microsoft Graph presence indicators
- Azure DevOps backlog import and story-point writeback

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

## Search keywords (suggested)

planning poker, agile estimation, story points, sprint planning, scrum, dot voting, fist of five, confidence vote, SharePoint, Microsoft Teams, retrospective, backlog grooming, facilitator, estimation session

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
| `sprint-align-screenshot-01-home.png` | **Home** — Join sessions with a code or start a new estimation workshop from a branded full-page home screen. |
| `sprint-align-screenshot-02-sessions.png` | **Sessions** — Facilitators run rounds, track participation, and reveal team estimates item by item. |
| `sprint-align-screenshot-03-settings.png` | **Settings** — Site owners provision lists, set retention, branding, layout, and session-creation rules. |

> **Before submission:** Replace the generated marketing mockups with live screenshots from your tenant (1366×768 px, ≤1024 KB each). Keep captions; update filenames in Partner Center if needed.

---

## Support & legal (fill in before publish)

| Field | Placeholder |
|-------|-------------|
| **Support URL** | `https://your-domain.com/support` |
| **Privacy policy URL** | `https://your-domain.com/privacy` |
| **Terms of use URL** | `https://your-domain.com/terms` |
| **Support contact email** | `support@your-domain.com` |

---

## Release notes — v1.1.0.0

- Rebranded to **Sprint Align** for marketplace launch
- Unified Settings hub (setup, governance, branding, hero text, page layout)
- Custom brand colors and editable home-page hero
- Full-page immersive layout with scroll and chrome controls
- Six session types with facilitator reveal and CSV export

---

## Pricing suggestion (Partner Center)

| Model | Notes |
|-------|-------|
| **Free** | Good for initial AppSource traction and reviews |
| **Per-seat / site license** | Consider after validation if you add premium integrations |

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
| Screenshots (×3 min) | `generated/screenshots/*.png` | 1366×768 |

Run `python store-assets/generate-icons.py` to regenerate icons after design tweaks.
