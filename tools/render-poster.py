#!/usr/bin/env python3
"""
render-poster.py :: render data/poster-layout.json to a standalone reference SVG.

This is the *proofing* renderer, not the production one. The site renders the same
layout.json in the browser so chips stay interactive; this script exists so the
geometry can be eyeballed, printed and diffed without opening a browser.

    python3 tools/render-poster.py            # monogram tiles only
    python3 tools/render-poster.py --logos    # embed assets/logos/*.svg where present
"""
import json, os, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(os.path.join(ROOT, "data", "poster-layout.json"), encoding="utf-8"))
ENR = json.load(open(os.path.join(ROOT, "data", "av-enrichment.json"), encoding="utf-8"))
KNOWN = ENR.get("known", {})
USE_LOGOS = "--logos" in sys.argv
m = L["meta"]
MS = m["medStyle"]

INK, PAPER, CARD, RULE, MUTED = "#12130F", "#FAFAF7", "#FFFFFF", "#DEDFD8", "#6E7268"
YELLOW, CYAN, MEDSUB = "#F2B705", "#00A5B8", "#B9BCB2"

def oklch(hue, l=0.62, c=0.075): return f"oklch({l} {c} {hue})"
def esc(s): return html.escape(str(s), quote=True)

def wrap(name, maxchars=15, maxlines=2):
    words, lines, cur = str(name).split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) <= maxchars: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
            if len(lines) == maxlines: break
    if cur and len(lines) < maxlines: lines.append(cur)
    if len(lines) == maxlines and len(" ".join(words)) > sum(len(x) for x in lines) + len(lines):
        lines[-1] = lines[-1][:maxchars - 1] + "…"
    return lines[:maxlines]

def panel_path(d, r=18):
    """Root side square so it sits flush against the hexagon, outer corners rounded."""
    x, w, h, out = d["x"], d["w"], d["h"], d["out"]
    if out > 0:
        return (f'M {x} 0 L {x+w} 0 L {x+w} {h-r} Q {x+w} {h} {x+w-r} {h} '
                f'L {x+r} {h} Q {x} {h} {x} {h-r} Z')
    return (f'M {x} 0 L {x} {-(h-r)} Q {x} {-h} {x+r} {-h} '
            f'L {x+w-r} {-h} Q {x+w} {-h} {x+w} {-(h-r)} L {x+w} 0 Z')

o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m["width"]} {m["height"]}" '
         f'width="{m["width"]}" height="{m["height"]}" font-family="Archivo, Helvetica, Arial, sans-serif">')
o.append(f'<rect width="{m["width"]}" height="{m["height"]}" fill="{PAPER}"/>')

# --- districts: rotated panels docked on the hexagon's six borders -------
for d in L["districts"]:
    col = oklch(d["hue"])
    out, hh = d["out"], d["headerH"]
    hy = 0 if out > 0 else -hh                      # header band, local top
    ty = 132 if out > 0 else -78                    # header baseline
    o.append(f'<g transform="translate({d["ox"]},{d["oy"]}) rotate({d["rot"]})">')
    o.append(f'<path d="{panel_path(d)}" fill="{CARD}" stroke="{RULE}" stroke-width="2"/>')
    o.append(f'<path d="{panel_path(d)}" fill="{col}" opacity=".05"/>')
    o.append(f'<rect x="{d["x"]}" y="{hy}" width="{d["w"]}" height="{hh}" fill="{col}" opacity=".13"/>')
    o.append(f'<rect x="{d["x"]}" y="{hy + (hh - 9 if out > 0 else 0)}" width="{d["w"]}" '
             f'height="9" fill="{col}"/>')
    label = d["layer"].replace("Governance: ", "")
    o.append(f'<text x="{d["x"]+30}" y="{ty}" font-size="40" font-weight="700" '
             f'fill="{INK}">{esc(label.upper())}</text>')
    o.append(f'<text x="{d["x"]+d["w"]-30}" y="{ty}" font-size="40" font-weight="600" '
             f'text-anchor="end" font-family="IBM Plex Mono, monospace" fill="{col}">{d["count"]}</text>')
    o.append('</g>')

# --- chips: upright tiles on each panel's rotated lattice ---------------
for c in L["chips"]:
    cx, cy = c["x"] + c["w"] / 2, c["y"]
    col = oklch(c["hue"], 0.66, 0.06)
    o.append(f'<g class="chip" data-slug="{esc(c["slug"])}">')
    o.append(f'<rect x="{c["x"]+8}" y="{c["y"]+6}" width="{c["w"]-16}" height="{c["h"]-12}" '
             f'rx="12" fill="{PAPER}" stroke="{RULE}"/>')
    logo = os.path.join(ROOT, "assets", "logos", c["slug"] + ".svg")
    if USE_LOGOS and os.path.exists(logo):
        o.append(f'<image href="assets/logos/{esc(c["slug"])}.svg" x="{cx-36:.0f}" '
                 f'y="{cy+18}" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>')
    else:
        o.append(f'<rect x="{cx-36:.0f}" y="{cy+18}" width="72" height="72" rx="16" fill="{col}"/>')
        o.append(f'<text x="{cx:.0f}" y="{cy+68}" font-size="34" font-weight="800" '
                 f'text-anchor="middle" fill="#FFFFFF">{esc(c["mono"])}</text>')
    for i, ln in enumerate(wrap(c["name"])):
        o.append(f'<text x="{cx:.0f}" y="{cy+112+i*20}" font-size="17" text-anchor="middle" '
                 f'fill="{INK}">{esc(ln)}</text>')
    if c["exited"]:
        o.append(f'<line x1="{c["x"]+14}" y1="{c["y"]+12}" x2="{c["x"]+c["w"]-14}" '
                 f'y2="{c["y"]+c["h"]-18}" stroke="{MUTED}" stroke-width="2" opacity=".5"/>')
    if c["spokenTo"]:
        o.append(f'<circle cx="{c["x"]+c["w"]-22}" cy="{c["y"]+20}" r="6" fill="{YELLOW}"/>')
    o.append('</g>')

