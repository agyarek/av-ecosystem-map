#!/usr/bin/env python3
"""
build-poster-layout.py :: freeze the wall-chart geometry into data/poster-layout.json

Why this exists
---------------
The wall chart is one SVG holding 561 company tiles. If the layout were computed in
the browser it would reflow on every filter, every font load and every data edit, and
the reader would lose the mental map they just built. So the layout is computed ONCE,
here, checked into the repo, and rendered verbatim at runtime.

The composition
---------------
One rounded rectangle with an octagon cut out of the middle. The passenger-autonomy
companies live inside the octagon. The ten remaining layers tile the frame around it
and share their borders with their neighbours, so the chart reads as a single plate
rather than as separate panels floating at angles:

    +---------------------------------------------------+
    |    top 1      |     top 2      |      top 3        |
    +--------+------+----------------+------+------------+
    | left 1 |          .-------.           |  right 1   |
    |        |         / PASSGR  \          |            |
    +--------+        | AUTONOMY  |         +------------+
    | left 2 |         \         /          |  right 2   |
    |        |          '-------'           |            |
    +--------+------+----------------+------+------------+
    |  bottom 3     |    bottom 2    |     bottom 1      |
    +---------------------------------------------------+

Left and right districts reach in to the octagon's corners, so their tile grids step
around the 45-degree bevels. Every district is axis-aligned and every district label
is horizontal: nothing on this chart has to be read sideways.

Districts run clockwise from the top left in the order a ride passes through them, and
each is sized so its tile grid holds its companies with as little slack as the geometry
allows.

Run it after any edit to data/av-companies.json:
    python3 tools/build-poster-layout.py

Everything downstream (the SVG renderer, the zoom/pan viewport, the poster export)
reads only data/poster-layout.json and never recomputes positions.
"""
import json, math, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "data", "av-companies.json")
OUT  = os.path.join(ROOT, "data", "poster-layout.json")

# ---------------------------------------------------------------- constants
M       = 160     # chip tile, px
PITCH   = 178     # lattice pitch: tile plus the air between tiles
OCT_R   = 1240    # octagon half-width (centre to a flat side)
HEADER  = 210     # district header band
PAD     = 26      # inset between a district border and its tile grid
CLEAR   = 14      # clearance between a tile and the octagon's edge
MARGIN  = 200     # canvas margin outside the plate
PLATE_R = 56      # corner radius of the plate

# The organisations that occupy the centre octagon. Membership is a test, not a
# count: the company's driver — the software doing the driving — carries members of
# the public today, or is verifiably about to. The test is about the driver, not the
# fleet, so it takes in companies that own no vehicles and leaves out companies that
# own many but buy their driving in. Add whoever meets it; nothing downstream
# depends on how many names are in this list.
MEDALLION = [
    "Waymo", "Baidu Apollo Go", "Tesla", "Zoox", "Pony.ai",
    "WeRide", "Wayve", "Nuro", "May Mobility", "Motional",
]

# AV Middleware & Tooling holds only 3 organisations. It stays a real layer in the
# taxonomy (the site still says eleven layers) but renders as part of the autonomy
# district rather than a district of its own.
MERGE = {"AV Middleware & Tooling": "AV Driver / Autonomy Software"}

# Districts in clockwise order from the top left, which is also the order a ride
# passes through them: the autonomy stack across the top, the world it drives in
# down the right, the machine and its upkeep along the bottom, who pays and who
# permits up the left, back to the rider.
BANDS = {
    "top":    ["AV Driver / Autonomy Software", "Sensing & Compute Hardware",
               "Data, Maps & Simulation"],
    "right":  ["Connectivity & Infrastructure", "Vehicle Platform & Manufacturing"],
    "bottom": ["Fleet Operations & Depot", "Capital, Insurance & Risk",
               "Governance: Regulators & Government"],   # runs right to left
    "left":   ["Governance: Standards, Safety & Advocacy",
               "Demand & Commercial Platforms"],         # runs bottom to top
}

# Hues are re-tuned from v1 for a paper-white ground: same hue wheel, lower
# chroma, so 561 tiles never turn into confetti.
HUE = {
    "AV Driver / Autonomy Software": 265, "Sensing & Compute Hardware": 200,
    "Data, Maps & Simulation": 150, "Connectivity & Infrastructure": 230,
    "Vehicle Platform & Manufacturing": 40, "Demand & Commercial Platforms": 20,
    "Fleet Operations & Depot": 320, "Capital, Insurance & Risk": 60,
    "Governance: Regulators & Government": 290,
    "Governance: Standards, Safety & Advocacy": 340,
}

