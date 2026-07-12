#!/usr/bin/env python3
"""Build marketing INFOGRAPHICS from the REAL app screenshots.

Same branded infographic look as the AI marketing set (deep-navy background,
app-icon lockup, feature copy, Chronodat wordmark) but the visuals are the
genuine product UI: real dark-mode full-page screenshots are composited into
floating window frames on top of an AI-generated navy background (no text / no
UI / no logo). This keeps the aesthetic polish of AI art while guaranteeing the
UI and branding are pixel-accurate and consistent.

Output: 1366x768 PNGs in generated/marketing/ (prefixed sprint-align-real-*).

Usage:
  python store-assets/scripts/build-infographics-real.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.brand_compositor import (  # noqa: E402
    APP_NAME,
    APP_SUBTITLE,
    FOOTER_POWERED,
    load_chronodat_wordmark,
    load_font,
    paste_app_icon,
    place_screenshot,
    text_width,
)

SHOTS = ROOT / "generated" / "screenshots" / "full-page"
BG_DIR = ROOT / "generated" / "marketing" / "backgrounds"
BG_A = BG_DIR / "infographic-navy-a.png"   # dark-left, glow-right (spotlights)
BG_B = BG_DIR / "infographic-navy-b.png"   # even navy, top glow (workflow)
OUT = ROOT / "generated" / "marketing"

W, H = 1366, 768

# Palette on navy
WHITE = (255, 255, 255)
SUB = (148, 163, 184)      # slate-400
BODY = (203, 213, 225)     # slate-300
ACCENT = (193, 227, 22)    # Sprint Align lime
ACCENT_SOFT = (163, 210, 40)

MARGIN_X = 72

# (out_name, headline, subline, [(bullet_title, bullet_desc)], screenshot, crop_top)
SPOTLIGHTS = [
    (
        "sprint-align-real-infographic-hero.png",
        "Align on estimates faster",
        "Planning poker, confidence checks, and team votes\nright inside SharePoint and Microsoft Teams.",
        [
            ("No external backend", "Your data stays in your own SharePoint tenant."),
            ("No separate sign-in", "Works with the Microsoft 365 accounts you already use."),
            ("Ready in minutes", "Add the web part, launch a room, invite the team."),
        ],
        "dark-01-home.png",
        0,
    ),
    (
        "sprint-align-real-infographic-voting.png",
        "Live voting, in real time",
        "Everyone votes privately, then the facilitator\nreveals the whole round together.",
        [
            ("Private until reveal", "Votes stay hidden so no one anchors on others."),
            ("Live participation", "See who has voted across the team roster."),
            ("Any deck you like", "Fibonacci, t-shirts, dot voting, or confidence."),
        ],
        "dark-02-session-voting.png",
        34,
    ),
    (
        "sprint-align-real-infographic-results.png",
        "Reveal results, reach consensus",
        "See the spread and outliers at a glance,\nthen lock in the agreed final estimate.",
        [
            ("Average, median & range", "Instant stats to frame the discussion."),
            ("Spot the outliers", "High and low votes are flagged for a quick talk."),
            ("Save the final estimate", "Pick the agreed card and move to the next item."),
        ],
        "dark-03-session-results.png",
        34,
    ),
    (
        "sprint-align-real-infographic-trust.png",
        "Yours to brand and govern",
        "Match your team's brand and keep everything\ninside the tenant you already trust.",
        [
            ("Your SharePoint, your data", "No third-party backend or extra data processor."),
            ("Brand it for your team", "Colours, logo, and light or dark themes."),
            ("Admin friendly", "Standard SPFx deployment and permissions."),
        ],
        "dark-06-settings-branding.png",
        0,
    ),
]

# Right-side screenshot window for spotlights
SHOT_BOX = (632, 132, 1306, 660)

# Workflow scene
WORKFLOW = (
    "sprint-align-real-infographic-how-it-works.png",
    "From backlog to consensus",
    [
        ("dark-01-home.png", 0, "1", "Create a room", "Pick the deck and add work items."),
        ("dark-02-session-voting.png", 34, "2", "Vote privately", "Everyone picks a card in real time."),
        ("dark-03-session-results.png", 34, "3", "Reveal & agree", "Discuss outliers, save the estimate."),
    ],
)


def load_bg(path: Path) -> Image.Image:
    bg = Image.open(path).convert("RGB")
    scale = max(W / bg.width, H / bg.height)
    nw, nh = int(bg.width * scale), int(bg.height * scale)
    bg = bg.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    top = (nh - H) // 2
    return bg.crop((left, top, left + W, top + H))


def draw_lockup(canvas: Image.Image) -> None:
    paste_app_icon(canvas, (MARGIN_X, 48, MARGIN_X + 56, 104))
    draw = ImageDraw.Draw(canvas)
    draw.text((MARGIN_X + 72, 52), APP_NAME, fill=WHITE, font=load_font(28, bold=True))
    draw.text((MARGIN_X + 72, 88), APP_SUBTITLE, fill=SUB, font=load_font(14))


def stamp_chronodat(canvas: Image.Image, *, x: int = MARGIN_X) -> None:
    logo = load_chronodat_wordmark(light=True)
    target_h = 26
    target_w = max(1, int(logo.width * (target_h / logo.height)))
    logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    powered_font = load_font(14)
    powered_w = text_width(FOOTER_POWERED, powered_font)
    gap = 10
    y = H - target_h - 40
    base = canvas.convert("RGBA")
    draw = ImageDraw.Draw(base)
    draw.text((x, y + (target_h - powered_font.size) // 2), FOOTER_POWERED,
              fill=(203, 213, 225), font=powered_font)
    base.alpha_composite(logo, (x + powered_w + gap, y))
    canvas.paste(base.convert("RGB"))


def draw_headline(canvas: Image.Image, headline: str, subline: str, top: int) -> int:
    draw = ImageDraw.Draw(canvas)
    head_font = load_font(44, bold=True)
    max_w = 500
    y = top
    for line in wrap(headline, head_font, max_w):
        draw.text((MARGIN_X, y), line, fill=WHITE, font=head_font)
        y += 54
    y += 12
    sub_font = load_font(19)
    for line in subline.split("\n"):
        draw.text((MARGIN_X, y), line, fill=BODY, font=sub_font)
        y += 28
    return y


def draw_bullets(canvas: Image.Image, bullets, top: int) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(18, bold=True)
    desc_font = load_font(15)
    y = top
    for title, desc in bullets:
        cy = y + 11
        draw.ellipse((MARGIN_X, cy, MARGIN_X + 12, cy + 12), fill=ACCENT)
        tx = MARGIN_X + 26
        draw.text((tx, y), title, fill=WHITE, font=title_font)
        draw.text((tx, y + 24), desc, fill=SUB, font=desc_font)
        y += 62


def wrap(text: str, font, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if text_width(trial, font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def build_spotlight(scene) -> None:
    out_name, headline, subline, bullets, shot_name, crop_top = scene
    shot = SHOTS / shot_name
    if not shot.is_file():
        print(f"  SKIP missing {shot_name}")
        return
    canvas = load_bg(BG_A)
    draw_lockup(canvas)
    y = draw_headline(canvas, headline, subline, top=180)
    draw_bullets(canvas, bullets, top=y + 26)
    place_screenshot(canvas, shot, SHOT_BOX, crop_top=crop_top)
    stamp_chronodat(canvas)
    save(canvas, OUT / out_name)


def build_workflow() -> None:
    out_name, title, steps = WORKFLOW
    canvas = load_bg(BG_B)
    draw_lockup(canvas)
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(46, bold=True)
    tw = text_width(title, title_font)
    draw.text(((W - tw) // 2, 150), title, fill=WHITE, font=title_font)

    card_w, card_h = 380, 250
    gap = (W - 2 * MARGIN_X - 3 * card_w) // 2
    top = 288
    arrow_font = load_font(48, bold=True)
    num_font = load_font(22, bold=True)
    step_title_font = load_font(22, bold=True)
    step_desc_font = load_font(15)

    for i, (shot_name, crop_top, num, s_title, s_desc) in enumerate(steps):
        x0 = MARGIN_X + i * (card_w + gap)
        box = (x0, top, x0 + card_w, top + card_h)
        place_screenshot(canvas, SHOTS / shot_name, box, crop_top=crop_top)
        if i > 0:
            ax = x0 - gap // 2 - 12
            draw.text((ax, top + card_h // 2 - 30), "\u203a", fill=ACCENT, font=arrow_font)
        cap_y = top + card_h + 22
        draw.ellipse((x0, cap_y, x0 + 34, cap_y + 34), fill=ACCENT)
        nw = text_width(num, num_font)
        draw.text((x0 + (34 - nw) // 2, cap_y + 3), num, fill=(15, 23, 42), font=num_font)
        draw.text((x0 + 46, cap_y - 2), s_title, fill=WHITE, font=step_title_font)
        draw.text((x0 + 46, cap_y + 26), s_desc, fill=SUB, font=step_desc_font)

    stamp_chronodat(canvas)
    save(canvas, OUT / out_name)


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    print(f"  {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    for bg in (BG_A, BG_B):
        if not bg.is_file():
            raise SystemExit(f"Missing background: {bg}")
    print(f"Infographics from real UI ({W}x{H}):")
    for scene in SPOTLIGHTS:
        build_spotlight(scene)
    build_workflow()
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
