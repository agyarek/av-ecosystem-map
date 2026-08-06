#!/usr/bin/env python3
"""bake-static.py :: bake the organisation index into the served HTML.

Not one company name existed in the HTML before this: everything hydrated from
JSON, so a reader without JavaScript got an empty shell and a crawler got
nothing. This writes three baked surfaces, each between explicit markers that
survive regeneration:

    index.html            noscript org index, grouped by layer
    map/index.html        noscript org index, grouped by layer
    companies/index.html  a real static thead and 562 static rows in the
                          table itself; ledger.js replaces them with the
                          interactive table when it boots

Operators link to their own pages; every other organisation links to its
directory row via the row's id (org-<slug>), which works with JavaScript off.

Run after tools/build-indexes.py (order is encoded in tools/build-all.sh):

    python3 tools/bake-static.py
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))

LAYER_ORDER = [
    "AV Driver / Autonomy Software", "Sensing & Compute Hardware",
    "Data, Maps & Simulation", "AV Middleware & Tooling",
    "Vehicle Platform & Manufacturing", "Demand & Commercial Platforms",
    "Fleet Operations & Depot", "Connectivity & Infrastructure",
    "Capital, Insurance & Risk", "Governance: Regulators & Government",
    "Governance: Standards, Safety & Advocacy",
]

def esc(s):
    return html.escape(str(s or ""), quote=True)

def replace_between(text, name, new_inner, path):
    open_m = f"<!-- bake:{name} -->"
    close_m = f"<!-- /bake:{name} -->"
    pat = re.compile(re.escape(open_m) + r".*?" + re.escape(close_m), re.S)
    if not pat.search(text):
        sys.exit(f"FATAL: {path} has no {open_m} markers")
    return pat.sub(open_m + "\n" + new_inner + "\n" + close_m, text)

def org_index_html(companies, operators, prefix):
    """The layer-grouped index used by the noscript surfaces."""
    by_layer = {}
    for c in companies:
        by_layer.setdefault(c["cat"], []).append(c)
    op_names = set(operators)

    def link(c):
        if c["name"] in op_names:
            return f'<a href="{prefix}companies/{esc(c["slug"])}/">{esc(c["name"])}</a>'
        return f'<a href="{prefix}companies/#org-{esc(c["slug"])}">{esc(c["name"])}</a>'

    out = ['<div class="ns-index">']
    out.append(
        f'<p class="note">The chart is drawn by JavaScript, but the industry itself is plain text: '
        f'all {len(companies)} organisations, grouped by layer. The passenger-autonomy operators link '
        f'to their own pages; every other organisation links to its row in the '
        f'<a href="{prefix}companies/">directory</a>.</p>')
    ops = [c for c in companies if c["name"] in op_names]
    out.append(f'<section><h2>Passenger autonomy <span class="ns-n">{len(ops)}</span></h2><ul>')
    out += [f"<li>{link(c)}</li>" for c in sorted(ops, key=lambda c: c["name"].lower())]
    out.append("</ul></section>")
    for layer in LAYER_ORDER:
        rows = [c for c in by_layer.get(layer, []) if c["name"] not in op_names]
        if not rows:
            continue
        title = layer.replace("Governance: ", "")
        out.append(f'<section><h2>{esc(title)} <span class="ns-n">{len(rows)}</span></h2><ul>')
        out += [f"<li>{link(c)}</li>" for c in sorted(rows, key=lambda c: c["name"].lower())]
        out.append("</ul></section>")
    out.append("</div>")
    return "\n".join(out)

def directory_rows_html(companies, operators):
    op_names = set(operators)
    rows = []
    for c in sorted(companies, key=lambda c: c["name"].lower()):
        name = (f'<a href="{esc(c["slug"])}/">{esc(c["name"])}</a>'
                if c["name"] in op_names else esc(c["name"]))
        rows.append(
            f'<tr id="org-{esc(c["slug"])}"><th scope="row">{name}</th>'
            f'<td>{esc(c["cat"].replace("Governance: ", ""))}</td>'
            f'<td>{esc(c.get("region", ""))}</td>'
            f'<td>{esc(c.get("opMaturity", ""))}</td>'
            f'<td>{esc(c.get("sub", ""))}</td></tr>')
    return "\n".join(rows)

def main():
    companies = load("av-companies.json")
    operators = load("derived-counts.json")["meta"]["medallion"]

    targets = [
        ("index.html", "org-index", org_index_html(companies, operators, "")),
        (os.path.join("map", "index.html"), "org-index",
         org_index_html(companies, operators, "../")),
        (os.path.join("companies", "index.html"), "directory-head",
         '<tr><th scope="col">Organisation</th><th scope="col">Layer</th>'
         '<th scope="col">Region</th><th scope="col">Maturity</th>'
         '<th scope="col">Focus</th></tr>'),
        (os.path.join("companies", "index.html"), "directory-rows",
         directory_rows_html(companies, operators)),
    ]
    for rel, marker, inner in targets:
        if "—" in inner:
            sys.exit(f"FATAL: an em-dash slipped into the {marker} bake")
        path = os.path.join(ROOT, rel)
        text = open(path, encoding="utf-8").read()
        text = replace_between(text, marker, inner, rel)
        open(path, "w", encoding="utf-8").write(text)
        print(f"baked {marker:>15} into {rel}")

if __name__ == "__main__":
    main()
