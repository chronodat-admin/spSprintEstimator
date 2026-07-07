"""Extract embedded raster from Chronodat SVG logo to PNG."""
from __future__ import annotations

import base64
import re
from pathlib import Path

SVG = Path(__file__).with_name('chronodat-logo.svg')
OUT = Path(__file__).with_name('chronodat-logo.png')

def main() -> None:
    text = SVG.read_text(encoding='utf-8', errors='ignore')
    match = re.search(r'xlink:href="data:image/(png|jpeg);base64,([^"]+)"', text)
    if not match:
        raise SystemExit('No embedded image in SVG')
    data = base64.b64decode(match.group(2))
    OUT.write_bytes(data)
    print(f'Wrote {OUT} ({len(data)} bytes)')

if __name__ == '__main__':
    main()
