#!/usr/bin/env python3
"""Fit AI infographics (footer baked in by the AI) to store submission size.

The image model outputs 3:2 (1536x1024). Store screenshots must be 1366x768
(16:9). Cropping would clip the AI-drawn footer or the top lockup, so instead we
fit the whole image by HEIGHT and seamlessly extend the navy background on the
left/right by stretching the edge columns. Nothing is distorted or cut.

Input : clean AI PNGs staged in generated/marketing/_ai_clean/.
Output: 1366x768 PNGs (<=1024 KB) in generated/screenshots/.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "generated" / "marketing" / "_ai_clean"
OUT = ROOT / "generated" / "screenshots"

W, H = 1366, 768
CAP_KB = 1024

IMAGES = [
    ("ai-embed-hero.png", "sprint-align-screenshot-01-home.png"),
    ("ai-embed-voting.png", "sprint-align-screenshot-02-voting.png"),
    ("ai-embed-results.png", "sprint-align-screenshot-03-results.png"),
    ("ai-embed-trust.png", "sprint-align-screenshot-04-settings.png"),
    ("ai-embed-howitworks.png", "sprint-align-screenshot-05-how-it-works.png"),
]


def fit_extend(img: Image.Image) -> Image.Image:
    scale = H / img.height
    nw = round(img.width * scale)
    resized = img.resize((nw, H), Image.Resampling.LANCZOS)

    if nw >= W:
        left = (nw - W) // 2
        return resized.crop((left, 0, left + W, H))

    canvas = Image.new("RGB", (W, H))
    x = (W - nw) // 2
    left_fill = resized.crop((0, 0, 2, H)).resize((x + 1, H), Image.Resampling.LANCZOS)
    right_w = W - (x + nw)
    right_fill = resized.crop((nw - 2, 0, nw, H)).resize((max(1, right_w), H), Image.Resampling.LANCZOS)
    canvas.paste(left_fill, (0, 0))
    canvas.paste(right_fill, (x + nw, 0))
    canvas.paste(resized, (x, 0))
    return canvas


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > CAP_KB:
        img.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )
    print(f"  {path.relative_to(ROOT)} ({img.width}x{img.height}, {path.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    print(f"Store images (AI-baked footer) ({W}x{H}):")
    for src_name, out_name in IMAGES:
        src = SRC / src_name
        if not src.is_file():
            print(f"  SKIP missing {src_name}")
            continue
        save_under_cap(fit_extend(Image.open(src).convert("RGB")), OUT / out_name)
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
