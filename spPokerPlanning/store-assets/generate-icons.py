"""Generate Sprint Align marketplace and SPFx icon assets from the AI master icon."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "sprint-align-master-icon.png"
OUT = ROOT / "generated"
TEAMS = ROOT.parent / "teams"
WEBPART_ASSETS = ROOT.parent / "src" / "webparts" / "estimatr" / "assets"

# Chronodat brand palette (chronodat.com/css/colors/yellow.css + site navy)
BRAND_GOLD = (241, 221, 0)
BRAND_GOLD_DARK = (212, 194, 0)
BRAND_NAVY = (15, 23, 42)
BRAND_NAVY_MID = (26, 39, 68)
BRAND_SLATE = (71, 85, 105)
BRAND_MUTED = (148, 163, 184)
WHITE = (255, 255, 255)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = (
        ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    )
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def load_master() -> Image.Image:
    if not MASTER.exists():
        raise FileNotFoundError(
            f"Missing AI master icon at {MASTER}. "
            "Place sprint-align-master-icon.png in store-assets/ before running."
        )
    return Image.open(MASTER).convert("RGBA")


def resize_icon(source: Image.Image, size: int) -> Image.Image:
    """Resize the square master with high-quality resampling."""
    return source.resize((size, size), Image.LANCZOS)


def render_outline_icon(size: int = 32) -> Image.Image:
    """Monochrome white planning-poker mark for Teams outline slot."""
    ss = 8
    big = size * ss
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    w = int(big * 0.46)
    h = int(w * 1.42)
    x = (big - w) // 2
    y = (big - h) // 2 - int(big * 0.05)
    r = max(2, int(w * 0.16))
    lw = max(2, int(big * 0.055))
    d.rounded_rectangle((x, y, x + w, y + h), radius=r, outline=white, width=lw)
    bar_h = max(2, int(h * 0.11))
    d.rounded_rectangle(
        (x + int(w * 0.16), y + int(h * 0.13), x + w - int(w * 0.16), y + int(h * 0.13) + bar_h),
        radius=bar_h // 2,
        outline=white,
        width=max(1, lw // 2),
    )
    d.line(
        [(x + w * 0.24, y + h * 0.52), (x + w * 0.44, y + h * 0.70), (x + w * 0.80, y + h * 0.32)],
        fill=white,
        width=lw,
        joint="curve",
    )
    return img.resize((size, size), Image.LANCZOS)


def render_full_page_icon(master: Image.Image) -> Image.Image:
    """193×158 banner for SharePoint full-page app picker."""
    w, h = 193, 158
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(WHITE[0] * (1 - t * 0.04) + BRAND_NAVY[0] * t * 0.04)
        g = int(WHITE[0] * (1 - t * 0.04) + BRAND_NAVY[1] * t * 0.04)
        b = int(255 * (1 - t * 0.02) + BRAND_NAVY[2] * t * 0.06)
        draw.line((0, y, w, y), fill=(r, g, b, 255))

    badge = resize_icon(master, 96)
    img.paste(badge, (16, 16), badge)

    title_font = _font(17, bold=True)
    sub_font = _font(10)
    draw.text((118, 24), "Sprint Align", fill=BRAND_NAVY + (255,), font=title_font)
    draw.text((118, 48), "Planning poker &", fill=BRAND_SLATE + (255,), font=sub_font)
    draw.text((118, 60), "agile voting", fill=BRAND_SLATE + (255,), font=sub_font)

    hero = Image.new("RGBA", (w - 32, 40), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hero)
    hdraw.rounded_rectangle((0, 0, w - 33, 39), radius=10, fill=(255, 255, 255, 235))
    img.paste(hero, (16, 96), hero)
    draw.rounded_rectangle((16, 96, w - 16, 136), radius=10, outline=(226, 232, 240, 255), width=1)
    draw.text((28, 108), "Join · Vote · Reveal estimates", fill=BRAND_MUTED + (255,), font=sub_font)
    return img


def render_screenshot(master: Image.Image, title: str, subtitle: str, badge: str, index: int) -> Image.Image:
    """1366×768 Partner Center screenshot placeholder with Chronodat styling."""
    w, h = 1366, 768
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        t = y / h
        r = int(248 + (238 - 248) * t)
        g = int(250 + (244 - 250) * t)
        b = int(252 + (255 - 252) * t)
        draw.line((0, y, w, y), fill=(r, g, b, 255))

    draw.rectangle((0, 0, w, 72), fill=(255, 255, 255, 255))
    draw.line((0, 72, w, 72), fill=(226, 232, 240, 255), width=1)

    logo = resize_icon(master, 48)
    img.paste(logo, (32, 12), logo)

    title_font = _font(28)
    h1 = _font(44, bold=True)
    h2 = _font(22)
    body = _font(18)
    badge_font = _font(14, bold=True)

    draw.text((92, 22), "Sprint Align", fill=BRAND_NAVY + (255,), font=title_font)

    panel = Image.new("RGBA", (w - 96, h - 160), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(panel)
    pdraw.rounded_rectangle((0, 0, w - 97, h - 161), radius=24, fill=(255, 255, 255, 255))
    img.paste(panel, (48, 112), panel)
    draw.rounded_rectangle((48, 112, w - 48, h - 48), radius=24, outline=(226, 232, 240, 255), width=2)

    accent = resize_icon(master, 120)
    img.paste(accent, (96, 168), accent)

    draw.text((250, 180), badge.upper(), fill=BRAND_GOLD_DARK + (255,), font=badge_font)
    draw.text((250, 210), title, fill=BRAND_NAVY + (255,), font=h1)
    draw.text((250, 272), subtitle, fill=BRAND_SLATE + (255,), font=h2)

    cards_y = 360
    for i, label in enumerate(["5", "8", "13", "21"]):
        x = 250 + i * 92
        draw.rounded_rectangle((x, cards_y, x + 72, cards_y + 96), radius=12, fill=(255, 252, 230, 255))
        draw.rounded_rectangle((x, cards_y, x + 72, cards_y + 96), radius=12, outline=BRAND_GOLD + (255,), width=2)
        draw.text((x + 22, cards_y + 28), label, fill=BRAND_NAVY + (255,), font=h1)

    draw.text(
        (250, 500),
        f"Screenshot {index} · Replace with a live tenant capture before submission.",
        fill=BRAND_MUTED + (255,),
        font=body,
    )

    hero = Image.new("RGBA", (420, 220), (0, 0, 0, 0))
    hg = ImageDraw.Draw(hero)
    for y in range(220):
        t = y / 219
        c = (
            int(BRAND_NAVY[0] + (BRAND_GOLD[0] - BRAND_NAVY[0]) * t * 0.35),
            int(BRAND_NAVY[1] + (BRAND_GOLD[1] - BRAND_NAVY[1]) * t * 0.35),
            int(BRAND_NAVY[2] + (BRAND_GOLD[2] - BRAND_NAVY[2]) * t * 0.35),
            255,
        )
        hg.line((0, y, 420, y), fill=c)
    mask = Image.new("L", (420, 220), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 419, 219), radius=20, fill=255)
    hero.putalpha(mask)
    img.paste(hero, (820, 200), hero)
    draw.text((850, 240), "SharePoint-native", fill=WHITE + (255,), font=h2)
    draw.text((850, 278), "Data stays in your site", fill=(255, 255, 255, 220), font=body)
    draw.text((850, 310), "Chronodat · Sprint Align", fill=BRAND_GOLD + (255,), font=body)

    return img


def save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)
    print(f"Wrote {path}")


def main() -> None:
    master = load_master()
    OUT.mkdir(exist_ok=True)
    WEBPART_ASSETS.mkdir(parents=True, exist_ok=True)
    TEAMS.mkdir(exist_ok=True)

    component_id = "28aa74f7-6fa5-46b3-8eeb-52e0619be118"
    sharepoint_assets = ROOT.parent / "sharepoint" / "assets"

    sizes = {
        OUT / "store-logo-300.png": 300,
        OUT / "store-logo-216.png": 216,
        OUT / "store-logo-192.png": 192,
        OUT / "appicon-96.png": 96,
        sharepoint_assets / "appicon.png": 96,
        OUT / "webpart-icon-64.png": 64,
        WEBPART_ASSETS / "icon-64.png": 64,
        TEAMS / f"{component_id}_color.png": 192,
    }

    for path, size in sizes.items():
        save_png(path, resize_icon(master, size))

    save_png(WEBPART_ASSETS / "full-page-icon.png", render_full_page_icon(master))
    save_png(OUT / "full-page-icon-193x158.png", render_full_page_icon(master))
    save_png(TEAMS / f"{component_id}_outline.png", render_outline_icon(32))


if __name__ == "__main__":
    main()
