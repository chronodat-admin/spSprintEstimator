#!/usr/bin/env python3
"""Crop 1536×1024 marketing sheets to Partner Center 1366×768 PNGs (≤1024 KB)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "generated" / "marketing" / "appsource"
OUT = ROOT / "generated" / "screenshots"

TARGET_W, TARGET_H = 1366, 768
STORE_SIZE_LIMIT_KB = 1024

SHEETS = {
    "sprint-align-appsource-01-home.png": "sprint-align-screenshot-01-home.png",
    "sprint-align-appsource-02-voting.png": "sprint-align-screenshot-02-voting.png",
    "sprint-align-appsource-03-results.png": "sprint-align-screenshot-03-results.png",
    "sprint-align-appsource-04-decks.png": "sprint-align-screenshot-04-decks.png",
    "sprint-align-appsource-05-settings.png": "sprint-align-screenshot-05-settings.png",
}


def make_frame(src: Image.Image) -> Image.Image:
    scale = TARGET_H / src.height
    scaled_w = max(1, round(src.width * scale))
    scaled = src.resize((scaled_w, TARGET_H), Image.Resampling.LANCZOS)

    if scaled_w >= TARGET_W:
        left = (scaled_w - TARGET_W) // 2
        return scaled.crop((left, 0, left + TARGET_W, TARGET_H))

    canvas = Image.new("RGB", (TARGET_W, TARGET_H))
    pad_total = TARGET_W - scaled_w
    pad_left = pad_total // 2
    pad_right = pad_total - pad_left
    if pad_left:
        left_edge = scaled.crop((0, 0, 1, TARGET_H)).resize((pad_left, TARGET_H))
        canvas.paste(left_edge, (0, 0))
    canvas.paste(scaled, (pad_left, 0))
    if pad_right:
        right_edge = scaled.crop((scaled_w - 1, 0, scaled_w, TARGET_H)).resize((pad_right, TARGET_H))
        canvas.paste(right_edge, (pad_left + scaled_w, 0))
    return canvas


def save_under_cap(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    clean = img.convert("RGB")
    assert clean.size == (TARGET_W, TARGET_H)
    clean.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > STORE_SIZE_LIMIT_KB:
        clean.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )
    kb = path.stat().st_size / 1024
    print(f"  {path.relative_to(ROOT)} ({TARGET_W}x{TARGET_H}, {kb:.0f} KB)")


def main() -> None:
    print(f"Store crops ({TARGET_W}x{TARGET_H}):")
    for source_name, out_name in SHEETS.items():
        source_path = SRC / source_name
        if not source_path.is_file():
            print(f"  SKIP missing {source_name}")
            continue
        frame = make_frame(Image.open(source_path).convert("RGB"))
        save_under_cap(frame, OUT / out_name)
    print(f"Done. Output: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
