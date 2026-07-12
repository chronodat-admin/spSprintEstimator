#!/usr/bin/env python3
"""Build AppSource marketing sheets (1536×1024) — spAssetManagement / People Hub layout.

Mirrors C:\\spAssetManagement\\scripts\\build-marketing-images.py:
  • Light gray-teal background with soft blue blobs
  • Large real screenshot mockups on the right (back + front windows)
  • White left-panel backing so copy stays readable
  • Real app icon + product name in the left header (never AI-drawn)
  • Original Chronodat wordmark top-right (composited after downscale)

Run:
  python store-assets/scripts/build-appsource-marketing.py
  python store-assets/scripts/generate-appsource-crops.py
"""
from __future__ import annotations

import sys
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.brand_compositor import (  # noqa: E402
    APP_NAME,
    APP_SUBTITLE,
    paste_chronodat_header,
)

BRAND = ROOT / "brand"
SCREENSHOTS = ROOT / "generated" / "screenshots" / "full-page"
ICON = BRAND / "sprint-align-app-icon.png"
OUT = ROOT / "generated" / "marketing" / "appsource"

CANVAS_W = 1536
CANVAS_H = 1024
SUPERSAMPLE = 2

FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf"

# Sampled from Asset Management Hub hero-banner (People Hub style)
TITLE_COLOR = (15, 23, 42)
SUBTITLE_COLOR = (100, 116, 139)
FEATURE_HEADING = (37, 99, 235)
FEATURE_BODY = (100, 116, 139)
ICON_BLUE = (37, 99, 235)
WHITE = (255, 255, 255)

LEFT_X = 80
ICON_SIZE = 56
TITLE_X = 152

BACK_WINDOW = (620, 80, 1510, 640)
FRONT_WINDOW = (920, 430, 1520, 970)

# Pixel crops on 1440×1000 full-page captures (x0, y0, x1, y1).
SCREENSHOT_CROPS: dict[str, tuple[int, int, int, int]] = {
    "light-01-home.png": (0, 100, 1440, 980),
    "light-02-session-voting.png": (0, 100, 1440, 980),
    "light-03-session-results.png": (0, 80, 1440, 920),
    "light-06-settings-branding.png": (0, 130, 1440, 980),
    "light-04-settings-setup.png": (0, 130, 1440, 980),
}

SCREENSHOT_ANCHOR_X: dict[str, str] = {
    "light-01-home.png": "left",
    "light-02-session-voting.png": "left",
    "light-03-session-results.png": "left",
    "light-06-settings-branding.png": "left",
    "light-04-settings-setup.png": "left",
}


def s(value: int) -> int:
    return value * SUPERSAMPLE


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, s(size))


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def detect_trial_banner_bottom(img: Image.Image) -> int:
    """Return y-coordinate to start crop (below trial/demo banner rows)."""
    arr = np.array(img.convert("RGB"))
    height = arr.shape[0]

    def is_banner_row(y: int) -> bool:
        row = arr[y].astype(np.int16)
        light = (row[:, 0] > 225) & (row[:, 1] > 225) & (row[:, 2] > 225)
        flat = (np.abs(row[:, 0] - row[:, 1]) < 16) & (np.abs(row[:, 1] - row[:, 2]) < 16)
        return bool(np.mean(light & flat) > 0.65)

    end: int | None = None
    for y in range(60, min(280, height - 80)):
        if is_banner_row(y):
            end = y
        elif end is not None and y - end > 12:
            break

    if end is not None:
        return min(end + 72, height - 120)
    return 100


def prepare_screenshot(path: Path, *, crop_top: int | None = None, crop_box: tuple[int, int, int, int] | None = None) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    if crop_box is None and path.name in SCREENSHOT_CROPS:
        crop_box = SCREENSHOT_CROPS[path.name]
    if crop_box:
        img = img.crop(crop_box)
    else:
        if crop_top is None:
            crop_top = detect_trial_banner_bottom(img)
        w, h = img.size
        top = min(max(crop_top, 0), h - 200)
        img = img.crop((0, top, w, h))
    return img


