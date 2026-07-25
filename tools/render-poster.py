#!/usr/bin/env python3
"""
render-poster.py — render data/poster-layout.json to a standalone reference SVG.

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

INK, PAPER, RULE, MUTED = "#12130F", "#FAFAF7", "#DEDFD8", "#6E7268"
YELLOW, CYAN = "#F2B705", "#00A5B8"

def oklch(hue, l=0.62, c=0.075): return f"oklch({l} {c} {hue})"
def esc(s): return html.escape(str(s), quote=True)

def wrap(name, maxchars=15, maxlines=2):
    words, lines, cur = name.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) <= maxchars: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
            if len(lines) == maxlines: break
    if cur and len(lines) < maxlines: lines.append(cur)
    if len(lines) == maxlines and len(" ".join(words)) > sum(len(x) for x in lines) + len(lines):
        lines[-1] = lines[-1][:maxchars - 1] + "\u2026"
    return lines[:maxlines]

o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m["width"]} {m["height"]}" '
         f'width="{m["width"]}" height="{m["height"]}" font-family="Archivo, Helvetica, Arial, sans-serif">')
o.append(f'<rect width="{m["width"]}" height="{m["height"]}" fill="{PAPER}"/>')

# --- bands -------------------------------------------------------------
for b in L["bands"]:
    ty = b["y"] + b["labelH"] * 0.66
    o.append(f'<text x="{b["x"]}" y="{ty:.0f}" font-size="52" font-weight="800" '
             f'letter-spacing="6" fill="{INK}">{esc(b["label"])}</text>')
    o.append(f'<text x="{b["x"]+ b["w"]}" y="{ty:.0f}" font-size="30" text-anchor="end" '
             f'fill="{MUTED}" font-style="italic">{esc(b["note"])}</text>')
    o.append(f'<line x1="{b["x"]}" y1="{b["y"]+b["labelH"]-14}" x2="{b["x"]+b["w"]}" '
             f'y2="{b["y"]+b["labelH"]-14}" stroke="{INK}" stroke-width="4"/>')

# --- districts ---------------------------------------------------------
for d in L["districts"]:
    col = oklch(d["hue"])
    o.append(f'<rect x="{d["x"]+6}" y="{d["y"]+6}" width="{d["w"]-12}" height="{d["h"]-12}" '
             f'rx="14" fill="#FFFFFF" stroke="{RULE}" stroke-width="2"/>')
    o.append(f'<rect x="{d["x"]+6}" y="{d["y"]+6}" width="{d["w"]-12}" height="8" rx="4" fill="{col}"/>')
    label = d["layer"].replace("Governance: ", "")
    o.append(f'<text x="{d["x"]+26}" y="{d["y"]+d["headerH"]*0.72:.0f}" font-size="34" '
             f'font-weight="700" fill="{INK}">{esc(label.upper())}</text>')
    o.append(f'<text x="{d["x"]+d["w"]-26}" y="{d["y"]+d["headerH"]*0.72:.0f}" font-size="34" '
             f'font-weight="600" text-anchor="end" font-family="IBM Plex Mono, monospace" '
             f'fill="{col}">{d["count"]}</text>')

# --- chips -------------------------------------------------------------
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

# --- medallion ---------------------------------------------------------
mb = m["medallionBox"]
o.append(f'<rect x="{mb["x"]+6}" y="{mb["y"]+6}" width="{mb["w"]-12}" height="{mb["h"]-12}" '
         f'rx="20" fill="{INK}"/>')
o.append(f'<text x="{mb["x"]+mb["w"]/2:.0f}" y="{mb["y"]+108}" font-size="60" font-weight="900" '
         f'letter-spacing="14" text-anchor="middle" fill="{PAPER}">THE TEN</text>')
o.append(f'<text x="{mb["x"]+mb["w"]/2:.0f}" y="{mb["y"]+150}" font-size="26" text-anchor="middle" '
         f'fill="{YELLOW}" font-family="IBM Plex Mono, monospace" letter-spacing="3">'
         f'OPERATORS A PASSENGER CAN ACTUALLY MEET</text>')
for c in L["medallion"]:
    cx = c["x"] + c["w"] / 2
    o.append(f'<g class="op" data-slug="{esc(c["slug"])}">')
    logo = os.path.join(ROOT, "assets", "logos", c["slug"] + ".svg")
    if USE_LOGOS and os.path.exists(logo):
        o.append(f'<image href="assets/logos/{esc(c["slug"])}.svg" x="{cx-68:.0f}" '
                 f'y="{c["y"]+70:.0f}" width="136" height="136" preserveAspectRatio="xMidYMid meet"/>')
    else:
        o.append(f'<rect x="{cx-68:.0f}" y="{c["y"]+70:.0f}" width="136" height="136" rx="28" '
                 f'fill="{PAPER}"/>')
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+164:.0f}" font-size="62" font-weight="900" '
                 f'text-anchor="middle" fill="{INK}">{esc(c["mono"])}</text>')
    o.append(f'<text x="{cx:.0f}" y="{c["y"]+248:.0f}" font-size="31" font-weight="700" '
             f'text-anchor="middle" fill="{PAPER}">{esc(c["name"])}</text>')
    # The dead space under an operator name is the most valuable real estate on the
    # poster. It carries the one claim that earns that company its place in the centre.
    claim = KNOWN.get(c["name"], "")
    for j, ln in enumerate(wrap(claim, maxchars=30, maxlines=4)):
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+292+j*26:.0f}" font-size="19" '
                 f'text-anchor="middle" fill="#B9BCB2">{esc(ln)}</text>')
    o.append('</g>')

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
