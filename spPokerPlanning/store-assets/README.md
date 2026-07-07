# Sprint Align store assets

Marketplace icons, screenshots, and listing copy for AppSource / SharePoint Store submission.

## Regenerate icons

1. Replace or edit `store-assets/sprint-align-master-icon.png` (1024×1024 AI master with Chronodat navy + gold branding).
2. Run:

```powershell
python store-assets/generate-icons.py
```

Requires Python 3 with [Pillow](https://pypi.org/project/Pillow/) (`pip install pillow`).

All marketplace, SPFx, and Teams sizes are derived from the master icon. Brand colors match Chronodat (`#f1dd00` gold, navy backgrounds).

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
