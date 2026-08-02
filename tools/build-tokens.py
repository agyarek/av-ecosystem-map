#!/usr/bin/env python3
"""Generate design/tokens.css (and the token block in assets/css/base.css) from
design/design-tokens.json, verifying the contrast assertions on every run.

Usage:
  python3 tools/build-tokens.py            # write design/tokens.css, verify contrast
  python3 tools/build-tokens.py --inject   # also replace the marked block in assets/css/base.css

The JSON is the single source of truth. Never hand-edit the generated output.
"""
import json, math, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKENS = os.path.join(ROOT, "design", "design-tokens.json")
OUT_CSS = os.path.join(ROOT, "design", "tokens.css")
BASE_CSS = os.path.join(ROOT, "assets", "css", "base.css")
BEGIN = "/* == tokens:begin — generated from design/design-tokens.json by tools/build-tokens.py; do not hand-edit == */"
END = "/* == tokens:end == */"


def luminance(hexs):
    h = hexs.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def walk_css_tokens(node, out):
    """Collect every {css, value} leaf under a dict tree."""
    if isinstance(node, dict):
        if "css" in node and "value" in node:
            out.append((node["css"], node["value"]))
        else:
            for k, v in node.items():
                if not k.startswith("$"):
                    walk_css_tokens(v, out)


def build():
    with open(TOKENS) as f:
        t = json.load(f)

    # --- contrast gate -------------------------------------------------
    failures, pending = [], []
    for theme in ("light", "dark"):
        for row in t["contrastAssertions"][theme]:
            fg, bg, floor, note = row[0], row[1], row[2], row[3]
            flag = row[4] if len(row) > 4 else ""
            ratio = contrast(fg, bg)
            line = f"[{theme}] {note}: {fg} on {bg} = {ratio:.2f} (min {floor})"
            if ratio < floor:
                (pending if flag.startswith("pending") else failures).append(f"{line} {flag}")
    if failures:
        print("CONTRAST FAILURES:\n  " + "\n  ".join(failures))
        sys.exit(1)
    for p in pending:
        print(f"PENDING (known, tracked): {p}")

    # --- assemble css --------------------------------------------------
    def theme_lines(theme):
        lines = []
        c = t["color"][theme]
        toks = []
        walk_css_tokens(c, toks)
        lines += [f"  {css}: {val};" for css, val in toks]
        lay = t["color"]["layer"]
        lc = lay[theme]
        lines.append(f"  --layer-l: {lc['layerL']}; --layer-c: {lc['layerC']}; --tile-l: {lc['tileL']}; --tile-c: {lc['tileC']};")
        ch = t["color"]["chart"][theme]
        lines.append("  " + " ".join(f"--chart-{i+1}: {c};" for i, c in enumerate(ch)))
        lines.append(f"  --scrim: {t['color']['scrim'][theme]['value']};")
        return lines

    shared = []
    hues = t["color"]["layer"]["hues"]
    shared.append("  " + " ".join(f"--h-{k}: {v};" for k, v in hues.items()))
    for section in ("type", "space", "layout", "radius", "shadow", "motion", "z"):
        toks = []
        walk_css_tokens(t[section], toks)
        shared += [f"  {css}: {val};" for css, val in toks]

    bp = t["breakpoint"]
    bp_doc = ", ".join(f"{k}={v['value']}" for k, v in bp.items() if not k.startswith("$"))

    css = [BEGIN]
    css.append("/* Breakpoints (media queries must use exactly these values; JS mirrors in AV.bp): " + bp_doc + " */")
    css.append(":root {")
    css += shared
    css += theme_lines("light")
    css.append("  color-scheme: light;")
    css.append("}")
    css.append(':root[data-theme="dark"] {')
    css += theme_lines("dark")
    css.append("  color-scheme: dark;")
    css.append("}")
    css.append(END)
    out = "\n".join(css) + "\n"

    with open(OUT_CSS, "w") as f:
        f.write(out)
    print(f"wrote {os.path.relpath(OUT_CSS, ROOT)} ({out.count(chr(10))} lines)")

    if "--inject" in sys.argv:
        with open(BASE_CSS) as f:
            base = f.read()
        if BEGIN in base:
            new = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), out.rstrip("\n"), base, flags=re.S)
        else:
            print("No token block markers in base.css — refusing to inject blindly. Add markers first.")
            sys.exit(1)
        with open(BASE_CSS, "w") as f:
            f.write(new)
        print(f"injected token block into {os.path.relpath(BASE_CSS, ROOT)}")


if __name__ == "__main__":
    build()
