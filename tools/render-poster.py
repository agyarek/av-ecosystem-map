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
PL = m["plate"]

INK, PAPER, CARD, RULE, MUTED = "#12130F", "#FAFAF7", "#FFFFFF", "#DEDFD8", "#6E7268"
YELLOW, CYAN, MEDSUB = "#F2B705", "#00A5B8", "#B9BCB2"

def oklch(hue, l=0.62, c=0.075): return f"oklch({l} {c} {hue})"
def esc(s): return html.escape(str(s), quote=True)
def pts(poly): return " ".join(f"{x},{y}" for x, y in poly)

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

o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {m["width"]} {m["height"]}" '
         f'width="{m["width"]}" height="{m["height"]}" font-family="Archivo, Helvetica, Arial, sans-serif">')
o.append(f'<defs><clipPath id="plate"><rect x="{PL["x"]}" y="{PL["y"]}" width="{PL["w"]}" '
         f'height="{PL["h"]}" rx="{PL["rx"]}"/></clipPath></defs>')
o.append(f'<rect width="{m["width"]}" height="{m["height"]}" fill="{PAPER}"/>')
o.append(f'<rect x="{PL["x"]}" y="{PL["y"]}" width="{PL["w"]}" height="{PL["h"]}" '
         f'rx="{PL["rx"]}" fill="{CARD}"/>')

# --- districts: one plate, ten rooms, every border shared -----------------
o.append(f'<defs>' + "".join(
    f'<clipPath id="d-{esc(d["id"])}"><polygon points="{pts(d["poly"])}"/></clipPath>'
    for d in L["districts"]) + '</defs>')
o.append('<g clip-path="url(#plate)">')
for d in L["districts"]:
    col = oklch(d["hue"])
    hd = d["header"]
    o.append(f'<polygon points="{pts(d["poly"])}" fill="{col}" opacity=".05"/>')
    # the header band runs the district's full width and is cut by its own outline
    o.append(f'<g clip-path="url(#d-{esc(d["id"])})">')
    o.append(f'<rect x="{hd["x"]}" y="{hd["y"]}" width="{hd["w"]}" height="{hd["h"]}" '
             f'fill="{col}" opacity=".13"/>')
    o.append(f'<rect x="{hd["x"]}" y="{hd["y"]+hd["h"]-9}" width="{hd["w"]}" height="9" fill="{col}"/>')
    o.append('</g>')
    size = d["labelSize"]
    n = len(d["labelLines"])
    base = hd["y"] + hd["h"] / 2 + size * 0.36 - (size * 0.62 * (n - 1)) / 2
    for i, line in enumerate(d["labelLines"]):
        o.append(f'<text x="{hd["tx"]+30}" y="{base + i*size*1.06:.0f}" font-size="{size}" '
                 f'font-weight="700" fill="{INK}">{esc(line)}</text>')
    o.append(f'<text x="{hd["tx"]+hd["tw"]-30}" y="{hd["y"]+hd["h"]/2+size*0.36:.0f}" '
             f'font-size="{size}" font-weight="600" text-anchor="end" '
             f'font-family="IBM Plex Mono, monospace" fill="{col}">{d["count"]}</text>')
    o.append(f'<polygon points="{pts(d["poly"])}" fill="none" stroke="{RULE}" stroke-width="3"/>')
o.append('</g>')

# --- chips ---------------------------------------------------------------
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

# --- the octagon, and the ten inside it ----------------------------------
oc = L["oct"]
o.append(f'<polygon points="{pts(oc["points"])}" fill="{INK}"/>')
o.append(f'<polygon points="{pts(oc["points"])}" fill="none" stroke="{YELLOW}" stroke-width="14"/>')
o.append(f'<text x="{oc["cx"]}" y="{oc["titleY"]}" font-size="86" font-weight="900" '
         f'letter-spacing="18" text-anchor="middle" fill="{PAPER}">{esc(oc["title"])}</text>')
o.append(f'<text x="{oc["cx"]}" y="{oc["subY"]}" font-size="28" text-anchor="middle" '
         f'fill="{YELLOW}" font-family="IBM Plex Mono, monospace" letter-spacing="4">'
         f'{esc(oc["sub"])}</text>')
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
o.append(f'<line x1="{oc["cx"]-520}" y1="{oc["ruleY"]}" x2="{oc["cx"]+520}" y2="{oc["ruleY"]}" '
         f'stroke="{MEDSUB}" stroke-width="2" opacity=".4"/>')
o.append(f'<text x="{oc["cx"]}" y="{oc["footY"]}" font-size="24" text-anchor="middle" '
         f'fill="{MEDSUB}" font-family="IBM Plex Mono, monospace" letter-spacing="3">'
         f'{esc(oc["foot"])}</text>')

o.append(f'<text x="{PL["x"]}" y="{m["height"]-70}" font-size="30" font-weight="700" '
         f'fill="{INK}">AUTONOMOUS VEHICLE ECOSYSTEM MAP</text>')
o.append(f'<text x="{PL["x"]+PL["w"]}" y="{m["height"]-70}" font-size="26" text-anchor="end" '
         f'font-family="IBM Plex Mono, monospace" fill="{MUTED}">'
         f'{m["companyCount"]} ORGANISATIONS · 11 LAYERS · COMPILED BY KOFI AGYARE-KWABI</text>')
o.append('</svg>')

dest = os.path.join(ROOT, "poster-reference.svg")
open(dest, "w", encoding="utf-8").write("\n".join(o))
print(f"wrote {os.path.relpath(dest, ROOT)}  ({len(L['chips'])+len(L['medallion'])} tiles, "
      f"{m['width']}x{m['height']})")