# Type inside the octagon, shared with tools/render-poster.py and assets/js/poster.js
# so the two renderers cannot drift apart.
MED_STYLE = {"logo": 120, "logoY": 52, "nameY": 232, "nameSize": 34,
             "claimY": 270, "claimStep": 27, "claimSize": 20, "claimChars": 30}

SIDE = OCT_R * 2 * (math.sqrt(2) - 1)      # octagon edge length
HALF = SIDE / 2                            # half of a flat side


def slug(s):
    out, prev = [], False
    for ch in s.lower():
        if ch.isalnum(): out.append(ch); prev = False
        elif not prev:   out.append("-"); prev = True
    return "".join(out).strip("-")

def slug_of(c):
    """The slug field on the company record is the source of truth (it is
    collision-resolved there); computing is only a fallback for older data."""
    return c["slug"] if c.get("slug") else slug(c["name"])

def oct_half_width(y):
    """How far the octagon reaches from its centre line at height y. Flat between
    the bevels, then falling away at 45 degrees."""
    ay = abs(y)
    if ay >= OCT_R: return 0.0
    return OCT_R if ay <= HALF else OCT_R - (ay - HALF)

def oct_half_height(x):
    return oct_half_width(x)   # a regular octagon is its own transpose

def octagon_points(cx, cy):
    return [(cx - HALF, cy - OCT_R), (cx + HALF, cy - OCT_R),
            (cx + OCT_R, cy - HALF), (cx + OCT_R, cy + HALF),
            (cx + HALF, cy + OCT_R), (cx - HALF, cy + OCT_R),
            (cx - OCT_R, cy + HALF), (cx - OCT_R, cy - HALF)]


def grid_cells(rect, side, header_h):
    """Tile cells that fit inside a district, in reading order, skipping any that
    would touch the octagon. Coordinates are relative to an octagon at (0, 0).

    `side` says which way the octagon lies, which is the only thing that decides
    whether a cell is blocked; top and bottom districts never reach it."""
    x0, y0, x1, y1 = rect
    cells = []
    gy = y0 + header_h + PAD
    while gy + M <= y1 - PAD:
        gx = x0 + PAD
        while gx + M <= x1 - PAD:
            if not blocked(gx, gy, side):
                cells.append((round(gx, 1), round(gy, 1)))
            gx += PITCH
        gy += PITCH
    return cells

def blocked(gx, gy, side):
    """True when a tile at (gx, gy) would overlap the octagon."""
    if side not in ("left", "right"): return False
    for cy in (gy, gy + M):
        reach = oct_half_width(cy) + CLEAR
        if side == "left" and gx + M > -reach: return True
        if side == "right" and gx < reach: return True
    return False


def solve_side_band(names, counts, span, header_h):
    """Width of a left or right band, and the tile cells inside each of its two
    districts. The two share a width, so the band is as wide as the hungrier of
    them needs; heights are split in proportion to their counts."""
    total = sum(counts)
    h1 = round(span * counts[0] / total / PITCH) * PITCH
    h1 = max(PITCH * 3 + header_h, min(span - PITCH * 3 - header_h, h1))
    return h1

def fit_label(label, count, width, max_size=40, min_size=26):
    """Choose a type size and line breaks so a district's name never runs into its
    count. Archivo's bold caps average a shade under 0.6em, which is close enough
    to keep a 4600px-wide chart honest without measuring glyphs."""
    room = width - 60 - (len(str(count)) * max_size * 0.62) - 34
    for size in range(max_size, min_size - 1, -2):
        if len(label) * size * 0.585 <= room:
            return size, [label]
    # two lines, broken at the space nearest the middle
    words = label.split()
    if len(words) > 1:
        best, mid = None, len(label) / 2
        for i in range(1, len(words)):
            a, b = " ".join(words[:i]), " ".join(words[i:])
            d = abs(len(a) - mid)
            if best is None or d < best[0]: best = (d, a, b)
        lines = [best[1], best[2]]
        for size in range(max_size - 4, min_size - 1, -2):
            if max(len(l) for l in lines) * size * 0.585 <= room:
                return size, lines
        return min_size, lines
    return min_size, [label]


