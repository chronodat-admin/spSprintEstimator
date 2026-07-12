#!/usr/bin/env python3
"""Convert the clean AI-embedded infographics (no logo) into store-submission PNGs.

Source: AI-generated infographics that embed the real app screenshots, with NO
Chronodat wordmark. Output: 1366x768 PNGs (<=1024 KB) ready for AppSource /
Partner Center, written to generated/screenshots/.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "generated" / "marketing" / "_ai_clean"
OUT = ROOT / "generated" / "screenshots"

W, H = 1366, 768
CAP_KB = 1024

# (source, output, vertical anchor 0=top .. 1=bottom)
IMAGES = [
    ("ai-embed-hero.png", "sprint-align-screenshot-01-home.png", 0.42),
    ("ai-embed-voting.png", "sprint-align-screenshot-02-voting.png", 0.42),
    ("ai-embed-results.png", "sprint-align-screenshot-03-results.png", 0.42),
    ("ai-embed-trust.png", "sprint-align-screenshot-04-settings.png", 0.42),
]


def cover_to_store(img: Image.Image, anchor_y: float) -> Image.Image:
    scale = max(W / img.width, H / img.height)
    nw, nh = round(img.width * scale), round(img.height * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    top = int((nh - H) * anchor_y)
    top = max(0, min(top, nh - H))
    return resized.crop((left, top, left + W, top + H))


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > CAP_KB:
        img.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )
    print(f"  {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    print(f"Store submission images ({W}x{H}):")
    for src_name, out_name, anchor in IMAGES:
        src = SRC / src_name
        if not src.is_file():
            print(f"  SKIP missing {src_name}")
            continue
        img = Image.open(src).convert("RGB")
        save_under_cap(cover_to_store(img, anchor), OUT / out_name)
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
