#!/usr/bin/env python3
"""
build-poster-layout.py — freeze the wall-chart geometry into data/poster-layout.json

Why this exists
---------------
The wall chart is one 6800x4560 SVG holding 560 company chips. If the layout were
computed in the browser it would reflow on every filter, every font load and every
data edit, and the reader would lose the mental map they just built. So the layout
is computed ONCE, here, checked into the repo, and rendered verbatim at runtime.

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
M       = 160          # module = one chip cell, px
COLS    = 40           # grid width in modules
MARGIN  = 200          # outer margin, px
CHIP_PAD = 10          # inset inside a chip cell

# The ten passenger-AV operators that occupy the centre medallion.
# See DECISION-LOG.md D-03 for why this list differs from v1's `operators` array.
MEDALLION = [
    "Waymo", "Baidu Apollo Go", "Tesla", "Zoox", "Pony.ai",
    "WeRide", "Wayve", "Nuro", "May Mobility", "Motional",
]

# AV Middleware & Tooling holds only 3 companies. It stays a real layer in the
# taxonomy (the site still says eleven layers) but renders as a labelled sub-band
# inside the autonomy district rather than a district of its own.
MERGE = {"AV Middleware & Tooling": "AV Driver / Autonomy Software"}

# The poster's composition IS the argument: the four stages of the ride surround
# the operators, and the three cross-cutting layers sit underneath all of them.
# Reading clockwise from the medallion: left = request, top = driver,
# right = vehicle, bottom = pitlane.
PLAN = [
    {"kind": "band", "id": "driver",
     "label": "THE DRIVER",
     "note": "Everything that has to work before software can take the wheel.",
     "districts": [("AV Driver / Autonomy Software", 11),
                   ("Sensing & Compute Hardware", 8),
                   ("Data, Maps & Simulation", 10),
                   ("Connectivity & Infrastructure", 11)]},
    {"kind": "middle", "id": "core",
     "label": "THE REQUEST · THE TEN · THE VEHICLE",
     "note": "Where a rider meets a machine, and what carries them.",
     "districts": [("Demand & Commercial Platforms", 13),
                   ("__MEDALLION__", 14),
                   ("Vehicle Platform & Manufacturing", 13)]},
    {"kind": "band", "id": "pitlane",
     "label": "THE PITLANE",
     "note": "What happens in the minutes between one ride and the next.",
     "districts": [("Fleet Operations & Depot", 40)]},
    {"kind": "band", "id": "across",
     "label": "ACROSS EVERY STAGE",
     "note": "Layers that touch all four stages and are visible in none of them.",
     "districts": [("Capital, Insurance & Risk", 9),
                   ("Governance: Regulators & Government", 17),
                   ("Governance: Standards, Safety & Advocacy", 14)]},
]

# Hues are re-tuned from v1 for a paper-white ground: same hue wheel, lower
# chroma, so 560 tiles never turn into confetti.
HUE = {
    "AV Driver / Autonomy Software": 265, "Sensing & Compute Hardware": 200,
    "Data, Maps & Simulation": 150, "Connectivity & Infrastructure": 230,
    "Vehicle Platform & Manufacturing": 40, "Demand & Commercial Platforms": 20,
    "Fleet Operations & Depot": 320, "Capital, Insurance & Risk": 60,
    "Governance: Regulators & Government": 290,
    "Governance: Standards, Safety & Advocacy": 340,
}

def slug_of(c):
    """The slug field on the company record is the source of truth (it is
    collision-resolved there); computing is only a fallback for older data."""
    if c.get("slug"): return c["slug"]
    out, prev = [], False
    for ch in c["name"].lower():
        if ch.isalnum(): out.append(ch); prev = False
        elif not prev:   out.append("-"); prev = True
    return "".join(out).strip("-")

def slug(s):
    """Plain slugifier for layer/district names."""
    out, prev = [], False
    for ch in s.lower():
        if ch.isalnum(): out.append(ch); prev = False
        elif not prev:   out.append("-"); prev = True
    return "".join(out).strip("-")

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
        # Rank inside a district: relevance score desc, then name. Deterministic.
        buckets[k].sort(key=lambda c: (-c.get("score", 0), c["name"].lower()))

    layout = {
        "meta": {
            "generatedBy": "tools/build-poster-layout.py",
            "module": M, "cols": COLS, "margin": MARGIN, "chipPad": CHIP_PAD,
            "companyCount": len(companies), "medallionCount": len(MEDALLION),
        },
        "bands": [], "districts": [], "chips": [], "medallion": [],
    }

    BAND_LABEL_H = 1          # modules
    DISTRICT_HDR_H = 1        # modules, inside the district
    y = 0                     # cursor in modules

    for band in PLAN:
        band_top = y
        layout["bands"].append({
            "id": band["id"], "label": band["label"], "note": band["note"],
            "x": MARGIN, "y": MARGIN + y * M, "w": COLS * M, "labelH": BAND_LABEL_H * M,
        })
        y += BAND_LABEL_H
        row_top, band_h = y, 0
        x = 0
        for name, w in band["districts"]:
            if name == "__MEDALLION__":
                h = 7
                mx, my = MARGIN + x * M, MARGIN + row_top * M
                layout["meta"]["medallionBox"] = {"x": mx, "y": my, "w": w * M, "h": h * M}
                per_row, rows = 5, 2
                cw, ch = (w * M) / per_row, ((h - 1) * M) / rows   # 1 module for the title
                for i, nm in enumerate(MEDALLION):
                    c = by_name[nm]
                    layout["medallion"].append({
                        "name": nm, "slug": slug_of(c), "id": c["id"],
                        "x": round(mx + (i % per_row) * cw, 1),
                        "y": round(my + M + (i // per_row) * ch, 1),
                        "w": round(cw, 1), "h": round(ch, 1),
                        "cat": c["cat"], "hue": HUE.get(c["cat"], 220),
                        "mono": c.get("mono", nm[:2].upper()),
                        "claim": known.get(nm, ""),
                    })
                band_h = max(band_h, h); x += w
                continue

            items = buckets[name]
            n = len(items)
            chip_rows = math.ceil(n / w) if n else 0
            h = DISTRICT_HDR_H + chip_rows
            dx, dy = MARGIN + x * M, MARGIN + row_top * M
            layout["districts"].append({
                "id": slug(name), "layer": name, "band": band["id"],
                "x": dx, "y": dy, "w": w * M, "h": h * M,
                "headerH": DISTRICT_HDR_H * M, "cols": w, "rows": chip_rows,
                "count": n, "hue": HUE.get(name, 220),
                "capacity": w * chip_rows, "slack": w * chip_rows - n,
            })
            for i, c in enumerate(items):
                layout["chips"].append({
                    "name": c["name"], "slug": slug_of(c), "id": c["id"],
                    "district": slug(name),
                    "x": dx + (i % w) * M, "y": dy + DISTRICT_HDR_H * M + (i // w) * M,
                    "w": M, "h": M,
                    "mono": c.get("mono", c["name"][:2].upper()),
                    "hue": HUE.get(name, 220),
                    "layers": len(c.get("all", [])),
                    # hue pips for additional canonical layers beyond the district
                    "pips": [HUE[a] for a in c.get("all", [])
                             if a in HUE and a != MERGE.get(c["cat"], c["cat"])][:4],
                    "exited": bool(c.get("exited")),
                    "spokenTo": bool(c.get("spokenTo")),
                })
            band_h = max(band_h, h); x += w

        if x != COLS:
            sys.exit(f"FATAL: band '{band['id']}' widths sum to {x} modules, expected {COLS}")
        y = row_top + band_h

    W, H = COLS * M + 2 * MARGIN, y * M + 2 * MARGIN
    layout["meta"].update({"width": W, "height": H, "rows": y})

    placed = len(layout["chips"]) + len(layout["medallion"])
    if placed != len(companies):
        sys.exit(f"FATAL: placed {placed} chips for {len(companies)} companies")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(layout, open(OUT, "w", encoding="utf-8"), indent=1)
    print(f"canvas   {W} x {H}  (aspect {W/H:.2f})")
    print(f"placed   {placed} of {len(companies)} companies "
          f"({len(layout['medallion'])} medallion + {len(layout['chips'])} chips)")
    print(f"tightest district slack: "
          f"{min(d['slack'] for d in layout['districts'])}")
    print(f"wrote    {os.path.relpath(OUT, ROOT)}")

if __name__ == "__main__":
    main()
