#!/usr/bin/env python3
"""Finalize AppSource store screenshots from the AI-embedded infographics.

Input : clean AI infographics (real screenshot embedded, no logo, reserved
        bottom band) staged in generated/marketing/_ai_clean/.
Output: 1366x768 PNGs (<=1024 KB) in generated/screenshots/ with a crisp,
        Python-drawn info footer (SharePoint / Teams / security / tenant data).
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.brand_compositor import load_font, text_width  # noqa: E402

SRC = ROOT / "generated" / "marketing" / "_ai_clean"
OUT = ROOT / "generated" / "screenshots"

W, H = 1366, 768
CAP_KB = 1024

NAVY = (15, 23, 42)
PILL_FILL = (23, 33, 56)
PILL_BORDER = (51, 65, 85)
ACCENT = (193, 227, 22)
TEXT = (226, 232, 240)

FOOTER_H = 78
FOOTER_ITEMS = [
    "Runs in SharePoint & Teams",
    "Microsoft 365 sign-in",
    "Data stays in your tenant",
    "No external backend",
    "Secure by design",
]

# (source, output)
IMAGES = [
    ("ai-embed-hero.png", "sprint-align-screenshot-01-home.png"),
    ("ai-embed-voting.png", "sprint-align-screenshot-02-voting.png"),
    ("ai-embed-results.png", "sprint-align-screenshot-03-results.png"),
    ("ai-embed-trust.png", "sprint-align-screenshot-04-settings.png"),
]


def cover_top(img: Image.Image) -> Image.Image:
    scale = max(W / img.width, H / img.height)
    nw, nh = round(img.width * scale), round(img.height * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    return resized.crop((left, 0, left + W, H))


def draw_footer(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    top = H - FOOTER_H
    draw.rectangle((0, top, W, H), fill=NAVY)
    draw.rectangle((0, top, W, top + 2), fill=ACCENT)

    font = load_font(16)
    pill_h = 42
    pad_x = 18
    dot_r = 4
    dot_gap = 10
    gap = 18

    dims = []
    for label in FOOTER_ITEMS:
        tw = text_width(label, font)
        pw = pad_x + dot_r * 2 + dot_gap + tw + pad_x
        dims.append((label, tw, pw))

    total = sum(d[2] for d in dims) + gap * (len(dims) - 1)
    x = (W - total) // 2
    py = top + (FOOTER_H - pill_h) // 2 + 1

    for label, tw, pw in dims:
        draw.rounded_rectangle((x, py, x + pw, py + pill_h), radius=pill_h // 2,
                               fill=PILL_FILL, outline=PILL_BORDER, width=1)
        cy = py + pill_h // 2
        dot_x = x + pad_x
        draw.ellipse((dot_x, cy - dot_r, dot_x + dot_r * 2, cy + dot_r), fill=ACCENT)
        text_x = dot_x + dot_r * 2 + dot_gap
        text_y = cy - font.size // 2 - 1
        draw.text((text_x, text_y), label, fill=TEXT, font=font)
        x += pw + gap


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > CAP_KB:
        img.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )
    print(f"  {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    print(f"Store infographics with info footer ({W}x{H}):")
    for src_name, out_name in IMAGES:
        src = SRC / src_name
        if not src.is_file():
            print(f"  SKIP missing {src_name}")
            continue
        canvas = cover_top(Image.open(src).convert("RGB"))
        draw_footer(canvas)
        save_under_cap(canvas, OUT / out_name)
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
