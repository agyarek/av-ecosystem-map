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
CS = m["chipStyle"]
PL = m["plate"]

INK, PAPER, CARD, RULE, MUTED = "#12130F", "#FAFAF7", "#FFFFFF", "#DEDFD8", "#6E7268"
YELLOW, CYAN, MED, MEDSUB = "#F2B705", "#00A5B8", "#F4F2E9", "#6E7268"

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
    # no header band: the heading sits on the same ground as the tiles, the
    # hue bar alone marks where it ends — mirrored from poster.js
    o.append(f'<g clip-path="url(#d-{esc(d["id"])})">')
    o.append(f'<rect x="{hd["x"]}" y="{hd["y"]+hd["h"]-9}" width="{hd["w"]}" height="9" fill="{col}"/>')
    o.append('</g>')
    size = d["labelSize"]
    n = len(d["labelLines"])
    narrow = hd["tw"] < 1100 and n > 1
    base = hd["y"] + 100
    for i, line in enumerate(d["labelLines"]):
        o.append(f'<text x="{hd["tx"]+30}" y="{base + i*size*1.06:.0f}" font-size="{size}" '
                 f'font-weight="700" fill="{INK}">{esc(line)}</text>')
    desc_base = base + n * size * 1.06
    if narrow:
        o.append(f'<text x="{hd["tx"]+30}" y="{desc_base:.0f}" font-size="{size*0.8:.0f}" '
                 f'font-weight="600" font-family="IBM Plex Mono, monospace" '
                 f'fill="{col}">{d["count"]} orgs</text>')
        desc_base += size * 0.9
    else:
        o.append(f'<text x="{hd["tx"]+hd["tw"]-30}" y="{base:.0f}" '
                 f'font-size="{size}" font-weight="600" text-anchor="end" '
                 f'font-family="IBM Plex Mono, monospace" fill="{col}">{d["count"]} orgs</text>')
    for i, line in enumerate(d.get("desc", [])):
        o.append(f'<text x="{hd["tx"]+30}" y="{desc_base + i*(d["descSize"]+6):.0f}" '
                 f'font-size="{d["descSize"]}" font-family="IBM Plex Mono, monospace" '
                 f'letter-spacing="2" fill="{MUTED}">{esc(line)}</text>')
    o.append(f'<polygon points="{pts(d["poly"])}" fill="none" stroke="{RULE}" stroke-width="3"/>')
o.append('</g>')

# --- chips (sizes and offsets from meta.chipStyle, shared with poster.js) ---
for c in L["chips"]:
    cx, cy = c["x"] + c["w"] / 2, c["y"]
    col = oklch(c["hue"], 0.66, 0.06)
    lg, half = CS["logo"], CS["logo"] / 2
    o.append(f'<g class="chip" data-slug="{esc(c["slug"])}">')
    o.append(f'<rect x="{c["x"]+8}" y="{c["y"]+6}" width="{c["w"]-16}" height="{c["h"]-12}" '
             f'rx="16" fill="{PAPER}"/>')
    logo = os.path.join(ROOT, "assets", "logos", c["slug"] + ".svg")
    if USE_LOGOS and os.path.exists(logo):
        o.append(f'<image href="assets/logos/{esc(c["slug"])}.svg" x="{cx-half:.0f}" '
                 f'y="{cy+CS["logoY"]}" width="{lg}" height="{lg}" '
                 f'preserveAspectRatio="xMidYMid meet"/>')
    else:
        o.append(f'<rect x="{cx-half:.0f}" y="{cy+CS["logoY"]}" width="{lg}" height="{lg}" '
                 f'rx="{lg*0.22:.0f}" fill="{col}"/>')
        o.append(f'<text x="{cx:.0f}" y="{cy+CS["logoY"]+lg*0.69:.0f}" font-size="{lg*0.47:.0f}" '
                 f'font-weight="800" text-anchor="middle" fill="#FFFFFF">{esc(c["mono"])}</text>')
    for i, ln in enumerate(wrap(c["name"], CS["nameChars"], 2)):
        o.append(f'<text x="{cx:.0f}" y="{cy+CS["nameY"]+i*CS["nameStep"]}" '
                 f'font-size="{CS["nameSize"]}" font-weight="700" text-anchor="middle" '
                 f'fill="{INK}">{esc(ln)}</text>')
    for j, ln in enumerate(c.get("sub", [])):
        o.append(f'<text x="{cx:.0f}" y="{cy+CS["descY"]+j*CS["descStep"]}" '
                 f'font-size="{CS["descSize"]}" text-anchor="middle" '
                 f'fill="{MUTED}">{esc(ln)}</text>')
    if c["exited"]:
        o.append(f'<line x1="{c["x"]+14}" y1="{c["y"]+12}" x2="{c["x"]+c["w"]-14}" '
                 f'y2="{c["y"]+c["h"]-18}" stroke="{MUTED}" stroke-width="2" opacity=".5"/>')
    if c["spokenTo"]:
        o.append(f'<circle cx="{c["x"]+c["w"]-22}" cy="{c["y"]+20}" r="6" fill="{YELLOW}"/>')
    o.append('</g>')

