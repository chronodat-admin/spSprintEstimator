#!/usr/bin/env python3
"""Composite official Sprint Align icon + original Chronodat logo onto AI marketing PNGs.

AI images must leave header top-left and footer bottom-right clear; this script
wipes those zones and stamps the real brand assets at fixed geometry so every
image is pixel-identical for logos.

Usage:
  python store-assets/scripts/embed-marketing-brand.py
  python store-assets/scripts/embed-marketing-brand.py path/to/image.png
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.brand_compositor import (  # noqa: E402
    fix_ai_marketing_branding,
    stamp_chronodat_logo_only,
)

DEFAULT_TARGETS = [
    ROOT / "generated" / "marketing" / "appsource",
    ROOT / "generated" / "marketing",
    Path.home() / ".cursor" / "projects" / "c-spSprintEstimator" / "assets",
]

GLOBS = (
    "sprint-align-appsource-*.png",
    "sprint-align-infographic-*.png",
)


def discover_targets() -> list[Path]:
    found: list[Path] = []
    for base in DEFAULT_TARGETS:
        if not base.is_dir():
            continue
        for pattern in GLOBS:
            found.extend(sorted(base.glob(pattern)))
    # De-dupe
    seen: set[Path] = set()
    unique: list[Path] = []
    for p in found:
        key = p.resolve()
        if key not in seen and p.is_file():
            seen.add(key)
            unique.append(p)
    return unique


def main() -> None:
    args = [a for a in sys.argv[1:]]
    # --full re-stamps BOTH the app icon (top-left) and Chronodat logo (bottom-right),
    # wiping AI-drawn branding first. Default keeps the AI artwork and only stamps the
    # real Chronodat wordmark into the reserved bottom-right corner.
    full = "--full" in args
    args = [a for a in args if a != "--full"]

    if args:
        paths = [Path(a) for a in args]
    else:
        paths = discover_targets()

    if not paths:
        print("No marketing PNGs found.")
        return

    mode = "app icon + Chronodat wordmark" if full else "Chronodat wordmark (logo-only)"
    print(f"Embedding official {mode} on {len(paths)} image(s):")
    for path in paths:
        if full:
            fix_ai_marketing_branding(path)
        else:
            stamp_chronodat_logo_only(path)
        print(f"  {path}")
    print("Done.")


if __name__ == "__main__":
    main()
