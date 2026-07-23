# Sprint Align store assets

Marketplace icons, screenshots, and listing copy for AppSource / SharePoint Store submission.

> **Full AppSource submission pack** (HTML description, categories, keywords, certification
> notes, checklist): [`docs/store-submission/README.md`](../docs/store-submission/README.md)

## Regenerate icons

1. Replace or edit `store-assets/sprint-align-master-icon.png` (1024×1024 AI master with Chronodat navy + gold branding).
2. Run:

```powershell
python store-assets/generate-icons.py
```

Requires Python 3 with [Pillow](https://pypi.org/project/Pillow/) (`pip install pillow`).

All marketplace, SPFx, and Teams sizes are derived from the master icon. Brand colors match Chronodat (`#f1dd00` gold, navy backgrounds).

> Listing screenshots (`generated/screenshots/sprint-align-screenshot-0N-*.png`) are **not**
> generated here. Use `npm run assets:store-screenshots` (AI pipeline) or
> `npm run test:e2e:screenshots` (live demo UI captures).

## Store screenshots — AI-embedded real UI + AI icon footer (CURRENT / recommended)

These are the images actually submitted to AppSource. The image model **embeds the
real dark-mode app screenshot** (passed as the first reference), the **app icon**
(second reference), the left-column headline/subtitle/bullets, **and a baked-in
footer strip of icon pills** — the AI renders the footer directly because it
integrates far better than compositing. Each image gets its **own themed footer**
(different facts + icons per scene). The AI never draws the Chronodat logo.

**Pipeline**

1. Generate 5 infographics (`ai-embed-{hero,voting,results,trust,howitworks}.png`)
   using the per-scene prompts in `MARKETING_PROMPTS.md` (real screenshot + app icon
   references; footer pills baked in). The model outputs 3:2 (1536×1024).
2. Stage the clean PNGs into `generated/marketing/_ai_clean/`.
3. `python store-assets/scripts/build-store-ai.py` → fits each to **1366×768** (≤1024 KB)
   by scaling to height and **seamlessly extending the navy background on the sides**
   (no crop, so the top lockup and footer are never clipped; no distortion), writing to
   `generated/screenshots/sprint-align-screenshot-0N-*.png`.

**Per-image footer icon pills (baked by the AI, distinct per scene):**

- Hero: Runs in SharePoint & Teams · Microsoft 365 sign-in · Ready in minutes · No external backend
- Voting: Private until reveal · Live participation · 6 voting deck types · Real-time updates
- Results: Average, median & range · Outliers flagged · Save agreed estimate · CSV export
- Trust: Data stays in your tenant · Custom branding & themes · Secure by design · Admin-friendly deployment
- How it works: Facilitator controls · Whole team votes · Hidden until reveal · Fast consensus

---

## AppSource store screenshots (real UI + consistent branding)

The store screenshots show the **genuine app UI** (pixel-perfect real screenshots),
placed in a browser frame on an **AI-generated branded background**, with the
official **app-icon lockup** and the original **Chronodat wordmark** composited in
code so branding is identical and correctly placed across every image. This follows
Microsoft AppSource guidance (show the real product experience; 1366×768; ≤1024 KB).

One command:

```powershell
npm run assets:appsource   # -> build-appsource-real.py
```

Pipeline (`build-appsource-real.py`):

1. **Real screenshots** come from `generated/screenshots/full-page/light-*.png` (captured via `npm run test:e2e:fullpage`). Recapture these whenever the UI changes.
2. **AI background** — abstract, brand-palette (lime-green → teal → cream), no text/UI/logo — lives at `generated/marketing/backgrounds/appsource-bg-a.png`. Regenerate with an AI image tool only if you want a new look; keep it text/logo-free.
3. **Python composites** each 1366×768 frame: app-icon lockup + product name (top-left), headline + subtext (left), the real screenshot in a shadowed rounded browser frame (right), and the Chronodat "Powered by" wordmark (bottom-left).

Final store-ready files land in `generated/screenshots/sprint-align-screenshot-0N-*.png`
(home, voting, results, decks, settings).

### Branded infographics from the real UI (`build-infographics-real.py`)

Same deep-navy infographic look as the AI marketing set, but the visuals are the
genuine product UI — the real **dark-mode** full-page screenshots
(`generated/screenshots/full-page/dark-*.png`) composited into floating window
frames on AI-generated navy backgrounds (no text/UI/logo) at
`generated/marketing/backgrounds/infographic-navy-{a,b}.png`.

```powershell
python store-assets/scripts/build-infographics-real.py
```

Outputs 1366×768 `generated/marketing/sprint-align-real-infographic-*.png`
(hero, voting, results, trust, how-it-works). App-icon lockup (top-left),
feature copy (left), and a single real Chronodat wordmark (bottom-left) are all
composited in code so branding is identical across every image.

### Fully AI-illustrated variants (optional)

`embed-marketing-brand.py` can stamp the real Chronodat wordmark onto stand-alone
AI-illustrated one-pagers that reserve a clean empty corner:

```powershell
python store-assets/scripts/embed-marketing-brand.py           # logo-only (keeps AI art)
python store-assets/scripts/embed-marketing-brand.py --full    # wipe + restamp icon + logo
```

Refresh Chronodat PNG from SVG: `python store-assets/brand/extract-chronodat-logo.py`

## Files

| Output | Use |
|--------|-----|
| `../sharepoint/assets/appicon.png` | App catalog / trust dialog icon (96×96, set via `iconPath`) |
| `generated/store-logo-300.png` | Partner Center large logo (upload 216–350 px) |
| `generated/store-logo-216.png` | Alternate marketplace logo |
| `generated/screenshots/*.png` | Listing screenshots (1366×768); replace with live tenant captures before submit |
| `generated/marketing/*.png` | AI marketing infographics (hero, features, how-it-works, trust, facilitator, social) |
| `brand/sprint-align-app-icon.png` | Copy of master app icon for marketing reference |
| `brand/chronodat-logo.png` | Official Chronodat wordmark (extracted from chronodat.com SVG) |
| `brand/chronodat-logo.svg` | Source Chronodat logo from website |
| `../teams/*_color.png` | Microsoft Teams app color icon (192×192) |
| `../teams/*_outline.png` | Teams outline icon (32×32) |
| `../src/webparts/estimatr/assets/icon-64.png` | SharePoint web part toolbox icon |
| `../src/webparts/estimatr/assets/full-page-icon.png` | Single app page picker image (193×158) |

## Listing copy

- **`STORE_LISTING.md`** — full descriptions, captions, keywords, legal placeholders
- **`MARKETING_PROMPTS.md`** — AI prompts used to generate `generated/marketing/` infographics
- **`partner-center-fields.json`** — structured fields for Partner Center paste/import

Edit `STORE_LISTING.md` first, then sync URLs into `config/package-solution.json` (`developer.privacyUrl`, `termsOfUseUrl`, `websiteUrl`) before publishing.