# --- the centre, and the companies inside it (mirrors poster.js) ----------
oc = L["oct"]
o.append(f'<polygon points="{pts(oc["points"])}" fill="{MED}"/>')
o.append(f'<polygon points="{pts(oc["points"])}" fill="none" stroke="{YELLOW}" stroke-width="10"/>')
o.append(f'<text x="{oc["cx"]}" y="{oc["titleY"]}" font-size="82" font-weight="900" '
         f'letter-spacing="16" text-anchor="middle" fill="{INK}">{esc(oc["title"])}</text>')
o.append(f'<text x="{oc["cx"]}" y="{oc["subY"]}" font-size="27" text-anchor="middle" '
         f'fill="{MEDSUB}" font-family="IBM Plex Mono, monospace" letter-spacing="4">'
         f'{esc(oc["sub"])} · {esc(oc["foot"])}</text>')
for c in L["medallion"]:
    cx = c["x"] + c["w"] / 2
    half = MS["logo"] / 2
    o.append(f'<g class="op" data-slug="{esc(c["slug"])}">')
    # the same bounded tile every district chip has, no border
    o.append(f'<rect x="{c["x"]+12}" y="{c["y"]+8}" width="{c["w"]-24}" height="{c["h"]-16}" '
             f'rx="22" fill="{PAPER}"/>')
    logo = os.path.join(ROOT, "assets", "logos", c["slug"] + ".svg")
    if USE_LOGOS and os.path.exists(logo):
        o.append(f'<image href="assets/logos/{esc(c["slug"])}.svg" x="{cx-half:.0f}" '
                 f'y="{c["y"]+MS["logoY"]:.0f}" width="{MS["logo"]}" height="{MS["logo"]}" '
                 f'preserveAspectRatio="xMidYMid meet"/>')
    else:
        o.append(f'<rect x="{cx-half:.0f}" y="{c["y"]+MS["logoY"]:.0f}" width="{MS["logo"]}" '
                 f'height="{MS["logo"]}" rx="{MS["logo"]*0.22:.0f}" fill="{oklch(c["hue"], 0.66, 0.06)}"/>')
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["logoY"]+MS["logo"]*0.69:.0f}" '
                 f'font-size="{MS["logo"]*0.47:.0f}" '
                 f'font-weight="800" text-anchor="middle" fill="#FFFFFF">{esc(c["mono"])}</text>')
    o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["nameY"]:.0f}" font-size="{MS["nameSize"]}" '
             f'font-weight="700" text-anchor="middle" fill="{INK}">{esc(c["name"])}</text>')
    # The space under an operator name is the most valuable on the poster. It carries
    # the one claim that earns that company its place in the centre.
    claim = c.get("claim") or KNOWN.get(c["name"], "")
    for j, ln in enumerate(wrap(claim, maxchars=MS["claimChars"], maxlines=4)):
        o.append(f'<text x="{cx:.0f}" y="{c["y"]+MS["claimY"]+j*MS["claimStep"]:.0f}" '
                 f'font-size="{MS["claimSize"]}" text-anchor="middle" fill="{MEDSUB}">{esc(ln)}</text>')
    o.append('</g>')

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