# --- the hexagon, and the ten inside it ---------------------------------
hx = L["hex"]
pts = " ".join(f'{x},{y}' for x, y in hx["points"])
o.append(f'<polygon points="{pts}" fill="{INK}"/>')
o.append(f'<polygon points="{pts}" fill="none" stroke="{YELLOW}" stroke-width="14"/>')
o.append(f'<text x="{hx["cx"]}" y="{hx["titleY"]}" font-size="86" font-weight="900" '
         f'letter-spacing="18" text-anchor="middle" fill="{PAPER}">{esc(hx["title"])}</text>')
o.append(f'<text x="{hx["cx"]}" y="{hx["subY"]}" font-size="28" text-anchor="middle" '
         f'fill="{YELLOW}" font-family="IBM Plex Mono, monospace" letter-spacing="4">'
         f'{esc(hx["sub"])}</text>')
for c in L["medallion"]:
    cx = c["x"] + c["w"] / 2
    half = MS["logo"] / 2
    o.append(f'<g class="op" data-slug="{esc(c["slug"])}">')
    logo = os.path.join(ROOT, "assets", "logos", c["slug"] + ".svg")
    if USE_LOGOS and os.path.exists(logo):
        o.append(f'<image href="assets/logos/{esc(c["slug"])}.svg" x="{cx-half:.0f}" '
                 f'y="{c["y"]+MS["logoY"]:.0f}" width="{MS["logo"]}" height="{MS["logo"]}" '
                 f'preserveAspectRatio="xMidYMid meet"/>')
    else:
        o.append(f'<rect x="{cx-half:.0f}" y="{c["y"]+MS["logoY"]:.0f}" width="{MS["logo"]}" '
                 f'height="{MS["logo"]}" rx="36" fill="{PAPER}"/>')
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["logoY"]+MS["logo"]*0.68:.0f}" font-size="80" '
                 f'font-weight="900" text-anchor="middle" fill="{INK}">{esc(c["mono"])}</text>')
    o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["nameY"]:.0f}" font-size="{MS["nameSize"]}" '
             f'font-weight="700" text-anchor="middle" fill="{PAPER}">{esc(c["name"])}</text>')
    # The space under an operator name is the most valuable on the poster. It carries
    # the one claim that earns that company its place in the centre.
    claim = KNOWN.get(c["name"], "")
    for j, ln in enumerate(wrap(claim, maxchars=MS["claimChars"], maxlines=4)):
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["claimY"]+j*MS["claimStep"]:.0f}" '
                 f'font-size="{MS["claimSize"]}" text-anchor="middle" fill="{MEDSUB}">{esc(ln)}</text>')
    o.append('</g>')
o.append(f'<line x1="{hx["cx"]-520}" y1="{hx["ruleY"]}" x2="{hx["cx"]+520}" y2="{hx["ruleY"]}" '
         f'stroke="{MEDSUB}" stroke-width="2" opacity=".4"/>')
o.append(f'<text x="{hx["cx"]}" y="{hx["footY"]}" font-size="24" text-anchor="middle" '
         f'fill="{MEDSUB}" font-family="IBM Plex Mono, monospace" letter-spacing="3">'
         f'{esc(hx["foot"])}</text>')

o.append(f'<text x="{m["margin"]}" y="{m["height"]-70}" font-size="30" font-weight="700" '
         f'fill="{INK}">AUTONOMOUS VEHICLE ECOSYSTEM MAP</text>')
o.append(f'<text x="{m["width"]-m["margin"]}" y="{m["height"]-70}" font-size="26" text-anchor="end" '
         f'font-family="IBM Plex Mono, monospace" fill="{MUTED}">'
         f'{m["companyCount"]} ORGANISATIONS · 11 LAYERS · COMPILED BY KOFI AGYARE-KWABI</text>')
o.append('</svg>')

dest = os.path.join(ROOT, "poster-reference.svg")
open(dest, "w", encoding="utf-8").write("\n".join(o))
print(f"wrote {os.path.relpath(dest, ROOT)}  ({len(L['chips'])+len(L['medallion'])} tiles, "
      f"{m['width']}x{m['height']})")
