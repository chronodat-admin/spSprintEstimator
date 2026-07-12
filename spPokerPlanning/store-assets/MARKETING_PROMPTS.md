# Sprint Align — AI marketing infographic prompts

Generated assets live in `store-assets/generated/marketing/`. Use these prompts in any image model (DALL·E, Midjourney, Adobe Firefly, etc.) to recreate or iterate.

## Logos — never let AI draw the Chronodat wordmark

AI models garble and duplicate the Chronodat wordmark. So the AI must **not** draw
it at all: generate the artwork with a **clean empty bottom strip**, then composite
the real wordmark with Python.

| Logo | Path | How it gets on the image |
|------|------|--------------------------|
| **Sprint Align app icon** | `store-assets/generated/appicon-96.png` | Pass as a **reference image** so the icon stays consistent; AI may render it (top-left/hero center) |
| **Chronodat wordmark** | `store-assets/brand/chronodat-logo.png` | **Composited by Python** (`embed-marketing-brand.py`), bottom-left "Powered by CHRONODAT" — never AI-drawn |

**Workflow**

1. Generate each image with the app-icon reference and the "no Chronodat logo" suffix below (reserve a clean bottom ~14% strip).
2. Save into `store-assets/generated/marketing/` as `sprint-align-infographic-*.png`.
3. Stamp the real wordmark once: `python store-assets/scripts/embed-marketing-brand.py` (logo-only; auto light/dark ink; bottom-left).

Regenerate Chronodat PNG from SVG: `python store-assets/brand/extract-chronodat-logo.py`

**Prompt suffix (append to every generation):**

```
CRITICAL: Use the EXACT Sprint Align app icon from the reference image, unchanged. Do NOT include any Chronodat logo, wordmark, "CT Chronodat", or "Powered by" text anywhere in the image. Leave the bottom ~14% as a clean, empty, unobstructed strip of plain background so the real logo can be composited later.
```

## Store screenshots — real UI embedded + info footer (CURRENT / recommended)

These are the images actually submitted to AppSource. The AI embeds the **real
app screenshot** (passed as reference) inside a branded navy infographic, and
Python adds a crisp **footer strip** of platform / trust facts and resizes to the
exact store size. AI never draws footer text or the Chronodat logo.

**Pipeline**

1. Generate 4 infographics with the reference screenshot + app icon and the
   prompt below. Each **reserves a clean, empty, solid deep-navy bottom band**
   (~25%) for the footer.
2. Stage the clean PNGs into `generated/marketing/_ai_clean/`.
3. `python store-assets/scripts/build-store-infographics.py` → draws the footer
   pill row and writes 1366×768 (≤1024 KB) PNGs to `generated/screenshots/`.

**Footer facts (drawn by the AI, baked into the image):**

- Runs in SharePoint & Teams
- Microsoft 365 sign-in
- Data stays in your tenant
- No external backend
- Secure by design

The AI renders the footer strip directly (it produces a cleaner, better-integrated
footer than compositing). Only the crop-to-store-size step runs in Python
(`build-store-ai.py`, center crop to 1366×768). Still never let AI draw the
Chronodat logo.

**Prompt template (per scene — swap headline/subtitle/bullets):**

```
Premium enterprise SaaS marketing infographic, 16:9 landscape. Deep navy (#0f172a)
background with a subtle blue-to-teal glow on the right and faint gold sparkle dots;
lots of clean negative space. EMBED the FIRST reference image (an app screenshot)
EXACTLY as-is and unaltered — do NOT redraw, restyle, crop content, or change any
text in it — inside a floating browser window with rounded corners and a soft
drop shadow, occupying the right ~55% of the UPPER area. Left column: small square
app icon (SECOND reference) beside "Sprint Align" in white at the top; bold white
headline <HEADLINE>; slate-grey subtitle <SUBTITLE>; three lime-green (#c1e316)
bullet dots with white labels <BULLETS>.
FOOTER: at the very bottom draw a solid deep-navy footer strip with a thin
lime-green (#c1e316) top divider line, containing ONE centered row of five small
rounded pill badges, each with a small lime dot and crisp, correctly-spelled white
text reading exactly: "Runs in SharePoint & Teams", "Microsoft 365 sign-in",
"Data stays in your tenant", "No external backend", "Secure by design".
COMPOSITION: this will be cropped to 16:9 — keep the icon/title, all content and the
footer strip inside the central 84% of the height, leaving a clean ~8% empty margin
at the very top and very bottom. Do NOT draw any Chronodat logo or wordmark.
Modern, minimal, high-end B2B look.
```

---

## Brand palette (keep consistent)

| Role | Hex | Use |
|------|-----|-----|
| Navy background | `#0f172a` | Hero backgrounds |
| Primary blue | `#2563eb` | Buttons, gradients |
| Deep blue | `#1e40af` | Gradient start |
| Accent cyan | `#0ea5e9` | Gradient end |
| Gold accent | `#f1dd00` | Chronodat highlights, badges |
| Success green | `#34d399` | “Card in!” / voted state |

**Product name:** Sprint Align  
**Tagline:** Planning poker & agile voting for Microsoft 365  
**Publisher:** Chronodat LLC

---

## 1. Hero overview

**File:** `sprint-align-infographic-hero.png`  
**Aspect ratio:** 16:9 (resize to 1366×768 for store screenshots if needed)

