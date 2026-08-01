#!/usr/bin/env python3
"""Regenerate the home page's hero mini-map from the frozen chart geometry.

The hero preview used to be drawn by hand and drifted from the real chart —
most visibly when the octagonal centre became a rectangle. This reads
data/poster-layout.json (the same file the live chart renders from) and
rewrites the <svg class="mini-map"> block in index.html in place, so the
preview can never disagree with the chart again.

Run after tools/build-poster-layout.py whenever the geometry changes:

    python3 tools/build-minimap.py
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYOUT = os.path.join(ROOT, "data", "poster-layout.json")
PAGE = os.path.join(ROOT, "index.html")

HUE_FILL = 'fill="oklch(0.62 0.075 {h})" fill-opacity="{fo}"'
HUE_STROKE = 'stroke="oklch(0.62 0.075 {h})" stroke-opacity="{so}" stroke-width="{sw}"'


def hue_poly(points, h, fo=".14", so=".5", sw=6):
    pts = " ".join(f"{x:g},{y:g}" for x, y in points)
    return (f'<polygon points="{pts}" ' + HUE_FILL.format(h=h, fo=fo) + " "
            + HUE_STROKE.format(h=h, so=so, sw=sw) + "/>")


def build(layout):
    meta = layout["meta"]
    w, h = meta["width"], meta["height"]
    out = [f'<svg class="mini-map" viewBox="0 0 {w} {h}" aria-hidden="true" '
           'preserveAspectRatio="xMidYMid meet">']

    # district rooms, then a hue bar under each header, then the tiles
    for d in layout["districts"]:
        out.append(hue_poly(d["poly"], d["hue"]))
    for d in layout["districts"]:
        hd = d["header"]
        out.append(f'<rect x="{hd["tx"]:g}" y="{hd["y"] + hd["h"] - 12:g}" '
                   f'width="{hd["tw"]:g}" height="12" '
                   + HUE_FILL.format(h=d["hue"], fo=".6") + "/>")
    for c in layout["chips"]:
        rx = round(c["w"] * 0.135)
        out.append(f'<rect x="{c["x"]:g}" y="{c["y"]:g}" width="{c["w"]:g}" '
                   f'height="{c["h"]:g}" rx="{rx}" '
                   + HUE_FILL.format(h=c["hue"], fo=".55") + "/>")

    # the centre: a dark plate with the yellow edge, white medallion tiles on it
    oct_pts = " ".join(f"{x:g},{y:g}" for x, y in layout["oct"]["points"])
    out.append(f'<polygon points="{oct_pts}" fill="#12130F" fill-opacity=".92" '
               'stroke="#F2B705" stroke-width="10"/>')
    for m in layout["medallion"]:
        rx = round(m["w"] * 0.08)
        out.append(f'<rect x="{m["x"]:g}" y="{m["y"]:g}" width="{m["w"]:g}" '
                   f'height="{m["h"]:g}" rx="{rx}" fill="#FFFFFF" fill-opacity=".9"/>')

    out.append("</svg>")
    return "\n      ".join(out)


def main():
    with open(LAYOUT) as f:
        layout = json.load(f)
    svg = build(layout)
    with open(PAGE) as f:
        page = f.read()
    new_page, n = re.subn(r'<svg class="mini-map".*?</svg>', svg, page,
                          count=1, flags=re.S)
    if n != 1:
        sys.exit("index.html: no <svg class=\"mini-map\"> block found")
    with open(PAGE, "w") as f:
        f.write(new_page)
    d, c, m = len(layout["districts"]), len(layout["chips"]), len(layout["medallion"])
    print(f"mini-map rebuilt: {d} districts, {c} tiles, {m} medallions, "
          f"canvas {layout['meta']['width']}x{layout['meta']['height']}")


if __name__ == "__main__":
    main()
