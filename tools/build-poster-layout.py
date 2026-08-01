#!/usr/bin/env python3
"""
build-poster-layout.py :: freeze the wall-chart geometry into data/poster-layout.json

Why this exists
---------------
The wall chart is one SVG holding every company tile. If the layout were computed in
the browser it would reflow on every filter, every font load and every data edit, and
the reader would lose the mental map they just built. So the layout is computed ONCE,
here, checked into the repo, and rendered verbatim at runtime.

The composition
---------------
One wide rounded rectangle with a rectangular centre holding passenger autonomy as a
tile grid. Four districts run across the top, four across the bottom, and one tall
district flanks the centre on each side, so the plate reads about twice as wide as it
is tall — a wall chart, not a plaque:

    +------------+-----------+-----------+--------------+
    |   top 1    |   top 2   |   top 3   |    top 4     |
    +-----+------+-----------+-----------+------+-------+
    |     |        PASSENGER AUTONOMY           |       |
    | left|   [t] [t] [t] [t]                   | right |
    |  1  |   [t] [t] [t] [t]                   |   1   |
    |     |   [t] [t] [t] [t]                   |       |
    +-----+------+-----------+-----------+------+-------+
    |  bottom 4  |  bottom 3 |  bottom 2 |   bottom 1   |
    +------------+-----------+-----------+--------------+

Every district is axis-aligned, every label is horizontal and set at ONE size across
the chart, and every district ends in a full-width bar that opens the rest of its
roster — the tiles on the wall are a sample, the bar is the door.

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
M       = 240     # chip tile, px — sized so a 180px logo fits with air around it
PITCH   = 264     # lattice pitch: tile plus the air between tiles
HEADER  = 280     # district header band
PAD     = 32      # inset between a district border and its tile grid
BAR_H   = 120     # the show-all bar reserved across the bottom of each district
MARGIN  = 200     # canvas margin outside the plate
PLATE_R = 56      # corner radius of the plate
LABEL_SIZE = 44   # ONE title size for every district, wrapping instead of shrinking

# The centre rectangle: heading, a line of description, then a 4 x 3 grid of
# operator tiles. Half-dimensions, because the maths runs centre-out.
CEN_HW  = 1820    # half-width
CEN_HH  = 760     # half-height

# The organisations that occupy the centre. Membership is a test, not a count:
# the company's driver — the software doing the driving — carries members of the
# public today, or is verifiably about to. The test is about the driver, not the
# fleet, so it takes in companies that own no vehicles and leaves out companies
# that own many but buy their driving in. Avride and SWM joined when the test
# said they should: both drive the public today, in Dallas and in Seoul.
MEDALLION = [
    "Waymo", "Baidu Apollo Go", "Tesla", "Zoox",
    "Pony.ai", "WeRide", "Wayve", "Nuro",
    "May Mobility", "Motional", "Avride", "SWM",
]

# AV Middleware & Tooling holds only 3 organisations. It stays a real layer in the
# taxonomy (the site still says eleven layers) but renders as part of the autonomy
# district rather than a district of its own.
MERGE = {"AV Middleware & Tooling": "AV Driver / Autonomy Software"}

# Districts clockwise from the top left, still roughly the order a ride passes
# through them: the autonomy stack and its inputs across the top, the machine on
# the right, upkeep / money / permission across the bottom, demand on the left.
BANDS = {
    "top":    ["AV Driver / Autonomy Software", "Sensing & Compute Hardware",
               "Data, Maps & Simulation", "Connectivity & Infrastructure"],
    "right":  ["Vehicle Platform & Manufacturing"],
    "bottom": ["Fleet Operations & Depot", "Capital, Insurance & Risk",
               "Governance: Regulators & Government",
               "Governance: Standards, Safety & Advocacy"],  # runs right to left
    "left":   ["Demand & Commercial Platforms"],
}

# Hues re-tuned for a paper-white ground: same hue wheel, lower chroma.
HUE = {
    "AV Driver / Autonomy Software": 265, "Sensing & Compute Hardware": 200,
    "Data, Maps & Simulation": 150, "Connectivity & Infrastructure": 230,
    "Vehicle Platform & Manufacturing": 40, "Demand & Commercial Platforms": 20,
    "Fleet Operations & Depot": 320, "Capital, Insurance & Risk": 60,
    "Governance: Regulators & Government": 290,
    "Governance: Standards, Safety & Advocacy": 340,
}

# Type inside the centre, shared with tools/render-poster.py and assets/js/poster.js
# so the two renderers cannot drift apart. The logo doubled and the name moved a
# touch further from it, both at Kofi's direction.
MED_STYLE = {"logo": 240, "logoY": 40, "nameY": 336, "nameSize": 40,
             "claimY": 384, "claimStep": 30, "claimSize": 22, "claimChars": 40}

# centre tile grid: 6 columns x 2 rows — wide, like the plate itself
MED_COLS, MED_ROWS = 6, 2
MED_CW, MED_CH = 560, 500          # cell size
MED_TOP = 300                      # depth of the heading block above the grid


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


def grid_cells(rect):
    """Tile cells inside a district, in reading order. The bottom BAR_H is
    reserved for the show-all bar, so no tile can ever sit under it."""
    x0, y0, x1, y1 = rect
    cells = []
    gy = y0 + HEADER + PAD
    while gy + M <= y1 - PAD - BAR_H:
        gx = x0 + PAD
        while gx + M <= x1 - PAD:
            cells.append((round(gx, 1), round(gy, 1)))
            gx += PITCH
        gy += PITCH
    return cells


def wrap_label(label, width):
    """One type size everywhere; a label that does not fit on one line wraps at
    the space nearest its middle instead of shrinking. Archivo's bold caps
    average a shade under 0.6em."""
    room = width - 60 - (7 * LABEL_SIZE * 0.62) - 34   # leave room for "NNN orgs"
    if len(label) * LABEL_SIZE * 0.585 <= room:
        return [label]
    words = label.split()
    if len(words) == 1:
        return [label]
    best, mid = None, len(label) / 2
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        d = abs(len(a) - mid)
        if best is None or d < best[0]: best = (d, a, b)
    return [best[1], best[2]]


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
    if len(MEDALLION) != MED_COLS * MED_ROWS:
        sys.exit(f"FATAL: centre grid is {MED_COLS}x{MED_ROWS} but MEDALLION holds {len(MEDALLION)}")

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
    # The tiles doubled in size so the logos could, which means the wall shows
    # fewer of them: roughly an eighth of each layer, ranked by score, with the
    # full roster one press of the district's bar away. Proportional rather than
    # flat, so Governance still reads bigger than Capital at a glance.
    SHOW_FRACTION, SHOW_MIN, SHOW_MAX = 0.13, 6, 14
    shown, overflow = {}, {}
    for k, v in buckets.items():
        n = max(SHOW_MIN, min(SHOW_MAX, round(len(v) * SHOW_FRACTION)))
        n = min(n, len(v))
        shown[k], overflow[k] = v[:n], v[n:]
        print(f"  show {n:3d} of {len(v):3d}  {k}")

    planned = [n for b in BANDS.values() for n in b]
    if sorted(planned) != sorted(buckets):
        sys.exit(f"FATAL: BANDS covers {sorted(planned)}, data has {sorted(buckets)}")

    span = 2 * CEN_HH        # height shared by the left and right districts

    # ------------------------------------------------- left and right widths
    sides = {}
    for side in ("left", "right"):
        name = BANDS[side][0]
        for cols in range(1, 24):
            width = cols * PITCH + 2 * PAD
            if side == "left":
                rect = (-CEN_HW - width, -CEN_HH, -CEN_HW, CEN_HH)
            else:
                rect = (CEN_HW, -CEN_HH, CEN_HW + width, CEN_HH)
            cells = grid_cells(rect)
            if len(cells) >= len(shown[name]):
                sides[side] = (width, [(name, rect, cells)])
                break
        else:
            sys.exit(f"FATAL: {side} band cannot be made wide enough")

    plate_x0 = -CEN_HW - sides["left"][0]
    plate_x1 = CEN_HW + sides["right"][0]
    plate_w = plate_x1 - plate_x0

    # ------------------------------------------------------ top and bottom bands
    # Both run the full width of the plate; take the shallowest depth that fits
    # all four districts side by side.
    horiz = {}
    for band in ("top", "bottom"):
        names = BANDS[band] if band == "top" else BANDS[band][::-1]
        counts = [len(shown[n]) for n in names]
        usable_cols = int((plate_w - 2 * PAD * len(names)) // PITCH)
        for rows in range(1, 20):
            need = [math.ceil(n / rows) for n in counts]
            if sum(need) <= usable_cols: break
        else:
            sys.exit(f"FATAL: {band} band cannot be made deep enough")
        depth = HEADER + rows * PITCH + 2 * PAD + BAR_H
        spare = usable_cols - sum(need)
        order = sorted(range(len(need)), key=lambda i: -(counts[i] % rows or rows))
        for k in range(spare):
            need[order[k % len(need)]] += 1
        widths = [c * PITCH + 2 * PAD for c in need]
        widths[-1] += plate_w - sum(widths)      # absorb rounding on the last one
        rects, x = [], plate_x0
        for name, w in zip(names, widths):
            y0 = -CEN_HH - depth if band == "top" else CEN_HH
            rect = (x, y0, x + w, y0 + depth)
            rects.append((name, rect, grid_cells(rect)))
            x += w
        horiz[band] = (depth, rects)

    plate_y0 = -CEN_HH - horiz["top"][0]
    plate_y1 = CEN_HH + horiz["bottom"][0]

    # ------------------------------------------------------------ assemble
    districts, chips = [], []
    for band in ("top", "right", "bottom", "left"):
        rects = (horiz if band in ("top", "bottom") else sides)[band][1]
        for name, rect, cells in rects:
            items = shown[name]
            if len(cells) < len(items):
                sys.exit(f"FATAL: {name} has {len(items)} companies for {len(cells)} cells")
            x0, y0, x1, y1 = rect
            total = len(buckets[name])
            lines = wrap_label(name.replace("Governance: ", "").upper(), x1 - x0)
            hidden = overflow[name]
            districts.append({
                "id": slug(name), "layer": name, "band": band,
                "hue": HUE.get(name, 220), "count": total,
                "shown": len(items),
                # Everyone this district holds but does not draw. The bar across
                # the district's foot opens them, so the roster travels with the
                # geometry.
                "overflow": [{"name": c["name"], "slug": slug_of(c), "id": c["id"],
                              "mono": c.get("mono", c["name"][:2].upper()),
                              "exited": bool(c.get("exited")),
                              "spokenTo": bool(c.get("spokenTo"))}
                             for c in hidden],
                "x": round(x0, 1), "y": round(y0, 1),
                "w": round(x1 - x0, 1), "h": round(y1 - y0, 1),
                "poly": [[round(px, 1), round(py, 1)] for px, py in
                         [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]],
                "header": {"x": round(x0, 1), "y": round(y0, 1),
                           "w": round(x1 - x0, 1), "h": HEADER,
                           "tx": round(x0, 1), "tw": round(x1 - x0, 1)},
                "labelSize": LABEL_SIZE, "labelLines": lines,
                # The full-width door to the rest of the roster. Emitted even
                # when nothing is hidden (then the renderer skips it), so the
                # geometry is stable if a layer shrinks.
                "bar": {"x": round(x0 + PAD, 1), "y": round(y1 - PAD - BAR_H + 20, 1),
                        "w": round(x1 - x0 - 2 * PAD, 1), "h": BAR_H - 20},
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
    # A plain 4 x 3 grid of tiles under a centred heading: logo, name, and a
    # one-to-two-sentence claim per company. Tiles, not floating marks.
    grid_w = MED_COLS * MED_CW
    gx0 = -grid_w / 2
    gy0 = -CEN_HH + MED_TOP
    medallion = []
    for k, nm in enumerate(MEDALLION):
        c = by_name[nm]
        row, col = divmod(k, MED_COLS)
        medallion.append({
            "name": nm, "slug": slug_of(c), "id": c["id"],
            "x": round(gx0 + col * MED_CW, 1), "y": round(gy0 + row * MED_CH, 1),
            "w": MED_CW, "h": MED_CH,
            "cat": c["cat"], "hue": HUE.get(c["cat"], 220),
            "mono": c.get("mono", nm[:2].upper()),
            "claim": known.get(nm, ""),
        })

    centre = {
        "cx": 0, "cy": 0, "r": CEN_HH, "hw": CEN_HW, "hh": CEN_HH,
        "points": [[-CEN_HW, -CEN_HH], [CEN_HW, -CEN_HH],
                   [CEN_HW, CEN_HH], [-CEN_HW, CEN_HH]],
        "titleY": -CEN_HH + 130, "subY": -CEN_HH + 196,
        "ruleY": CEN_HH - 130, "footY": CEN_HH - 76,
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
        shift_xy(d); shift_xy(d["header"]); shift_xy(d["bar"])
        d["header"]["tx"] = round(d["header"]["tx"] + ox, 1)
        d["poly"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in d["poly"]]
    for c in chips: shift_xy(c)
    for c in medallion: shift_xy(c)
    centre["cx"], centre["cy"] = round(ox, 1), round(oy, 1)
    centre["points"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in centre["points"]]
    for key in ("titleY", "subY", "ruleY", "footY"):
        centre[key] = round(centre[key] + oy, 1)

    layout = {
        "meta": {
            "generatedBy": "tools/build-poster-layout.py",
            "module": M, "pitch": PITCH, "margin": MARGIN, "headerH": HEADER,
            "companyCount": len(companies),
            "medallionCount": len(MEDALLION), "medStyle": MED_STYLE,
            "width": W, "height": H,
            "plate": {"x": MARGIN, "y": MARGIN, "w": round(plate_w, 1),
                      "h": round(plate_y1 - plate_y0, 1), "rx": PLATE_R},
            # the centre's bounding box, kept under its old name so the social-card
            # renderer can keep cropping to "the centre" without knowing the shape
            "medallionBox": {"x": round(ox - CEN_HW, 1), "y": round(oy - CEN_HH, 1),
                             "w": 2 * CEN_HW, "h": 2 * CEN_HH},
        },
        "oct": centre, "districts": districts, "chips": chips, "medallion": medallion,
    }

    # Not every company gets a tile, but every company must still be reachable:
    # drawn in a district, sitting in the centre, or listed in some district's
    # overflow. Losing one silently is the failure this guards against.
    drawn = len(chips) + len(medallion)
    held = drawn + sum(len(d["overflow"]) for d in districts)
    if held != len(companies):
        sys.exit(f"FATAL: {held} companies accounted for, data has {len(companies)}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(layout, open(OUT, "w", encoding="utf-8"), indent=1)
    print(f"canvas   {W} x {H}  (aspect {W/H:.2f})")
    print(f"plate    {plate_w:.0f} x {plate_y1 - plate_y0:.0f}")
    print(f"drawn    {drawn} of {len(companies)} companies "
          f"({len(medallion)} in the centre + {len(chips)} in districts); "
          f"{held - drawn} more reachable through each district's bar")
    for d in districts:
        print(f"  {d['band']:<6} {d['shown']:>3} of {d['count']:>3} in {d['capacity']:>3} cells "
              f"(slack {d['slack']:>2})  {d['layer']}")
    print(f"wrote    {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
