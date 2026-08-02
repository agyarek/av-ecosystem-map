#!/usr/bin/env python3
"""Verify that palette/breakpoint constants duplicated outside CSS stay in sync
with design/design-tokens.json, and report token-conformance violations.

Usage:
  python3 tools/check-palette-sync.py            # report everything
  python3 tools/check-palette-sync.py --strict   # exit 1 on any violation (CI/QA gate)

Checks:
  1. Python tool palettes (render-poster.py, build-minimap.py, build-social-cards.py)
     contain only hex values that exist in the token JSON (light theme — exports pin light).
  2. JS layer-hue table (core.js HUES) matches color.layer.hues.
  3. CSS @media widths use only the named breakpoint values (+.docs exceptions list).
  4. JS width literals near breakpoints match the named set.
  5. Conformance greps: raw hex / px font-size / box-shadow literals outside the
     generated token block in assets/css/*.css.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, "design", "design-tokens.json")))
STRICT = "--strict" in sys.argv
problems = []


def report(kind, msg):
    problems.append(f"[{kind}] {msg}")


def token_hexes():
    out = set()
    def walk(n):
        if isinstance(n, dict):
            v = n.get("value")
            if isinstance(v, str):
                for h in re.findall(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b", v):
                    out.add(h.upper())
            for k, x in n.items():
                if not str(k).startswith("$"):
                    walk(x)
        elif isinstance(n, list):
            for x in n:
                walk(x)
    walk(J["color"])
    # illustration constants are sanctioned
    ill = J.get("componentConstants", {}).get("illustration", {})
    for v in ill.values():
        if isinstance(v, str):
            for h in re.findall(r"#[0-9A-Fa-f]{6}\b", v):
                out.add(h.upper())
    return out


def check_python_palettes(known):
    for tool in ("render-poster.py", "build-minimap.py", "build-social-cards.py"):
        p = os.path.join(ROOT, "tools", tool)
        if not os.path.exists(p):
            continue
        src = open(p).read()
        for h in set(re.findall(r"#[0-9A-Fa-f]{6}\b", src)):
            if h.upper() not in known:
                report("py-palette", f"tools/{tool}: {h} not a token value")


def check_js_chart():
    core = open(os.path.join(ROOT, "assets", "js", "core.js")).read()
    for name, key in (("CHART_LIGHT", "light"), ("CHART_DARK", "dark")):
        m = re.search(name + r"\s*=\s*\[([^\]]*)\]", core)
        if not m:
            report("js-chart", f"core.js: {name} not found")
            continue
        js = re.findall(r"#[0-9A-Fa-f]{6}", m.group(1))
        want = J["color"]["chart"][key]
        if [h.lower() for h in js] != [h.lower() for h in want]:
            report("js-chart", f"core.js {name} != tokens.chart.{key}")


def check_js_hues():
    # core.js keys HUES by full layer display names; tokens key by slug.
    # The duplicated fact is the HUE VALUES — compare the sorted multisets.
    core = open(os.path.join(ROOT, "assets", "js", "core.js")).read()
    m = re.search(r"HUES\s*=\s*\{(.*?)\};", core, re.S)
    if not m:
        return report("js-hues", "core.js: HUES table not found")
    js = sorted(int(v) for v in re.findall(r":\s*(\d+)", m.group(1)))
    want = sorted(J["color"]["layer"]["hues"].values())
    if js != want:
        report("js-hues", f"core.js HUES values != tokens: js={js} tokens={want}")


def check_breakpoints():
    named = {str(v["value"]) for k, v in J["breakpoint"].items() if not k.startswith("$")}
    # min-width complements sit at named+1 so ranges do not overlap
    named |= {str(int(v) + 1) for v in set(named)}
    # sanctioned non-breakpoint queries
    ok_extra = {"560"}  # landscape-phone max-height guard uses height, filtered below
    for fn in sorted(os.listdir(os.path.join(ROOT, "assets", "css"))):
        if not fn.endswith(".css"):
            continue
        src = open(os.path.join(ROOT, "assets", "css", fn)).read()
        for q in re.findall(r"@media[^\{]+", src):
            for w in re.findall(r"(?:min|max)-width:\s*(\d+)px", q):
                if w not in named:
                    report("css-bp", f"assets/css/{fn}: @media width {w}px not in named set {sorted(named)}")
    for fn in sorted(os.listdir(os.path.join(ROOT, "assets", "js"))):
        if not fn.endswith(".js"):
            continue
        src = open(os.path.join(ROOT, "assets", "js", fn)).read()
        for w in set(re.findall(r"(?:innerWidth|matchMedia\([^)]*width:\s*)[^0-9]*(\d{3,4})", src)):
            if w not in named and 300 <= int(w) <= 2000:
                report("js-bp", f"assets/js/{fn}: width literal {w} not in named set")


def check_css_conformance():
    begin, end = "/* == tokens:begin", "/* == tokens:end == */"
    for fn in sorted(os.listdir(os.path.join(ROOT, "assets", "css"))):
        if not fn.endswith(".css"):
            continue
        src = open(os.path.join(ROOT, "assets", "css", fn)).read()
        if begin in src:
            src = re.sub(re.escape(begin) + r".*?" + re.escape(end), lambda m: "\n" * m.group(0).count("\n"), src, flags=re.S)
        for i, line in enumerate(src.splitlines(), 1):
            if "tokens-exempt" in line:
                continue
            for h in re.findall(r"#[0-9A-Fa-f]{3,6}\b", line):
                report("css-hex", f"assets/css/{fn}:{i}: literal {h}")
            m = re.search(r"font-size:\s*([\d.]+)px", line)
            if m:
                report("css-fs", f"assets/css/{fn}:{i}: literal font-size {m.group(1)}px")
            if re.search(r"box-shadow:[^;]*rgba?\(", line):
                report("css-shadow", f"assets/css/{fn}:{i}: literal box-shadow")


known = token_hexes()
check_python_palettes(known)
check_js_hues()
check_js_chart()
check_breakpoints()
check_css_conformance()

if problems:
    counts = {}
    for p in problems:
        k = p.split("]")[0].lstrip("[")
        counts[k] = counts.get(k, 0) + 1
    print(f"{len(problems)} violations: " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    for p in problems:
        print("  " + p)
    sys.exit(1 if STRICT else 0)
print("palette/breakpoint/conformance: all in sync")