def fit_cover(
    img: Image.Image,
    target_w: int,
    target_h: int,
    *,
    anchor_x: str = "center",
) -> Image.Image:
    scale = max(target_w / img.width, target_h / img.height)
    new_w = max(1, int(img.width * scale))
    new_h = max(1, int(img.height * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    if anchor_x == "left":
        left = 0
    elif anchor_x == "right":
        left = max(0, new_w - target_w)
    else:
        left = max(0, (new_w - target_w) // 2)
    return resized.crop((left, 0, left + target_w, target_h))


def add_drop_shadow(base: Image.Image, overlay: Image.Image, xy: tuple[int, int], *, radius: int = 12) -> None:
    shadow = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (0, 0, overlay.size[0] - 1, overlay.size[1] - 1),
        radius=radius,
        fill=(15, 23, 42, 55),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(s(14)))
    base.alpha_composite(shadow, (xy[0] + s(5), xy[1] + s(8)))
    base.alpha_composite(overlay, xy)


def place_screenshot(
    canvas: Image.Image,
    path: Path,
    box: tuple[int, int, int, int],
    *,
    radius: int = 12,
    crop_top: int | None = None,
    crop_box: tuple[int, int, int, int] | None = None,
    anchor_x: str | None = None,
) -> None:
    img = prepare_screenshot(path, crop_top=crop_top, crop_box=crop_box)
    x0, y0, x1, y1 = (s(v) for v in box)
    target_w = x1 - x0
    target_h = y1 - y0
    ax = anchor_x or SCREENSHOT_ANCHOR_X.get(path.name, "center")
    fitted = fit_cover(img, target_w, target_h, anchor_x=ax)
    frame = Image.new("RGBA", (target_w, target_h), (255, 255, 255, 255))
    frame.paste(fitted, (0, 0), fitted if fitted.mode == "RGBA" else None)
    chrome = ImageDraw.Draw(frame)
    chrome.rounded_rectangle(
        (0, 0, target_w - 1, target_h - 1),
        radius=s(radius),
        outline=(226, 232, 240, 255),
        width=s(1),
    )
    mask = rounded_mask((target_w, target_h), s(radius))
    framed = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    framed.paste(frame, (0, 0), mask)
    add_drop_shadow(canvas, framed, (x0, y0), radius=radius)


def draw_background() -> Image.Image:
    canvas = Image.new("RGBA", (s(CANVAS_W), s(CANVAS_H)), WHITE + (255,))
    blobs = [
        ((s(1380), s(-80)), s(460), (224, 242, 254, 200)),
        ((s(1480), s(920)), s(380), (191, 219, 254, 160)),
        ((s(620), s(980)), s(320), (219, 234, 254, 120)),
        ((s(-40), s(380)), s(240), (186, 230, 253, 90)),
    ]
    for center, radius, color in blobs:
        blob = Image.new("RGBA", (s(CANVAS_W), s(CANVAS_H)), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(blob)
        bdraw.ellipse(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            fill=color,
        )
        blob = blob.filter(ImageFilter.GaussianBlur(s(36)))
        canvas = Image.alpha_composite(canvas, blob)
    return canvas


def wrap_text(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width) or [text]


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    *,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    width_chars: int,
    line_gap: int = 6,
) -> int:
    x, y = xy
    for line in wrap_text(text, width_chars):
        draw.text((x, y), line, fill=fill, font=font)
        y += font.size + s(line_gap)
    return y


def draw_feature_icon(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: str) -> None:
    r = s(22)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ICON_BLUE + (255,))
    if kind == "poker":
        draw.rectangle((cx - s(10), cy - s(10), cx - s(2), cy + s(2)), fill=WHITE)
        draw.rectangle((cx + s(2), cy - s(10), cx + s(10), cy + s(2)), fill=WHITE)
    elif kind == "reveal":
        draw.line([(cx - s(6), cy), (cx + s(6), cy)], fill=WHITE, width=s(2))
        draw.ellipse((cx - s(3), cy - s(3), cx + s(3), cy + s(3)), fill=WHITE)
    elif kind == "shield":
        draw.polygon(
            [
                (cx, cy - s(10)),
                (cx + s(10), cy - s(4)),
                (cx + s(10), cy + s(6)),
                (cx, cy + s(12)),
                (cx - s(10), cy + s(6)),
                (cx - s(10), cy - s(4)),
            ],
            fill=WHITE,
        )
    elif kind == "settings":
        draw.ellipse((cx - s(8), cy - s(8), cx + s(8), cy + s(8)), outline=WHITE, width=s(2))
    elif kind == "register":
        draw.rounded_rectangle(
            (cx - s(9), cy - s(8), cx + s(9), cy + s(10)),
            radius=s(2),
            outline=WHITE,
            width=s(2),
        )


def draw_left_panel_backing(canvas: Image.Image) -> None:
    backing = Image.new("RGBA", (s(CANVAS_W), s(CANVAS_H)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(backing)
    solid_edge = s(580)
    fade_edge = s(700)
    draw.rectangle((0, 0, solid_edge, s(CANVAS_H)), fill=(255, 255, 255, 252))
    for x in range(solid_edge, fade_edge):
        t = (x - solid_edge) / max(fade_edge - solid_edge, 1)
        alpha = int(252 * (1 - t))
        draw.line([(x, 0), (x, s(CANVAS_H))], fill=(255, 255, 255, alpha))
    canvas.alpha_composite(backing)


def draw_left_panel(
    canvas: Image.Image,
    *,
    subtitle: str,
    features: list[tuple[str, str, str]],
) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(FONT_BOLD, 38)
    subtitle_font = load_font(FONT_REG, 24)
    feat_title_font = load_font(FONT_SEMI, 24)
    feat_body_font = load_font(FONT_REG, 18)

    if ICON.is_file():
        icon = Image.open(ICON).convert("RGBA").resize((s(ICON_SIZE), s(ICON_SIZE)), Image.Resampling.LANCZOS)
        canvas.alpha_composite(icon, (s(LEFT_X), s(92)))

    draw.text((s(TITLE_X), s(94)), APP_NAME, fill=TITLE_COLOR, font=title_font)
    draw.text((s(TITLE_X), s(148)), APP_SUBTITLE, fill=SUBTITLE_COLOR, font=load_font(FONT_REG, 16))
    draw_wrapped_text(
        draw,
        (s(LEFT_X), s(206)),
        subtitle,
        font=subtitle_font,
        fill=SUBTITLE_COLOR,
        width_chars=34,
        line_gap=4,
    )

    y = s(318)
    icon_x = s(LEFT_X + 18)
    text_x = s(LEFT_X + 64)
    for icon_kind, feat_title, feat_body in features:
        draw_feature_icon(draw, icon_x, y + s(22), icon_kind)
        draw.text((text_x, y), feat_title, fill=FEATURE_HEADING, font=feat_title_font)
        draw_wrapped_text(
            draw,
            (text_x, y + s(34)),
            feat_body,
            font=feat_body_font,
            fill=FEATURE_BODY,
            width_chars=38,
            line_gap=3,
        )
        y += s(108)


def finalize(canvas: Image.Image) -> Image.Image:
    down = canvas.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS).convert("RGB")
    paste_chronodat_header(down, light_logo=False)
    return down


def build_home() -> Image.Image:
    canvas = draw_background()
    place_screenshot(canvas, SCREENSHOTS / "light-01-home.png", BACK_WINDOW)
    place_screenshot(canvas, SCREENSHOTS / "light-02-session-voting.png", FRONT_WINDOW)
    draw_left_panel_backing(canvas)
    draw_left_panel(
        canvas,
        subtitle="Align on estimates faster from a branded SharePoint home screen.",
        features=[
            ("poker", "Join by code.", "Participants enter a six-character code or open a shared link."),
            ("reveal", "Create a room.", "Facilitators launch planning poker, dot voting, or surveys."),
            ("shield", "SharePoint-native.", "Sessions and votes stay in lists on your site."),
        ],
    )
    return finalize(canvas)


def build_sessions() -> Image.Image:
    canvas = draw_background()
    place_screenshot(canvas, SCREENSHOTS / "light-02-session-voting.png", BACK_WINDOW)
    place_screenshot(canvas, SCREENSHOTS / "light-03-session-results.png", FRONT_WINDOW)
    draw_left_panel_backing(canvas)
    draw_left_panel(
        canvas,
        subtitle="Run live facilitator-led rounds with hidden votes and instant reveal.",
        features=[
            ("poker", "Live voting.", "Fibonacci decks, confidence scales, dot budgets, and more."),
            ("reveal", "Reveal together.", "Open rounds, reveal votes, re-vote, and advance items."),
            ("shield", "Track participation.", "See who has voted before you reveal the round."),
        ],
    )
    return finalize(canvas)


def build_settings() -> Image.Image:
    canvas = draw_background()
    place_screenshot(canvas, SCREENSHOTS / "light-06-settings-branding.png", BACK_WINDOW)
    place_screenshot(canvas, SCREENSHOTS / "light-04-settings-setup.png", FRONT_WINDOW)
    draw_left_panel_backing(canvas)
    draw_left_panel(
        canvas,
        subtitle="Site owners provision lists, branding, layout, and session governance.",
        features=[
            ("settings", "One settings hub.", "Setup, governance, branding, home page, layout, and more."),
            ("shield", "Your tenant.", "Provision SharePoint lists once; data never leaves your site."),
            ("register", "Custom branding.", "Brand colors, hero text, and immersive full-page layout."),
        ],
    )
    return finalize(canvas)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = {
        "sprint-align-appsource-home-ai.png": build_home(),
        "sprint-align-appsource-sessions-ai.png": build_sessions(),
        "sprint-align-appsource-settings-ai.png": build_settings(),
    }
    for name, image in sheets.items():
        path = OUT / name
        image.save(path, "PNG", optimize=True)
        kb = path.stat().st_size / 1024
        print(f"Created {path.relative_to(ROOT)} ({CANVAS_W}x{CANVAS_H}, {kb:.0f} KB)")


if __name__ == "__main__":
    main()
