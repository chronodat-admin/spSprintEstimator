# Sprint Align

Full-page SharePoint Framework (SPFx) agile estimation and team-voting app for IT teams. All session data lives in SharePoint lists on the host site — **no external backend services** for core functionality.

Supports: planning poker, confidence votes (1–5), fist-of-five, roman votes, dot voting, and quick surveys.

## Prerequisites

- Node.js 22.x (SPFx 1.21)
- SharePoint Online tenant with app catalog
- Site owner permissions for first-run provisioning

## Quick start

```powershell
cd estimatr
npm install
gulp serve
```

Production package:

```powershell
gulp bundle --ship
gulp package-solution --ship
```

Upload `sharepoint/solution/estimatr.sppkg` to your tenant app catalog, approve API permissions, deploy, then add the **Sprint Align** web part to a Single App Page or Teams tab.

## AppSource / marketplace assets

Icons, screenshot mockups, and Partner Center listing copy live in [`store-assets/`](store-assets/README.md). Regenerate icons with:

```powershell
python store-assets/generate-icons.py
```

Replace screenshot mockups with live tenant captures (1366×768) before store submission.

## Install checklist

1. Upload `.sppkg` to app catalog → Deploy
2. Approve **Microsoft Graph** `User.ReadBasic.All` (optional — enhanced photos)
3. Approve **Microsoft Graph** `Presence.Read.All` (optional — presence dots when `enableGraphPresence` is on)
4. Approve **Azure DevOps** `user_impersonation` (optional — ADO backlog flag)
5. Add web part to a **Single App Page** (recommended) or modern page
6. Site owner opens Sprint Align → **Settings** → **Set up Sprint Align** (creates lists)
7. Share join link: `?estimatrSession=ABC123`

## SharePoint lists (auto-provisioned)

| List | Purpose |
|------|---------|
| Estimatr_Sessions | Session metadata, code, options, roster JSON |
| Estimatr_Items | Work items / backlog entries |
| Estimatr_Rounds | Voting rounds per item |
| Estimatr_Votes | Individual votes (Locked=true after reveal) |
| Estimatr_Decks | Custom estimation decks |
| Estimatr_Settings | Site defaults (retention, whoCanCreate, layout, branding) |

List internal names use the `Estimatr_` prefix for compatibility with existing SPFx package IDs.

## Architecture

```
src/
  webparts/estimatr/       Web part entry + Teams theme
  components/              App, Wizard, Lobby, SessionView, History, Settings
  models/                  Domain types + enums
  services/                SharePointDataService, SessionOrchestrator, SessionEngine
                           PollingRealtimeService, PhotoService, ExportService
  state/                   EstimatrContext (React provider)
  utils/                   Code generator, theming, confetti
  config/                  Feature flags, appMeta (display name)
```

## Trust & anonymity model

**Pre-reveal secrecy** is enforced by the application not reading other participants' vote values before facilitator reveal. Vote counts and voter presence (voted/not-voted) are visible during open rounds; values are only loaded after reveal (or for the current user's own vote).

For high-compliance tenants, administrators may additionally restrict list item permissions on `Estimatr_Votes` so only facilitators can read vote values before reveal.

**True-anonymous mode** never writes `VoterId` or `VoterName` to the list — surveys and votes appear as anonymous tallies after reveal.

## Real-time (polling)

- Active sessions poll every **2.5s**; idle backoff to **15s**
- Pauses when browser tab is hidden (`document.visibilitychange`)
- Honors **429/503 Retry-After** with reconnecting pill
- Interface-isolated — SignalR can replace `PollingRealtimeService` later

## Profile photos

Three-tier fallback (cached in `sessionStorage`):

1. **Primary:** `{siteUrl}/_layouts/15/userphoto.aspx?size=M&accountname={upn}` — zero consent
2. **Enhanced:** Microsoft Graph `/users/{id}/photos/48x48/$value` when `enableGraphPhotos` flag is on
3. **Fallback:** Fluent UI Persona initials with deterministic color from userId hash

## Feature flags (integrations)

| Flag | Default | Purpose |
|------|---------|---------|
| enableGraphPhotos | off | Graph profile photos |
| enableGraphPresence | off | Teams-style presence dots |
| enableAzureDevOps | off | Import/writeback to ADO work items |

**Site setup → Advanced tab** exposes these as persisted toggles with inline configuration. A
site owner turns them on once and the choice is saved to the `Estimatr_Settings` list
(`FeatureFlagsJson` column) for everyone on the site. Some integrations also require a
Microsoft 365 admin to approve the associated API permission in the SharePoint admin center.

Per-integration configuration is saved in the `IntegrationConfigJson` column so facilitators
inherit defaults instead of retyping them each session:

- **Azure DevOps** — default organization + project, with a **Test connection** button.

Graph photos resolve via the participant UPN (`/users/{upn}/photos`), falling back to the
SharePoint user photo endpoint; presence resolves each UPN to an Azure AD object id before
querying `getPresencesByUserId`.

For per-session dev/QA overrides you can still force flags via the URL, and a URL value always
wins over the saved value for that browser session:

```
?estimatrFlags={"enableGraphPhotos":true,"enableAzureDevOps":true}
```

## Known limitations

- **Per-item vote types (mixed queues):** engine supports them; wizard creates one session type for all items.
- **Async mode:** stores the option and shows vote progress; no deadline enforcement yet.
- **ADO writeback:** numeric story points only (non-numeric poker cards are skipped).
- **Co-facilitators:** role exists in the model; assignment UI is not implemented yet.

## Azure DevOps integration

When `enableAzureDevOps` is true and admin consent is granted:

- Session wizard → import unestimated user stories via WIQL
- After final estimate → optional PATCH to Story Points field
- Graceful degradation message if consent missing

Resource ID: `499b84ac-1321-427f-aa17-267ca6975798`

## Testing

```powershell
npm test
```

SessionEngine has exhaustive unit tests (lock semantics, re-vote, auto-reveal, all session types, dot budget, anonymity).

## Throttling notes

SharePoint list throttling may occur with large rosters or rapid polling. Sprint Align uses indexed filters (`Code`, `SessionId`, `RoundId`, `ItemId`) and `$select` to minimize payload. On throttling, polling backs off automatically.

## FAQ for tenant admins

**Q: Does Sprint Align send data outside SharePoint?**  
A: No, for core features. Optional Graph photos and Azure DevOps require explicit feature flags + admin consent.

**Q: Who can create sessions?**  
A: Configurable in Estimatr_Settings (`everyone`, `members`, `owners`).

**Q: How long is data retained?**  
A: Default 90 days. Run retention trim from Settings.

**Q: Can I use this in Teams?**  
A: Yes — manifest supports TeamsTab and TeamsPersonalApp with theme detection.

**Q: How do participants join?**  
A: 6-character code or deep link `?estimatrSession=CODE`. Identity comes from Microsoft 365 automatically.

## Permissions summary

| Action | Permission |
|--------|------------|
| Provision lists | Site owner / Manage Lists |
| Create sessions | Site members (configurable) |
| Vote | Session participants |
| Graph photos | Admin consent: User.ReadBasic.All |
| Graph presence | Admin consent: Presence.Read.All |
| Azure DevOps | Admin consent: user_impersonation on ADO resource |