```
Professional SaaS marketing infographic, 16:9 landscape. Product: "Sprint Align" — planning poker and agile estimation for Microsoft 365. Hero layout: left side shows stylized Microsoft Teams/SharePoint cloud icons connected to a central poker-card estimation UI mockup with Fibonacci numbers (1, 2, 3, 5, 8, 13). Right side bold headline area reading "Sprint Align" in clean sans-serif, subhead "Planning poker & agile voting for Microsoft 365". Color palette: deep navy background (#0f172a), electric blue gradients (#2563eb to #0ea5e9), subtle gold accent (#f1dd00) on highlights. Modern flat vector infographic style, enterprise Microsoft marketplace aesthetic, generous whitespace, no photorealistic people, crisp icons, polished AppSource listing hero image.
```

**Use for:** Partner Center hero, website banner, pitch deck cover.

---

## 2. Feature grid

**File:** `sprint-align-infographic-features.png`  
**Aspect ratio:** 16:9

```
Marketing infographic poster, 16:9 landscape, titled "Why Sprint Align". Six feature tiles in a 2x3 grid with icons and short labels: (1) Planning poker & 6 vote types with poker cards icon, (2) SharePoint-native data with SharePoint list icon, (3) Join by 6-character code with link icon, (4) Full-page workshop mode with immersive screen icon, (5) Facilitator reveal & CSV export with chart icon, (6) Custom branding & decks with palette icon. Brand colors: navy background, blue-teal gradients, gold accent lines. Clean corporate infographic, Microsoft 365 partner marketplace style, minimal readable text, flat modern illustration, no photos of people, professional B2B software marketing asset.
```

**Use for:** AppSource “Features” section, sales one-pager, LinkedIn carousel slide 1.

---

## 3. How it works (4 steps)

**File:** `sprint-align-infographic-how-it-works.png`  
**Aspect ratio:** 16:9

```
Step-by-step "How it works" infographic, 16:9 landscape, horizontal flow with 4 numbered steps connected by arrows. Step 1: "Deploy" — app catalog icon. Step 2: "Setup" — site owner provisions SharePoint lists. Step 3: "Create session" — facilitator shares 6-character join code. Step 4: "Vote & reveal" — team selects hidden estimates then simultaneous reveal. Product name "Sprint Align" small badge top-left. Colors: navy and blue gradient (#1e40af, #2563eb), white cards, gold step numbers. Clean flat vector infographic for software store listing, enterprise agile/Scrum audience, polished and simple, no cluttered paragraphs.
```

**Use for:** Getting-started docs, onboarding email, store long-description supplement.

---

## 4. Data trust / security

**File:** `sprint-align-infographic-data-trust.png`  
**Aspect ratio:** 16:9

```
Security and trust marketing infographic, 16:9 landscape. Central shield icon protecting SharePoint list/database symbol. Headline: "Your data stays in your tenant". Three supporting bullets with icons: "No external estimation server", "Sessions stored in SharePoint lists", "Microsoft 365 identity — no extra signup". Subtle Microsoft cloud motif in background. Brand: Sprint Align agile estimation app, navy (#0f172a) background, blue gradient accents, gold trust badge accent. Professional enterprise infographic for AppSource marketplace, flat modern design, reassuring B2B tone, clean typography, no people photos.
```

**Use for:** Security review conversations, IT admin objections, compliance sidebar.

---

## 5. Facilitator workflow

**File:** `sprint-align-infographic-facilitator.png`  
**Aspect ratio:** 16:9

```
Facilitator workflow infographic, 16:9 landscape. Split layout: left shows backlog items queue, center shows live voting round with participant avatars and "Thinking..." / "Card in!" status pills, right shows revealed Fibonacci results (5, 8, 13) with consensus highlight. Title: "Run estimation workshops with confidence". Subtitle: "Facilitator controls · Hidden votes · Re-vote rounds". Sprint Align branding colors: navy, blue gradient, soft green for voted status, gold accent on facilitator badge. Modern product marketing infographic mimicking planning poker session UI, flat illustration style for Microsoft Teams/SharePoint store marketing, no realistic screenshots, stylized clean mockup.
```

**Use for:** Session-focused store screenshot alternative, demo workshop marketing.

---

## 6. Social square

**File:** `sprint-align-infographic-social-square.png`  
**Aspect ratio:** 1:1

```
Square social/marketing infographic 1:1 for LinkedIn and Partner Center supplemental image. Center: large poker playing card icon with Fibonacci "8" on it, surrounded by orbit icons for Teams, SharePoint, Scrum, dot voting, surveys. Bold text "Sprint Align" and tagline "Align your team on story points". Chronodat-style palette: navy background, blue-teal gradient ring, gold sparkle accents. Premium SaaS app launch graphic, minimal text, high contrast, flat vector, suitable for marketplace thumbnail or social post.
```

**Use for:** LinkedIn, X/Twitter, Teams app promo, Partner Center optional image.

---

## Store submission notes

| Asset type | Partner Center requirement | Suggested file |
|------------|---------------------------|----------------|
| Screenshots | 1366×768 px, ≤1024 KB, min 3 | Resize hero or facilitator to 1366×768; **also** capture live tenant screenshots per `STORE_LISTING.md` |
| Large logo | 216–350 px PNG | `generated/store-logo-300.png` (existing) |
| Supplemental marketing | Optional | Any 16:9 infographic above |

**Tip:** AI-generated text in images may have spelling errors. For final store submission, either fix text in Figma/Canva or use infographics as design references and overlay exact copy from `STORE_LISTING.md`.

## Regenerate in Cursor

Ask the agent: *“Regenerate Sprint Align marketing infographic #2 with darker navy background”* and reference the prompt block above.
