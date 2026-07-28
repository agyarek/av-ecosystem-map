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
A hexagonal rosette. The ten passenger operators sit inside a regular hexagon at the
centre. The ten remaining layers dock onto the hexagon's six borders: every district
is a rectangle whose root side lies flush with a hexagon edge and whose other three
sides are perpendicular to it. Four edges carry two districts side by side, two carry
one, so all ten touch the hexagon rather than stacking behind each other.

Company chips stay upright inside those tilted panels. The lattice rotates with the
panel; the tiles do not, so 551 company names never have to be read at an angle. The
lattice pitch is set from the tile size divided by the worst-case axis projection of
the panel's rotation, which is what keeps upright tiles on a rotated grid from
touching.

Petal depth is data, not decoration: a district is as deep as its company count needs.

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
M       = 160     # chip tile, px. Chips are upright squares everywhere on the chart.
PITCH   = 196     # lattice pitch inside a district. See note below.
COLS    = 9       # lattice columns across one hexagon edge
HEX_R   = 1800    # hexagon circumradius == hexagon edge length
INSET   = 18      # slack at each end of an edge so tiles clear the vertices
GUTTER  = 24      # between two districts sharing one edge
HEADER  = 210     # district header band, measured outward from the hexagon edge
MARGIN  = 240     # canvas margin around the rosette

# PITCH must be at least M / max(|ux|, |uy|) for the steepest panel, or upright tiles
# on a rotated lattice would overlap. The steepest panels sit at 30 degrees, where
# that floor is 160 / cos(30) = 184.8. 196 clears it with room to breathe, and the
# same pitch everywhere means one tile occupies the same area in every district.
assert PITCH >= M / math.cos(math.radians(30)), "pitch too tight for 30-degree panels"
assert COLS * PITCH <= HEX_R - 2 * INSET + 1, "lattice wider than a hexagon edge"

# The ten passenger-AV operators that occupy the centre hexagon.
# See DECISION-LOG.md D-03 for why this list differs from v1's `operators` array.
MEDALLION = [
    "Waymo", "Baidu Apollo Go", "Tesla", "Zoox", "Pony.ai",
    "WeRide", "Wayve", "Nuro", "May Mobility", "Motional",
]

# AV Middleware & Tooling holds only 3 companies. It stays a real layer in the
# taxonomy (the site still says eleven layers) but renders as part of the autonomy
# district rather than a district of its own.
MERGE = {"AV Middleware & Tooling": "AV Driver / Autonomy Software"}

# One entry per hexagon edge, clockwise from the upper-right edge. Districts inside
# an entry are listed in clockwise order too, so reading the rosette clockwise from
# the top follows the chain: demand, autonomy, sensing, maps, connectivity, vehicle,
# fleet, capital, regulators, standards, and back to demand. Demand and autonomy meet
# at twelve o'clock, which is where a ride starts.
#
# Which layer lands on which edge is not free: an edge carrying two districts splits
# its columns between them, so pairing changes how deep a petal runs and therefore
# the shape of the whole rosette. This arrangement keeps the chain intact while
# holding the deepest petal to 1.75x the shallowest and the canvas landscape.
SECTORS = [
    ["AV Driver / Autonomy Software", "Sensing & Compute Hardware"],
    ["Data, Maps & Simulation", "Connectivity & Infrastructure"],
    ["Vehicle Platform & Manufacturing"],
    ["Fleet Operations & Depot"],
    ["Capital, Insurance & Risk", "Governance: Regulators & Government"],
    ["Governance: Standards, Safety & Advocacy", "Demand & Commercial Platforms"],
]

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

# Type inside the hexagon, shared with tools/render-poster.py and assets/js/poster.js
# so the two renderers cannot drift apart.
MED_STYLE = {"logo": 200, "logoY": 70, "nameY": 320, "nameSize": 42,
             "claimY": 366, "claimStep": 34, "claimSize": 25, "claimChars": 32}


def slug_of(c):
    """The slug field on the company record is the source of truth (it is
    collision-resolved there); computing is only a fallback for older data."""
    if c.get("slug"): return c["slug"]
    return slug(c["name"])

def slug(s):
    """Plain slugifier for layer/district names."""
    out, prev = [], False
    for ch in s.lower():
        if ch.isalnum(): out.append(ch); prev = False
        elif not prev:   out.append("-"); prev = True
    return "".join(out).strip("-")

