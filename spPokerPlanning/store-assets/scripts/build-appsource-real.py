#!/usr/bin/env python3
"""Build AppSource store screenshots from the REAL app screenshots.

Layout: AI-generated branded background (no text/UI/logo) + Python-composited
marketing copy, the actual full-page app screenshot inside a browser frame, the
official app-icon lockup, and the original Chronodat wordmark. This guarantees
the store images show the genuine product UI (pixel-perfect) with consistent,
correctly-placed branding.

Output: 1366x768 PNGs (<=1024 KB) in generated/screenshots/.

Usage:
  python store-assets/scripts/build-appsource-real.py
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
    MUTED,
    NAVY,
    WHITE,
    load_chronodat_wordmark,
    load_font,
    paste_app_icon,
    place_screenshot,
    text_width,
)

SHOTS = ROOT / "generated" / "screenshots" / "full-page"
BG = ROOT / "generated" / "marketing" / "backgrounds" / "appsource-bg-a.png"
OUT = ROOT / "generated" / "screenshots"

W, H = 1366, 768
STORE_SIZE_LIMIT_KB = 1024

SUBTEXT = (71, 85, 105)  # slate-600, readable on the light left panel

# (out_name, headline, [subtext lines], screenshot, crop_top)
SCENES = [
    (
        "sprint-align-screenshot-01-home.png",
        "Align on estimates faster",
        ["Run planning poker, confidence checks,", "and team votes without leaving Microsoft 365."],
        "light-01-home.png",
        0,
    ),
    (
        "sprint-align-screenshot-02-voting.png",
        "Live voting, in real time",
        ["Everyone votes privately, then the", "facilitator reveals the round together."],
        "light-02-session-voting.png",
        34,
    ),
    (
        "sprint-align-screenshot-03-results.png",
        "Reveal results, reach consensus",
        ["See the spread and outliers at a glance,", "then save the agreed final estimate."],
        "light-03-session-results.png",
        34,
    ),
    (
        "sprint-align-screenshot-04-decks.png",
        "A deck for every team",
        ["Fibonacci, t-shirt sizes, dot voting,", "confidence checks, or build your own."],
        "light-11-deck-editor.png",
        0,
    ),
    (
        "sprint-align-screenshot-05-settings.png",
        "Your data stays in SharePoint",
        ["No external backend or extra sign-in.", "Brand and govern it for your tenant."],
        "light-06-settings-branding.png",
        0,
    ),
]

# Left copy column
MARGIN_X = 72
TEXT_MAX_W = 470
HEAD_TOP = 250
HEAD_FONT = load_font(46, bold=True)
HEAD_LH = 58
SUB_FONT = load_font(20)
SUB_LH = 30

# Right screenshot frame
SHOT_BOX = (556, 92, 1306, 676)


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


def draw_lockup(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    paste_app_icon(canvas, (MARGIN_X, 52, MARGIN_X + 58, 110))
    draw = ImageDraw.Draw(canvas)
    draw.text((MARGIN_X + 74, 56), APP_NAME, fill=NAVY, font=load_font(30, bold=True))
    draw.text((MARGIN_X + 74, 94), APP_SUBTITLE, fill=MUTED, font=load_font(14))


def draw_copy(canvas: Image.Image, headline: str, subtext: list[str]) -> None:
    draw = ImageDraw.Draw(canvas)
    y = HEAD_TOP
    for line in wrap(headline, HEAD_FONT, TEXT_MAX_W):
        draw.text((MARGIN_X, y), line, fill=NAVY, font=HEAD_FONT)
        y += HEAD_LH
    y += 18
    for line in subtext:
        draw.text((MARGIN_X, y), line, fill=SUBTEXT, font=SUB_FONT)
        y += SUB_LH


def stamp_chronodat(canvas: Image.Image) -> None:
    logo = load_chronodat_wordmark(light=False)
    target_h = 28
    target_w = max(1, int(logo.width * (target_h / logo.height)))
    logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    powered_font = load_font(15)
    powered_w = text_width(FOOTER_POWERED, powered_font)
    gap = 10
    x = MARGIN_X
    y = H - target_h - 44
    base = canvas.convert("RGBA")
    draw = ImageDraw.Draw(base)
    draw.text((x, y + (target_h - powered_font.size) // 2), FOOTER_POWERED, fill=MUTED, font=powered_font)
    base.alpha_composite(logo, (x + powered_w + gap, y))
    canvas.paste(base.convert("RGB"))


def load_background() -> Image.Image:
    bg = Image.open(BG).convert("RGB")
    scale = max(W / bg.width, H / bg.height)
    nw, nh = int(bg.width * scale), int(bg.height * scale)
    bg = bg.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    top = (nh - H) // 2
    return bg.crop((left, top, left + W, top + H))


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > STORE_SIZE_LIMIT_KB:
        img.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )
    print(f"  {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    if not BG.is_file():
        raise SystemExit(f"Missing background: {BG}")
    print(f"Store screenshots from real UI ({W}x{H}):")
    for out_name, headline, subtext, shot_name, crop_top in SCENES:
        shot = SHOTS / shot_name
        if not shot.is_file():
            print(f"  SKIP missing {shot_name}")
            continue
        canvas = load_background()
        draw_lockup(canvas)
        draw_copy(canvas, headline, subtext)
        place_screenshot(canvas, shot, SHOT_BOX, crop_top=crop_top)
        stamp_chronodat(canvas)
        save_under_cap(canvas, OUT / out_name)
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
