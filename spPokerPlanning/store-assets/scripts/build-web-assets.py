#!/usr/bin/env python3
"""Stage Sprint Align images into the chronodat-web site tree.

Copies store screenshots (slides), an app icon (96px), the how-it-works
infographic, and per-topic wiki figures (from light full-page screenshots,
downscaled for the web) into C:/chronodatWeb/chronodat-web/img/sprint-align/.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SA = Path(__file__).resolve().parents[1]  # store-assets
SHOTS = SA / "generated" / "screenshots"
FULL = SHOTS / "full-page"
BRAND = SA / "brand"

WEB = Path(r"C:\chronodatWeb\chronodat-web\img\sprint-align")
WIKI = WEB / "wiki"
INFO = WEB / "infographics"

# Marketing slides (already 1366x768) -> product page carousel
SLIDES = {
    "slide-1-home.png": SHOTS / "sprint-align-screenshot-01-home.png",
    "slide-2-voting.png": SHOTS / "sprint-align-screenshot-02-voting.png",
    "slide-3-results.png": SHOTS / "sprint-align-screenshot-03-results.png",
    "slide-4-branding.png": SHOTS / "sprint-align-screenshot-04-settings.png",
    "slide-5-how-it-works.png": SHOTS / "sprint-align-screenshot-05-how-it-works.png",
}

# Wiki figures from light full-page screenshots (downscaled)
WIKI_FIGS = {
    "01-home.png": FULL / "light-01-home.png",
    "02-voting.png": FULL / "light-02-session-voting.png",
    "03-results.png": FULL / "light-03-session-results.png",
    "04-setup.png": FULL / "light-04-settings-setup.png",
    "05-governance.png": FULL / "light-05-settings-governance.png",
    "06-branding.png": FULL / "light-06-settings-branding.png",
    "07-home-page.png": FULL / "light-07-settings-home-page.png",
    "08-layout.png": FULL / "light-08-settings-layout.png",
    "09-subscription.png": FULL / "light-09-settings-subscription.png",
    "10-advanced.png": FULL / "light-10-settings-advanced.png",
    "11-deck-editor.png": FULL / "light-11-deck-editor.png",
    "12-history.png": FULL / "light-12-history.png",
}

WIKI_MAX_W = 1200
CAP_KB = 1024


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True, compress_level=9)
    if path.stat().st_size / 1024 > CAP_KB:
        img.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGB").save(
            path, format="PNG", optimize=True, compress_level=9
        )


def copy_slide(src: Path, dst: Path) -> None:
    save_png(Image.open(src).convert("RGB"), dst)


def downscale(src: Path, dst: Path, max_w: int) -> None:
    img = Image.open(src).convert("RGB")
    if img.width > max_w:
        h = round(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.Resampling.LANCZOS)
    save_png(img, dst)


def main() -> None:
    WEB.mkdir(parents=True, exist_ok=True)

    # App icon -> 96px
    icon = BRAND / "sprint-align-app-icon.png"
    if icon.is_file():
        im = Image.open(icon).convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
        (WEB / "icon-96.png").parent.mkdir(parents=True, exist_ok=True)
        im.save(WEB / "icon-96.png", format="PNG", optimize=True)
        print(f"  icon-96.png")

    for name, src in SLIDES.items():
        if src.is_file():
            copy_slide(src, WEB / name)
            print(f"  {name}")
        else:
            print(f"  SKIP {name} (missing {src.name})")

    # how-it-works infographic for adoption journey
    hiw = SHOTS / "sprint-align-screenshot-05-how-it-works.png"
    if hiw.is_file():
        copy_slide(hiw, INFO / "sprint-align-how-it-works.png")
        print("  infographics/sprint-align-how-it-works.png")

    for name, src in WIKI_FIGS.items():
        if src.is_file():
            downscale(src, WIKI / name, WIKI_MAX_W)
            print(f"  wiki/{name}")
        else:
            print(f"  SKIP wiki/{name} (missing {src.name})")

    print(f"Done -> {WEB}")


if __name__ == "__main__":
    main()
