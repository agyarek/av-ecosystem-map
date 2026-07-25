#!/usr/bin/env python3
"""validate-data.py — assert the invariants every page depends on.

Run after any data edit, and in CI before deploy:
    python3 tools/validate-data.py

Exits non-zero on the first class of error so a broken dataset never ships.
The checks encode the four defect classes found in July 2026 (character-split
arrays, blank regions, corrupt country fragments, freetext confidence) so
none of them can silently return.
"""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))

LAYERS = [
    "AV Driver / Autonomy Software", "Sensing & Compute Hardware",
    "Data, Maps & Simulation", "AV Middleware & Tooling",
    "Vehicle Platform & Manufacturing", "Demand & Commercial Platforms",
    "Fleet Operations & Depot", "Connectivity & Infrastructure",
    "Capital, Insurance & Risk", "Governance: Regulators & Government",
    "Governance: Standards, Safety & Advocacy",
]
CONFIDENCE = {"Confirmed", "Reported", "Historical"}
STATUS = {"active", "acquired", "wound-down", "bankrupt"}
REQUIRED = ["id", "name", "cat", "sub", "about", "region", "mono", "confidence", "slug", "status"]
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

errors = []
def err(msg): errors.append(msg)

companies = load("av-companies.json")
enrichment = load("av-enrichment.json")
funding = load("av-funding-timeline.json")

# site style: no em-dashes anywhere in rendered copy, data included
for name in ("av-companies.json", "av-enrichment.json", "av-funding-timeline.json"):
    raw = open(os.path.join(ROOT, "data", name), encoding="utf-8").read()
    if "—" in raw:
        err(f"{name}: contains an em-dash; the site's copy rules forbid them")

names = set()
ids, slugs = set(), set()
for c in companies:
    cid = c.get("id", "?")
    for f in REQUIRED:
        if not str(c.get(f, "")).strip():
            err(f"{cid} {c.get('name','?')}: required field '{f}' empty")
    if c["id"] in ids: err(f"duplicate id {c['id']}")
    ids.add(c["id"])
    if c["slug"] in slugs: err(f"duplicate slug {c['slug']} ({cid})")
    slugs.add(c["slug"])
    names.add(c["name"])
    if c["cat"] not in LAYERS:
        err(f"{cid} {c['name']}: cat '{c['cat']}' not in layer list")
    if c["confidence"] not in CONFIDENCE:
        err(f"{cid} {c['name']}: confidence '{c['confidence']}' not an enum value")
    if c["status"] not in STATUS:
        err(f"{cid} {c['name']}: status '{c['status']}' not an enum value")
    if bool(c.get("exited")) != (c["status"] != "active"):
        err(f"{cid} {c['name']}: exited flag disagrees with status '{c['status']}'")
    al = c.get("all", [])
    if not isinstance(al, list) or not al:
        err(f"{cid} {c['name']}: all[] missing or empty")
    else:
        # the character-split defect: a burst of single-character entries
        if sum(1 for a in al if len(str(a)) == 1) > 2:
            err(f"{cid} {c['name']}: all[] looks character-split")
        for a in al:
            if not str(a).strip():
                err(f"{cid} {c['name']}: empty entry in all[]")
    if c.get("country", "") != c.get("hqCountry", ""):
        err(f"{cid} {c['name']}: country '{c.get('country')}' diverges from hqCountry '{c.get('hqCountry')}'")
    fy = c.get("foundedYear")
    if fy not in (None, "") and not (1600 <= int(fy) <= 2027):  # Lloyd's of London: 1688
        err(f"{cid} {c['name']}: foundedYear {fy} out of range")
    lv = c.get("lastVerified")
    if lv and not DATE_RE.match(lv):
        err(f"{cid} {c['name']}: lastVerified '{lv}' not ISO")
    for s in c.get("sources", []):
        if not s.get("url", "").startswith("https://"):
            err(f"{cid} {c['name']}: source url '{s.get('url')}' not https")
        if not DATE_RE.match(s.get("date", "")):
            err(f"{cid} {c['name']}: source date '{s.get('date')}' not ISO")

# enrichment: every edge endpoint and operator resolves to a company name
for op in enrichment.get("operators", []):
    if op not in names: err(f"enrichment operator '{op}' not a company")
for i, edge in enumerate(enrichment.get("edges", [])):
    for end in ("a", "b"):
        if edge.get(end) not in names:
            err(f"edge[{i}] endpoint '{edge.get(end)}' not a company")
    if not edge.get("k"): err(f"edge[{i}] missing kind")
for dn in enrichment.get("domains", {}):
    if dn not in names: err(f"domain entry '{dn}' not a company")

# funding: dates parseable and inside the declared window
meta = funding.get("meta", {})
EVENT_DATE_RE = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")  # month precision allowed
for i, ev in enumerate(funding.get("events", [])):
    if not EVENT_DATE_RE.match(ev.get("date", "")):
        err(f"funding event[{i}] date '{ev.get('date')}' not ISO")
    if not isinstance(ev.get("amountUSDm"), (int, float)) or ev["amountUSDm"] < meta.get("thresholdUSDm", 0):
        err(f"funding event[{i}] {ev.get('company')}: amount below threshold or missing")

# generated files, when present, must agree with the source of truth
layout_path = os.path.join(ROOT, "data", "poster-layout.json")
if os.path.exists(layout_path):
    layout = json.load(open(layout_path, encoding="utf-8"))
    placed = len(layout.get("chips", [])) + len(layout.get("medallion", []))
    if placed != len(companies):
        err(f"poster-layout places {placed} chips for {len(companies)} companies; re-run build-poster-layout.py")
    lslugs = {ch["slug"] for ch in layout.get("chips", [])} | {mo["slug"] for mo in layout.get("medallion", [])}
    if lslugs != slugs:
        err(f"poster-layout slugs diverge from company slugs by {len(lslugs ^ slugs)}; re-run build-poster-layout.py")

if errors:
    print(f"FAIL: {len(errors)} error(s)")
    for e in errors[:60]: print("  -", e)
    sys.exit(1)
print(f"OK: {len(companies)} companies, {len(enrichment['edges'])} edges, "
      f"{len(funding['events'])} funding events, 0 errors")
