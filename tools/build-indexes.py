#!/usr/bin/env python3
"""build-indexes.py :: freeze derived data into data/partner-index.json,
data/derived-counts.json, data/search-index.json and data/skeleton.json so no
page computes at runtime what the build can compute once.

    python3 tools/build-indexes.py

partner-index.json   per-company partner lists (with relationship type and
                     note), edge-kind totals, and the coverage numbers.
derived-counts.json  layer, region, stage, maturity and status counts, the
                     loop-station counts (medallion excluded), and the gap
                     figures published on /map/, /partnerships/ and /method/.
search-index.json    the header-search index: name, blurb, layer, flags.
                     Loaded on focus, never at boot.
skeleton.json        the boot-time slim index: one small record per
                     organisation, no prose. Budget: 60KB raw.
"""
import json, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))
def dump(obj, name, pretty=False):
    path = os.path.join(ROOT, "data", name)
    # the big indexes ship to every reader: minified. derived-counts is the one
    # humans diff in review, and it is tiny: pretty.
    kw = {"indent": 1} if pretty else {"separators": (",", ":")}
    json.dump(obj, open(path, "w", encoding="utf-8"), ensure_ascii=False, **kw)
    print("wrote", os.path.relpath(path, ROOT), os.path.getsize(path), "bytes")

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
             # the one date the footers trust: stamped when the data was last
             # rebuilt, so "updated ..." can never drift from the data again
             "generatedAt": __import__("datetime").date.today().isoformat(),
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
        # the funding page prints this total; deriving it stops it drifting from
        # the records it claims to summarise, which it already had
        "disclosedFundingUSDm": round(sum(c.get("fundingUSD") or 0 for c in companies), 1),
        "spokenTo": sum(1 for c in companies if c.get("spokenTo")),
    },
}

# slim index for the header search on every page and the ecosystem-map filters:
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
tickers = enrichment.get("tickers", {})
passenger = set(enrichment.get("passengerOperators", []))
def base_rec(c):
    return {"n": c["name"], "s": c["slug"], "c": c["cat"],
            "r": c.get("region", ""), "m": maturity_bucket(c),
            # "d" is the company site, for the card's link. Logos resolve from
            # the committed manifest, never from a domain: see core.js.
            **({"d": domains[c["name"]]} if c["name"] in domains else {}),
            # "t" is an exchange-qualified ticker (used only when a quote
            # provider is configured)
            **({"t": tickers[c["name"]]} if c["name"] in tickers else {}),
            # "p" marks the organisations that carry passengers, which is who
            # a deployment footprint is a real question for
            **({"p": 1} if c["name"] in passenger else {}),
            **({"x": 1} if c["status"] != "active" else {}),
            **({"g": 1} if c.get("spokenTo") else {}),
            # mapped-partner count, so cards and aria labels can state coverage
            # before the partner index has loaded
            **({"pc": partners[c["slug"]]["count"]} if c["slug"] in partners else {})}

# the header search wants prose to rank on; the boot skeleton wants none
search = [{**base_rec(c), "b": (c.get("sub") or "")[:80]} for c in companies]
skeleton = [base_rec(c) for c in companies]

dump(partner_index, "partner-index.json")
dump(derived, "derived-counts.json", pretty=True)
dump(search, "search-index.json")
dump(skeleton, "skeleton.json")

# per-company detail shards: what the map card fetches on selection, so a
# single click costs ~1.5KB instead of the whole 750KB dataset. The full
# av-companies.json stays untouched as the table's source and the advertised
# download.
shard_dir = os.path.join(ROOT, "data", "companies")
os.makedirs(shard_dir, exist_ok=True)
stale = {f for f in os.listdir(shard_dir) if f.endswith(".json")}
for c in companies:
    name = c["slug"] + ".json"
    stale.discard(name)
    json.dump(c, open(os.path.join(shard_dir, name), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
for f in sorted(stale):
    os.remove(os.path.join(shard_dir, f))
    print("removed stale shard", f)
print(f"wrote {len(companies)} shards to data/companies/")
print("stations:", derived["stations"])
print("gaps:", derived["gaps"])