def main():
    companies = json.load(open(SRC, encoding="utf-8"))
    by_name = {c["name"]: c for c in companies}
    enr_path = os.path.join(ROOT, "data", "av-enrichment.json")
    known = {}
    if os.path.exists(enr_path):
        known = json.load(open(enr_path, encoding="utf-8")).get("known", {})

    missing = [n for n in MEDALLION if n not in by_name]
    if missing:
        sys.exit(f"FATAL: medallion names absent from av-companies.json: {missing}")

    # Bucket every non-medallion company into exactly one district, by primary cat.
    # Multi-layer membership is shown as pips on the chip, not as a second chip:
    # one company, one tile, always, so counting by eye stays honest.
    buckets = collections.defaultdict(list)
    for c in companies:
        if c["name"] in MEDALLION: continue
        buckets[MERGE.get(c["cat"], c["cat"])].append(c)
    for k in buckets:
        buckets[k].sort(key=lambda c: (-c.get("score", 0), c["name"].lower()))

    # ------------------------------------------------- how many tiles to draw
    # Drawing all 551 made the chart intimidating on arrival: eleven walls of
    # near-identical tiles, none of them readable until you zoomed. So each
    # district draws a slice of its companies and offers the rest on demand.
    #
    # The slice is proportional rather than a flat number on purpose. A district's
    # size on the plate is a direct function of how many tiles it holds, so a flat
    # cap would make every layer the same size and quietly delete the one thing
    # that size currently tells you: that Governance really is twice Capital. A
    # third of each keeps that shape while cutting the plate down hard.
    #
    # The floor and ceiling never bind at today's counts (the range lands 11-23);
    # they are here so the rule still behaves if a layer grows or empties out.
    SHOW_FRACTION, SHOW_MIN, SHOW_MAX = 0.30, 8, 24
    shown, overflow = {}, {}
    for k, v in buckets.items():
        n = max(SHOW_MIN, min(SHOW_MAX, round(len(v) * SHOW_FRACTION)))
        n = min(n, len(v))
        shown[k], overflow[k] = v[:n], v[n:]
        print(f"  show {n:3d} of {len(v):3d}  {k}")

    planned = [n for b in BANDS.values() for n in b]
    if sorted(planned) != sorted(buckets):
        sys.exit(f"FATAL: BANDS covers {sorted(planned)}, data has {sorted(buckets)}")

    span = 2 * OCT_R                       # height shared by the left and right bands

    # ------------------------------------------------- left and right band widths
    # Grow a band until both of its districts hold their companies. Blocked cells
    # are counted honestly, so a band that loses tiles to the bevel simply widens.
    sides = {}
    for side in ("left", "right"):
        names = BANDS[side]
        counts = [len(shown[n]) for n in names]
        h1 = solve_side_band(names, counts, span, HEADER)
        heights = [h1, span - h1]
        # left runs bottom to top, right runs top to bottom; both listed clockwise
        if side == "left": heights = heights[::-1]
        for cols in range(2, 24):
            width = cols * PITCH + 2 * PAD
            rects, ok = [], True
            y = -OCT_R
            for name, h in zip(names if side == "right" else names[::-1], heights):
                if side == "left":
                    rect = (-OCT_R - width, y, -HALF, y + h)
                else:
                    rect = (HALF, y, OCT_R + width, y + h)
                cells = grid_cells(rect, side, HEADER)
                if len(cells) < len(shown[name]): ok = False
                rects.append((name, rect, cells))
                y += h
            if ok:
                sides[side] = (width, rects)
                break
        else:
            sys.exit(f"FATAL: {side} band cannot be made wide enough")

    plate_x0 = -OCT_R - sides["left"][0]
    plate_x1 = OCT_R + sides["right"][0]
    plate_w = plate_x1 - plate_x0

    # ------------------------------------------------------ top and bottom bands
    # Both run the full width of the plate, so the only free variable is depth.
    # Take the shallowest depth that still fits all three districts side by side.
    horiz = {}
    for band in ("top", "bottom"):
        names = BANDS[band] if band == "top" else BANDS[band][::-1]
        counts = [len(shown[n]) for n in names]
        usable_cols = int((plate_w - 2 * PAD * len(names)) // PITCH)
        for rows in range(2, 20):
            need = [math.ceil(n / rows) for n in counts]
            if sum(need) <= usable_cols: break
        else:
            sys.exit(f"FATAL: {band} band cannot be made deep enough")
        depth = HEADER + rows * PITCH + 2 * PAD
        # hand the leftover columns to the districts with the least slack
        spare = usable_cols - sum(need)
        order = sorted(range(len(need)), key=lambda i: -(counts[i] % rows or rows))
        for k in range(spare):
            need[order[k % len(need)]] += 1
        widths = [c * PITCH + 2 * PAD for c in need]
        widths[-1] += plate_w - sum(widths)      # absorb rounding on the last one
        rects, x = [], plate_x0
        for name, w in zip(names, widths):
            y0 = -OCT_R - depth if band == "top" else OCT_R
            rect = (x, y0, x + w, y0 + depth)
            rects.append((name, rect, grid_cells(rect, band, HEADER)))
            x += w
        horiz[band] = (depth, rects)

    plate_y0 = -OCT_R - horiz["top"][0]
    plate_y1 = OCT_R + horiz["bottom"][0]

    # ------------------------------------------------------------ assemble
    districts, chips = [], []
    for band in ("top", "right", "bottom", "left"):
        rects = (horiz if band in ("top", "bottom") else sides)[band][1]
        for name, rect, cells in rects:
            items = shown[name]
            if len(cells) < len(items):
                sys.exit(f"FATAL: {name} has {len(items)} companies for {len(cells)} cells")
            x0, y0, x1, y1 = rect
            # The header band runs the full width of the district and is clipped to
            # its outline, so a left or right district's bevel cuts it rather than
            # leaving a notch of blank plate. The type stays inside the part of that
            # band the octagon can never reach.
            tx0, tx1 = x0, x1
            if band == "left":  tx1 = -OCT_R
            if band == "right": tx0 = OCT_R
            # The header prints the district's true size, not how many tiles are
            # drawn, so the label has to be measured against the number a reader
            # actually sees.
            total = len(buckets[name])
            size, lines = fit_label(name.replace("Governance: ", "").upper(),
                                    total, tx1 - tx0)
            districts.append({
                "id": slug(name), "layer": name, "band": band,
                "hue": HUE.get(name, 220), "count": total,
                "shown": len(items),
                # Everyone this district holds but does not draw. The chart offers
                # them through the district's expand control rather than tiling
                # them, so the roster travels with the geometry.
                "overflow": [{"name": c["name"], "slug": slug_of(c), "id": c["id"],
                              "mono": c.get("mono", c["name"][:2].upper()),
                              "exited": bool(c.get("exited")),
                              "spokenTo": bool(c.get("spokenTo"))}
                             for c in overflow[name]],
                "x": round(x0, 1), "y": round(y0, 1),
                "w": round(x1 - x0, 1), "h": round(y1 - y0, 1),
                "poly": [[round(px, 1), round(py, 1)] for px, py in district_poly(rect, band)],
                "header": {"x": round(x0, 1), "y": round(y0, 1),
                           "w": round(x1 - x0, 1), "h": HEADER,
                           "tx": round(tx0, 1), "tw": round(tx1 - tx0, 1)},
                "labelSize": size, "labelLines": lines,
                "capacity": len(cells), "slack": len(cells) - len(items),
            })
            for c, (gx, gy) in zip(items, cells):
                chips.append({
                    "name": c["name"], "slug": slug_of(c), "id": c["id"],
                    "district": slug(name),
                    "x": gx, "y": gy, "w": M, "h": M,
                    "mono": c.get("mono", c["name"][:2].upper()),
                    "hue": HUE.get(name, 220),
                    "layers": len(c.get("all", [])),
                    "pips": [HUE[al] for al in c.get("all", [])
                             if al in HUE and al != MERGE.get(c["cat"], c["cat"])][:4],
                    "exited": bool(c.get("exited")),
                    "spokenTo": bool(c.get("spokenTo")),
                })

    # ------------------------------------- passenger autonomy, inside
    # Rows of 3, 4 and 3: the widest row sits on the octagon's waist, where the
    # full width is available, and the outer rows step in with the bevels.
    ROWS = [(3, 626, -800), (4, 582, -196), (3, 626, 408)]
    CELL_H = 392
    medallion, k = [], 0
    for n, cw, ry in ROWS:
        for i in range(n):
            nm = MEDALLION[k]; k += 1
            c = by_name[nm]
            medallion.append({
                "name": nm, "slug": slug_of(c), "id": c["id"],
                "x": round((i - (n - 1) / 2) * cw - cw / 2, 1), "y": ry,
                "w": cw, "h": CELL_H,
                "cat": c["cat"], "hue": HUE.get(c["cat"], 220),
                "mono": c.get("mono", nm[:2].upper()),
                "claim": known.get(nm, ""),
            })

    octagon = {
        "cx": 0, "cy": 0, "r": OCT_R, "side": round(SIDE, 1),
        "points": [[round(x, 1), round(y, 1)] for x, y in octagon_points(0, 0)],
        "titleY": -970, "subY": -908, "ruleY": 890, "footY": 942,
        "title": "PASSENGER AUTONOMY",
        "sub": "AUTONOMOUS DRIVERS A PASSENGER CAN ACTUALLY MEET",
        "foot": f"{len(MEDALLION)} OF {len(companies)} ORGANISATIONS ON THIS CHART",
    }

    # --------------------------------------------------------------- canvas
    ox, oy = MARGIN - plate_x0, MARGIN - plate_y0
    W = round(plate_w + 2 * MARGIN)
    H = round(plate_y1 - plate_y0 + 2 * MARGIN)

    def shift_xy(o):
        o["x"] = round(o["x"] + ox, 1); o["y"] = round(o["y"] + oy, 1)

    for d in districts:
        shift_xy(d); shift_xy(d["header"])
        d["header"]["tx"] = round(d["header"]["tx"] + ox, 1)
        d["poly"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in d["poly"]]
    for c in chips: shift_xy(c)
    for c in medallion: shift_xy(c)
    octagon["cx"], octagon["cy"] = round(ox, 1), round(oy, 1)
    octagon["points"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in octagon["points"]]
    for key in ("titleY", "subY", "ruleY", "footY"):
        octagon[key] = round(octagon[key] + oy, 1)

    layout = {
        "meta": {
            "generatedBy": "tools/build-poster-layout.py",
            "module": M, "pitch": PITCH, "margin": MARGIN, "headerH": HEADER,
            "octR": OCT_R, "companyCount": len(companies),
            "medallionCount": len(MEDALLION), "medStyle": MED_STYLE,
            "width": W, "height": H,
            "plate": {"x": MARGIN, "y": MARGIN, "w": round(plate_w, 1),
                      "h": round(plate_y1 - plate_y0, 1), "rx": PLATE_R},
            # the octagon's bounding box, kept under its old name so the social-card
            # renderer can keep cropping to "the centre" without knowing the shape
            "medallionBox": {"x": round(ox - OCT_R, 1), "y": round(oy - OCT_R, 1),
                             "w": 2 * OCT_R, "h": 2 * OCT_R},
        },
        "oct": octagon, "districts": districts, "chips": chips, "medallion": medallion,
    }

    # Not every company gets a tile any more, but every company must still be
    # reachable: drawn in a district, sitting in the octagon, or listed in some
    # district's overflow. Losing one silently is the failure this guards against.
    drawn = len(chips) + len(medallion)
    held = drawn + sum(len(d["overflow"]) for d in districts)
    if held != len(companies):
        sys.exit(f"FATAL: {held} companies accounted for, data has {len(companies)}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(layout, open(OUT, "w", encoding="utf-8"), indent=1)
    print(f"canvas   {W} x {H}  (aspect {W/H:.2f})")
    print(f"plate    {plate_w:.0f} x {plate_y1 - plate_y0:.0f}")
    print(f"drawn    {drawn} of {len(companies)} companies "
          f"({len(medallion)} in the octagon + {len(chips)} in districts); "
          f"{held - drawn} more reachable through expand")
    for d in districts:
        print(f"  {d['band']:<6} {d['shown']:>3} of {d['count']:>3} in {d['capacity']:>3} cells "
              f"(slack {d['slack']:>2})  {d['layer']}")
    print(f"wrote    {os.path.relpath(OUT, ROOT)}")


def district_poly(rect, band):
    """A district's true outline, clockwise. Top and bottom districts are plain
    rectangles; left and right districts step around the octagon's bevel."""
    x0, y0, x1, y1 = rect
    if band in ("top", "bottom"):
        return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    inner = _inner_edge(y0, y1, -1 if band == "left" else 1)
    if band == "left":
        return [(x0, y0)] + inner + [(x0, y1)]
    return [(x1, y0)] + [(x1, y1)] + inner[::-1]

def _inner_edge(y0, y1, sign):
    """Points down the octagon-facing edge of a side district, top to bottom.
    sign is +1 for a district right of the octagon, -1 for one on its left. The
    breaks at the bevels are what make the tile grid step in and out."""
    out = []
    for y in (y0, -HALF, HALF, y1):
        if y0 <= y <= y1:
            out.append((round(sign * oct_half_width(y), 1), round(y, 1)))
    clean = []
    for p in out:
        if not clean or abs(p[0] - clean[-1][0]) > .5 or abs(p[1] - clean[-1][1]) > .5:
            clean.append(p)
    return clean


if __name__ == "__main__":
    main()
