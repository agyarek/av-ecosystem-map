#!/usr/bin/env python3
"""
build-poster-layout.py :: freeze the ecosystem-map geometry into data/poster-layout.json

Why this exists
---------------
The ecosystem map is one SVG holding every company tile. If the layout were computed in
the browser it would reflow on every filter, every font load and every data edit, and
the reader would lose the mental map they just built. So the layout is computed ONCE,
here, checked into the repo, and rendered verbatim at runtime.

The composition
---------------
One tall rounded rectangle: full-width rows of districts stacked around a full-width
centre row holding passenger autonomy as a tile grid. Every organisation in the data
gets its own tile — nothing is sampled, nothing hides behind a door:

    +------------+-----------+-----------+--------------+
    |  Driver    |  Sensing  |   Data    | Connectivity |
    +------------+-----------+-----------+--------------+
    |              PASSENGER AUTONOMY                   |
    |        [t] [t] [t] [t] [t] [t]                    |
    |        [t] [t] [t] [t] [t] [t]                    |
    +---------------+---------------+-------------------+
    |    Demand     |    Vehicle    |      Fleet        |
    +---------------+---------------+-------------------+
    |   Capital     |  Regulators   |    Standards      |
    +---------------+---------------+-------------------+

Reading top to bottom: build the driver, meet it, run the service, fund and police
it. Every district is axis-aligned and every label is horizontal and set at ONE size
across the chart.

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
CHIP_W  = 240     # chip tile width, px — sized so a 172px logo fits with air
CHIP_H  = 288     # taller than wide: logo, a bold name, then a one-line claim
PITCH_X = 264     # lattice pitch: tile plus the air between tiles
PITCH_Y = 312
HEADER  = 280     # district header band
PAD     = 32      # inset between a district border and its tile grid
MARGIN  = 200     # canvas margin outside the plate
PLATE_R = 56      # corner radius of the plate
LABEL_SIZE = 44   # ONE title size for every district, wrapping instead of shrinking

# The plate width is FROZEN. The default map view shows the plate at full width,
# so this number is the reading scale: change it and every name on the wall gets
# bigger or smaller on screen. The chart grows downward instead.
PLATE_W = 5352

# The centre row: heading, a line of description, then a 6 x 2 grid of operator
# tiles. The row itself runs the full plate width; CEN_HW survives only as the
# half-width of meta.medallionBox, the crop the social-card renderer uses.
CEN_HW  = 1820    # half-width of the medallion crop box
CEN_HH  = 760     # half-height of the centre row

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

# District rows top to bottom, each running the full plate width. Above the
# centre: the driver and everything that makes it possible. Below it: the
# running service (demand, the machine, its upkeep), then the foundation the
# whole thing stands on (money and permission).
ROW_BANDS = [
    ("top",    ["AV Driver / Autonomy Software", "Sensing & Compute Hardware",
                "Data, Maps & Simulation", "Connectivity & Infrastructure"]),
    ("centre", None),
    ("mid",    ["Demand & Commercial Platforms", "Vehicle Platform & Manufacturing",
                "Fleet Operations & Depot"]),
    ("bottom", ["Capital, Insurance & Risk", "Governance: Regulators & Government",
                "Governance: Standards, Safety & Advocacy"]),
]

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

# Type inside a district chip, same contract as MED_STYLE: both renderers read
# these offsets from meta.chipStyle rather than hardcoding their own. The name
# is the chip's dominant text now — the logo gave up ground so the company can
# be read without zooming — with the one-line claim beneath it.
CHIP_STYLE = {"logo": 120, "logoY": 16, "nameY": 172, "nameSize": 32,
              "nameStep": 36, "nameChars": 12,
              "descY": 240, "descStep": 14, "descSize": 11.5, "descChars": 34}

# One line under each district's name saying what the layer is, sized against
# the count so the header answers "what is this and how big is it" in a glance.
DESC = {
    "AV Driver / Autonomy Software": "THE {n} ORGS WRITING AND PROVING THE DRIVING SOFTWARE",
    "Sensing & Compute Hardware": "THE {n} ORGS BUILDING THE SENSORS AND SILICON IT RUNS ON",
    "Data, Maps & Simulation": "THE {n} ORGS SUPPLYING ITS DATA, MAPS AND PRACTICE MILES",
    "Connectivity & Infrastructure": "THE {n} ORGS KEEPING FLEETS CONNECTED TO ROAD AND CLOUD",
    "Vehicle Platform & Manufacturing": "THE {n} ORGS BUILDING THE VEHICLES AROUND THE DRIVER",
    "Demand & Commercial Platforms": "THE {n} ORGS THAT BRING IT RIDERS AND FREIGHT",
    "Fleet Operations & Depot": "THE {n} ORGS CHARGING, CLEANING AND TURNING FLEETS AROUND",
    "Capital, Insurance & Risk": "THE {n} ORGS FUNDING AND INSURING THE INDUSTRY",
    "Governance: Regulators & Government": "THE {n} BODIES THAT PERMIT, LICENSE AND POLICE IT",
    "Governance: Standards, Safety & Advocacy": "THE {n} BODIES WRITING ITS STANDARDS AND MAKING ITS CASE",
}
DESC_SIZE = 36    # IBM Plex Mono, same voice as the org counts — sized to read
                  # at the default zoom, not just in the exported poster

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
    """Tile cells inside a district, in reading order."""
    x0, y0, x1, y1 = rect
    cells = []
    gy = y0 + HEADER + PAD
    while gy + CHIP_H <= y1 - PAD:
        gx = x0 + PAD
        while gx + CHIP_W <= x1 - PAD:
            cells.append((round(gx, 1), round(gy, 1)))
            gx += PITCH_X
        gy += PITCH_Y
    return cells


def wrap_plain(text, maxchars, maxlines):
    """Word-wrap for chip claims and header descriptors, frozen at build time so
    the JS and Python renderers print identical lines instead of each wrapping
    their own way. Overflow ends in an ellipsis rather than clipping."""
    words = str(text).split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) <= maxchars:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
            if len(lines) == maxlines:
                break
    if cur and len(lines) < maxlines:
        lines.append(cur)
    flat = " ".join(words)
    if len(lines) == maxlines and len(flat) > len(" ".join(lines)):
        lines[maxlines - 1] = lines[maxlines - 1][:maxchars - 1] + "…"
    return lines[:maxlines]


def chip_sub(c):
    """The chip's one-liner. `sub` sometimes holds a semicolon-joined list of
    subcategories; the first segment reads as a claim on its own."""
    text = (c.get("sub") or "").split(";")[0].strip()
    return wrap_plain(text, CHIP_STYLE["descChars"], 3)


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

    planned = [n for kind, names in ROW_BANDS if names for n in names]
    if sorted(planned) != sorted(buckets):
        sys.exit(f"FATAL: ROW_BANDS covers {sorted(planned)}, data has {sorted(buckets)}")

    # ------------------------------------------------- solve the stacked rows
    # Plate-local coordinates: (0, 0) is the plate's top-left, y grows downward.
    # Each district row takes the shallowest depth that seats every company in
    # its districts side by side; the centre row has a fixed height.
    y, placed, centre_y0 = 0, [], None
    for kind, names in ROW_BANDS:
        if kind == "centre":
            centre_y0 = y
            y += 2 * CEN_HH
            continue
        counts = [len(buckets[n]) for n in names]
        usable_cols = int((PLATE_W - 2 * PAD * len(names)) // PITCH_X)
        for rows in range(1, 40):
            need = [math.ceil(n / rows) for n in counts]
            if sum(need) <= usable_cols: break
        else:
            sys.exit(f"FATAL: band row {names} cannot be made deep enough")
        depth = HEADER + rows * PITCH_Y + 2 * PAD
        spare = usable_cols - sum(need)
        order = sorted(range(len(need)), key=lambda i: -(counts[i] % rows or rows))
        for k in range(spare):
            need[order[k % len(need)]] += 1
        widths = [c * PITCH_X + 2 * PAD for c in need]
        widths[-1] += PLATE_W - sum(widths)      # absorb rounding on the last one
        x = 0
        for name, w in zip(names, widths):
            rect = (x, y, x + w, y + depth)
            placed.append((kind, name, rect, grid_cells(rect)))
            x += w
        y += depth
    plate_h = y

    # ------------------------------------------------------------ assemble
    districts, chips = [], []
    for kind, name, rect, cells in placed:
        items = buckets[name]
        if len(cells) < len(items):
            sys.exit(f"FATAL: {name} has {len(items)} companies for {len(cells)} cells")
        x0, y0, x1, y1 = rect
        total = len(items)
        lines = wrap_label(name.replace("Governance: ", "").upper(), x1 - x0)
        # the descriptor wraps against the header width at build time, so the
        # narrowest districts get two lines and nothing ever clips. Plex Mono
        # advances at 0.6em plus the renderers' fixed 2px letter-spacing.
        desc_room = int((x1 - x0 - 60) / (DESC_SIZE * 0.6 + 2))
        desc_lines = wrap_plain(DESC.get(name, "").format(n=total),
                                max(20, desc_room), 2)
        districts.append({
            "id": slug(name), "layer": name, "band": kind,
            "hue": HUE.get(name, 220), "count": total,
            "shown": len(items),
            "x": round(x0, 1), "y": round(y0, 1),
            "w": round(x1 - x0, 1), "h": round(y1 - y0, 1),
            "poly": [[round(px, 1), round(py, 1)] for px, py in
                     [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]],
            "header": {"x": round(x0, 1), "y": round(y0, 1),
                       "w": round(x1 - x0, 1), "h": HEADER,
                       "tx": round(x0, 1), "tw": round(x1 - x0, 1)},
            "labelSize": LABEL_SIZE, "labelLines": lines,
            "desc": desc_lines, "descSize": DESC_SIZE,
            "capacity": len(cells), "slack": len(cells) - len(items),
        })
        for c, (gx, gy) in zip(items, cells):
            chips.append({
                "name": c["name"], "slug": slug_of(c), "id": c["id"],
                "district": slug(name),
                "x": gx, "y": gy, "w": CHIP_W, "h": CHIP_H,
                "sub": chip_sub(c),
                "mono": c.get("mono", c["name"][:2].upper()),
                "hue": HUE.get(name, 220),
                "layers": len(c.get("all", [])),
                "pips": [HUE[al] for al in c.get("all", [])
                         if al in HUE and al != MERGE.get(c["cat"], c["cat"])][:4],
                "exited": bool(c.get("exited")),
                "spokenTo": bool(c.get("spokenTo")),
            })

    # ------------------------------------- passenger autonomy, inside
    # A plain 6 x 2 grid of tiles under a centred heading: logo, name, and a
    # one-to-two-sentence claim per company. Tiles, not floating marks.
    ccx = PLATE_W / 2
    grid_w = MED_COLS * MED_CW
    gx0 = ccx - grid_w / 2
    gy0 = centre_y0 + MED_TOP
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
        "cx": ccx, "cy": centre_y0 + CEN_HH,
        "points": [[0, centre_y0], [PLATE_W, centre_y0],
                   [PLATE_W, centre_y0 + 2 * CEN_HH], [0, centre_y0 + 2 * CEN_HH]],
        "titleY": centre_y0 + 130, "subY": centre_y0 + 196,
        "ruleY": centre_y0 + 2 * CEN_HH - 130, "footY": centre_y0 + 2 * CEN_HH - 76,
        "title": "PASSENGER AUTONOMY",
        "sub": "AUTONOMOUS DRIVERS A PASSENGER CAN ACTUALLY MEET",
        "foot": f"{len(MEDALLION)} OF {len(companies)} ORGANISATIONS ON THIS CHART",
    }

    # --------------------------------------------------------------- canvas
    ox = oy = MARGIN
    W = round(PLATE_W + 2 * MARGIN)
    H = round(plate_h + 2 * MARGIN)

    def shift_xy(o):
        o["x"] = round(o["x"] + ox, 1); o["y"] = round(o["y"] + oy, 1)

    for d in districts:
        shift_xy(d); shift_xy(d["header"])
        d["header"]["tx"] = round(d["header"]["tx"] + ox, 1)
        d["poly"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in d["poly"]]
    for c in chips: shift_xy(c)
    for c in medallion: shift_xy(c)
    centre["cx"], centre["cy"] = round(centre["cx"] + ox, 1), round(centre["cy"] + oy, 1)
    centre["points"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in centre["points"]]
    for key in ("titleY", "subY", "ruleY", "footY"):
        centre[key] = round(centre[key] + oy, 1)

    layout = {
        "meta": {
            "generatedBy": "tools/build-poster-layout.py",
            "chipW": CHIP_W, "chipH": CHIP_H, "pitchX": PITCH_X, "pitchY": PITCH_Y,
            "margin": MARGIN, "headerH": HEADER,
            "companyCount": len(companies),
            "medallionCount": len(MEDALLION),
            "medStyle": MED_STYLE, "chipStyle": CHIP_STYLE,
            "width": W, "height": H,
            "plate": {"x": MARGIN, "y": MARGIN, "w": round(PLATE_W, 1),
                      "h": round(plate_h, 1), "rx": PLATE_R},
            # the centre's crop box, kept under its old name and old size so the
            # social-card renderer keeps framing "the centre" without knowing the
            # row now runs the full plate width
            "medallionBox": {"x": round(MARGIN + ccx - CEN_HW, 1),
                             "y": round(MARGIN + centre_y0, 1),
                             "w": 2 * CEN_HW, "h": 2 * CEN_HH},
            # the map's default camera: the plate at full width, vertically
            # centred on the passenger-autonomy row. The viewer boots here and
            # may zoom to at most 1.5x this scale.
            "homeView": {"cx": round(MARGIN + ccx, 1),
                         "cy": round(MARGIN + centre_y0 + CEN_HH, 1),
                         "w": W},
        },
        # the centre travels under its old key name so every renderer keeps
        # working without knowing the shape changed; the geometry is a rectangle
        "oct": centre, "districts": districts, "chips": chips, "medallion": medallion,
    }

    # Every company gets exactly one tile: drawn in a district or sitting in
    # the centre. Losing one silently is the failure this guards against.
    drawn = len(chips) + len(medallion)
    if drawn != len(companies):
        sys.exit(f"FATAL: {drawn} companies drawn, data has {len(companies)}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(layout, open(OUT, "w", encoding="utf-8"), indent=1)
    print(f"canvas   {W} x {H}  (aspect {W/H:.2f})")
    print(f"plate    {PLATE_W:.0f} x {plate_h:.0f}")
    print(f"drawn    {drawn} of {len(companies)} companies "
          f"({len(medallion)} in the centre + {len(chips)} in districts)")
    for d in districts:
        print(f"  {d['band']:<6} {d['shown']:>3} of {d['count']:>3} in {d['capacity']:>3} cells "
              f"(slack {d['slack']:>2})  {d['layer']}")
    print(f"wrote    {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