def split_columns(counts, cols):
    """Divide an edge's columns between the districts sharing it. Minimise the
    deepest of the two petals first, then the wasted cells, so neither district
    on an edge sticks out far past the other."""
    if len(counts) == 1: return [cols]
    n1, n2 = counts
    best = None
    for c1 in range(2, cols - 1):
        c2 = cols - c1
        r1, r2 = math.ceil(n1 / c1), math.ceil(n2 / c2)
        key = (max(r1, r2), c1 * r1 - n1 + c2 * r2 - n2, abs(r1 - r2))
        if best is None or key < best[0]: best = (key, [c1, c2])
    return best[1]


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
        # Rank inside a district: relevance score desc, then name. Deterministic,
        # and it puts the best-known names in the row nearest the hexagon.
        buckets[k].sort(key=lambda c: (-c.get("score", 0), c["name"].lower()))

    planned = [n for s in SECTORS for n in s]
    if sorted(planned) != sorted(buckets):
        sys.exit(f"FATAL: SECTORS covers {sorted(planned)}, data has {sorted(buckets)}")

    # ------------------------------------------------------------- hexagon
    # Pointy-top: vertices top and bottom, flat vertical edges left and right. That
    # orientation puts four of the six panels at a readable 30 degrees and the other
    # two upright, where a flat-top hexagon would tilt four of them to 60.
    apothem = HEX_R * math.sqrt(3) / 2
    verts = [(0, -HEX_R), (apothem, -HEX_R / 2), (apothem, HEX_R / 2),
             (0, HEX_R), (-apothem, HEX_R / 2), (-apothem, -HEX_R / 2)]

    districts, chips = [], []
    for e, layers in enumerate(SECTORS):
        a, b = verts[e], verts[(e + 1) % 6]
        px, py = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2           # edge midpoint
        nout = (px / (apothem), py / (apothem))                 # outward unit normal
        dx, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dx, dy)
        ux, uy = dx / ln, dy / ln
        # Choose the edge direction that keeps a header upright: never past vertical,
        # never upside down. Vertical edges settle to the book-spine convention.
        if ux < -1e-9 or (abs(ux) < 1e-9 and ((px < 0) == (uy > 0))):
            ux, uy = -ux, -uy
        rot = math.degrees(math.atan2(uy, ux))
        nlx, nly = -math.sin(math.radians(rot)), math.cos(math.radians(rot))
        out = 1 if (nlx * nout[0] + nly * nout[1]) > 0 else -1
        # Districts run clockwise along the edge; flip if local +x runs the other way.
        tcw = (-nout[1], nout[0])
        order = layers if (ux * tcw[0] + uy * tcw[1]) > 0 else layers[::-1]

        cols = split_columns([len(buckets[n]) for n in order], COLS)
        rows = [math.ceil(len(buckets[n]) / c) for n, c in zip(order, cols)]
        depth = HEADER + max(rows) * PITCH        # both petals on an edge run level

        def world(s, t):
            return (px + s * ux + out * t * nlx, py + s * uy + out * t * nly)

        s0 = -COLS * PITCH / 2                    # left end of the lattice
        for i, name in enumerate(order):
            items = buckets[name]
            cs = s0 + sum(cols[:i]) * PITCH       # this district's lattice start
            fa = cs + (GUTTER / 2 if i else -INSET)                 # frame, near end
            fb = cs + cols[i] * PITCH - (GUTTER / 2 if i < len(order) - 1 else -INSET)
            poly = [world(fa, 0), world(fb, 0), world(fb, depth), world(fa, depth)]
            xs, ys = [p[0] for p in poly], [p[1] for p in poly]
            districts.append({
                "id": slug(name), "layer": name, "edge": e,
                "hue": HUE.get(name, 220), "count": len(items),
                "cols": cols[i], "rows": rows[i],
                "ox": round(px, 1), "oy": round(py, 1), "rot": round(rot, 4), "out": out,
                # local frame rect, to be drawn inside translate(ox,oy) rotate(rot)
                "x": round(fa, 1), "y": round(min(0, out * depth), 1),
                "w": round(fb - fa, 1), "h": round(depth, 1),
                "headerH": HEADER,
                "poly": [[round(x, 1), round(y, 1)] for x, y in poly],
                "bbox": {"x": round(min(xs), 1), "y": round(min(ys), 1),
                         "w": round(max(xs) - min(xs), 1), "h": round(max(ys) - min(ys), 1)},
                "capacity": cols[i] * rows[i], "slack": cols[i] * rows[i] - len(items),
            })
            for j, c in enumerate(items):
                wx, wy = world(cs + (j % cols[i] + 0.5) * PITCH,
                               HEADER + (j // cols[i] + 0.5) * PITCH)
                chips.append({
                    "name": c["name"], "slug": slug_of(c), "id": c["id"],
                    "district": slug(name),
                    "x": round(wx - M / 2, 1), "y": round(wy - M / 2, 1), "w": M, "h": M,
                    "mono": c.get("mono", c["name"][:2].upper()),
                    "hue": HUE.get(name, 220),
                    "layers": len(c.get("all", [])),
                    # hue pips for additional canonical layers beyond the district
                    "pips": [HUE[al] for al in c.get("all", [])
                             if al in HUE and al != MERGE.get(c["cat"], c["cat"])][:4],
                    "exited": bool(c.get("exited")),
                    "spokenTo": bool(c.get("spokenTo")),
                })

    # ------------------------------------------------------ the ten, inside
    # Rows of 3, 4 and 3 are the packing a hexagon asks for. The widest row sits on
    # the hexagon's waist where the full width is available.
    ROWS = [(3, 780, -900), (4, 740, -240), (3, 780, 420)]
    CELL_H = 520
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

    hexagon = {
        "cx": 0, "cy": 0, "r": HEX_R, "apothem": round(apothem, 1),
        "points": [[round(x, 1), round(y, 1)] for x, y in verts],
        "titleY": -1080, "subY": -988, "ruleY": 1070, "footY": 1140,
        "title": "THE TEN", "sub": "OPERATORS A PASSENGER CAN ACTUALLY MEET",
        "foot": f"10 OF {len(companies)} ORGANISATIONS ON THIS CHART",
    }

    # --------------------------------------------------------------- canvas
    xs = [p[0] for d in districts for p in d["poly"]] + [v[0] for v in verts]
    ys = [p[1] for d in districts for p in d["poly"]] + [v[1] for v in verts]
    ox, oy = MARGIN - min(xs), MARGIN - min(ys)
    W = round(max(xs) - min(xs) + 2 * MARGIN)
    H = round(max(ys) - min(ys) + 2 * MARGIN)

    def shift(obj, keys=("x", "y")):
        obj[keys[0]] = round(obj[keys[0]] + ox, 1)
        obj[keys[1]] = round(obj[keys[1]] + oy, 1)

    for d in districts:
        d["ox"], d["oy"] = round(d["ox"] + ox, 1), round(d["oy"] + oy, 1)
        d["poly"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in d["poly"]]
        shift(d["bbox"])
    for c in chips: shift(c)
    for c in medallion: shift(c)
    hexagon["cx"], hexagon["cy"] = round(ox, 1), round(oy, 1)
    hexagon["points"] = [[round(x + ox, 1), round(y + oy, 1)] for x, y in hexagon["points"]]
    for k_ in ("titleY", "subY", "ruleY", "footY"):
        hexagon[k_] = round(hexagon[k_] + oy, 1)

    layout = {
        "meta": {
            "generatedBy": "tools/build-poster-layout.py",
            "module": M, "pitch": PITCH, "cols": COLS, "margin": MARGIN,
            "hexR": HEX_R, "headerH": HEADER,
            "companyCount": len(companies), "medallionCount": len(MEDALLION),
            "width": W, "height": H, "medStyle": MED_STYLE,
            # the hexagon's bounding box, kept under its old name so the social-card
            # renderer can keep cropping to "the centre" without knowing the shape
            "medallionBox": {"x": round(hexagon["cx"] - apothem, 1),
                             "y": round(hexagon["cy"] - HEX_R, 1),
                             "w": round(2 * apothem, 1), "h": 2 * HEX_R},
        },
        "hex": hexagon, "districts": districts, "chips": chips, "medallion": medallion,
    }

    placed = len(chips) + len(medallion)
    if placed != len(companies):
        sys.exit(f"FATAL: placed {placed} chips for {len(companies)} companies")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(layout, open(OUT, "w", encoding="utf-8"), indent=1)
    print(f"canvas   {W} x {H}  (aspect {W/H:.2f})")
    print(f"placed   {placed} of {len(companies)} companies "
          f"({len(medallion)} in the hexagon + {len(chips)} in districts)")
    for d in districts:
        print(f"  edge {d['edge']}  rot {d['rot']:>6.1f}  out {d['out']:+d}  "
              f"{d['cols']}x{d['rows']}  slack {d['slack']:>2}  {d['layer']}")
    print(f"tightest district slack: {min(d['slack'] for d in districts)}")
    print(f"wrote    {os.path.relpath(OUT, ROOT)}")

if __name__ == "__main__":
    main()
