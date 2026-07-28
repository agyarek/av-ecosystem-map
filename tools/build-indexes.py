#!/usr/bin/env python3
"""build-indexes.py :: freeze derived data into data/partner-index.json and
data/derived-counts.json so no page computes at runtime what the build can
compute once.

    python3 tools/build-indexes.py

partner-index.json   per-company partner lists (with relationship type and
                     note), edge-kind totals, and the coverage numbers.
derived-counts.json  layer, region, stage, maturity and status counts, the
                     loop-station counts (medallion excluded), and the gap
                     figures published on /map/, /partnerships/ and /method/.
"""
import json, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))
def dump(obj, name):
    path = os.path.join(ROOT, "data", name)
    json.dump(obj, open(path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("wrote", os.path.relpath(path, ROOT))

companies = load("av-companies.json")
enrichment = load("av-enrichment.json")
by_name = {c["name"]: c for c in companies}

# ---------------------------------------------------------------- partners
adj = collections.defaultdict(list)
kind_totals = collections.Counter()
for e in enrichment["edges"]:
    kind_totals[e["k"]] += 1
    adj[e["a"]].append({"partner": e["b"], "k": e["k"], "n": e.get("n", "")})
    adj[e["b"]].append({"partner": e["a"], "k": e["k"], "n": e.get("n", "")})

partners = {}
for name, lst in sorted(adj.items()):
    seen, out = set(), []
    for p in sorted(lst, key=lambda p: (p["k"], p["partner"])):
        key = (p["partner"], p["k"])
        if key in seen: continue
        seen.add(key)
        c = by_name.get(p["partner"], {})
        out.append({**p, "slug": c.get("slug", ""), "cat": c.get("cat", "")})
    partners[by_name[name]["slug"]] = {
        "name": name, "count": len({p["partner"] for p in out}), "partners": out,
    }

mapped = len(adj)
partner_index = {
    "meta": {
        "generatedBy": "tools/build-indexes.py",
        "edgeCount": len(enrichment["edges"]),
        "companiesWithPartners": mapped,
        "companiesWithout": len(companies) - mapped,
        "kinds": dict(kind_totals.most_common()),
    },
    "bySlug": partners,
}

# ---------------------------------------------------------------- counts
MEDALLION = set(enrichment["operators"])
STAGES = {  # which layers dock at which loop station; medallion excluded
    "request": ["Demand & Commercial Platforms"],
    "driver": ["AV Driver / Autonomy Software", "Sensing & Compute Hardware",
               "Data, Maps & Simulation", "AV Middleware & Tooling",
               "Connectivity & Infrastructure"],
    "vehicle": ["Vehicle Platform & Manufacturing"],
    "pitlane": ["Fleet Operations & Depot"],
    "across": ["Capital, Insurance & Risk", "Governance: Regulators & Government",
               "Governance: Standards, Safety & Advocacy"],
}

layer_counts = collections.Counter()
region_counts = collections.Counter()
maturity_counts = collections.Counter()
status_counts = collections.Counter()
for c in companies:
    layer_counts[c["cat"]] += 1
    region_counts[c.get("region") or "Unspecified"] += 1
    maturity_counts[c.get("opMaturity") or "Unspecified"] += 1
    status_counts[c["status"]] += 1

def stage_count(layers):
    return sum(1 for c in companies
               if c["cat"] in layers and c["name"] not in MEDALLION)

derived = {
    "meta": {"generatedBy": "tools/build-indexes.py",
             "companyCount": len(companies), "medallion": sorted(MEDALLION)},
    "layers": dict(layer_counts.most_common()),
    "regions": dict(region_counts.most_common()),
    "status": dict(status_counts.most_common()),
    "maturityTop": dict(maturity_counts.most_common(12)),
    "stations": {k: stage_count(v) for k, v in STAGES.items()},
    "gaps": {
        "companies": len(companies),
        "withMappedPartners": mapped,
        "withoutMappedPartners": len(companies) - mapped,
        "mappedEdges": len(enrichment["edges"]),
        "withDomain": len(enrichment.get("domains", {})),
        "withDisclosedFunding": sum(1 for c in companies if c.get("fundingUSD")),
        "spokenTo": sum(1 for c in companies if c.get("spokenTo")),
    },
}

# slim index for the header search on every page and the wall-chart filters:
# ~1/8 the size of the full dataset. 125 raw opMaturity strings collapse into
# seven buckets here so the filter UI stays legible.
def maturity_bucket(c):
    if c["status"] != "active": return "Historical"
    m = (c.get("opMaturity") or "").lower()
    if "historical" in m: return "Historical"
    if any(k in m for k in ("regulat", "standard", "association", "advocacy", "regime", "policy")):
        return "Governance"
    if "commercial-scaled" in m or "production" in m or "scaled" in m: return "Scaled"
    if "commercial" in m: return "Commercial"
    if any(k in m for k in ("pilot", "trial", "test", "commercializ")): return "Pilot"
    if any(k in m for k in ("r&d", "research", "develop", "announc", "concept", "pre-")):
        return "R&D"
    return "Other"

domains = enrichment.get("domains", {})
search = [{"n": c["name"], "s": c["slug"], "c": c["cat"],
           "b": (c.get("sub") or "")[:80],
           "r": c.get("region", ""), "m": maturity_bucket(c),
           # domain travels with the index so the browser can load a real logo
           # without a build step; see assets/js/poster.js
           **({"d": domains[c["name"]]} if c["name"] in domains else {}),
           **({"x": 1} if c["status"] != "active" else {}),
           **({"g": 1} if c.get("spokenTo") else {})}
          for c in companies]

dump(partner_index, "partner-index.json")
dump(derived, "derived-counts.json")
dump(search, "search-index.json")
print("stations:", derived["stations"])
print("gaps:", derived["gaps"])
