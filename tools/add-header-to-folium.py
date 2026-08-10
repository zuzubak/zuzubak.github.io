#!/usr/bin/env python3
"""Re-add the shared site header to a Folium-generated map page.

Folium overwrites the whole HTML file on every export, so the header wiring is
lost each time the notebook regenerates street-distance-per-household/index.html.
Run this against the regenerated file to put it back:

    python3 tools/add-header-to-folium.py street-distance-per-household/index.html

Idempotent -- running it twice is a no-op.

Two pieces get injected:
  1. <script src="/header.js"> -- the shared header, same file every page loads.
  2. A small style block. Folium's map is a full-viewport absolutely-positioned
     container, so without this the header would overlap it. Body becomes a
     column flex container and the map claims whatever height is left.
"""
import sys
from pathlib import Path

TAG = '<script src="/header.js"></script>'

LAYOUT_CSS = """
<style>
  /* Folium renders a full-viewport map; make room for the shared header. */
  html, body { height: 100%; margin: 0; }
  body { display: flex; flex-direction: column; }
  /* Folium sets height on an ID selector, so !important is what actually wins. */
  .folium-map { flex: 1 1 auto; height: auto !important; min-height: 0; }
</style>
"""


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(f"usage: {sys.argv[0]} <folium-page.html>")
    path = Path(sys.argv[1])
    html = path.read_text(encoding="utf-8")

    if TAG in html:
        print(f"{path}: already wired, nothing to do")
        return
    if "<body>" not in html:
        raise SystemExit(f"{path}: no <body> tag found -- is this a Folium export?")

    path.write_text(html.replace("<body>", "<body>\n" + TAG + LAYOUT_CSS, 1), encoding="utf-8")
    print(f"{path}: header wired")


if __name__ == "__main__":
    main()
