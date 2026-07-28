#!/usr/bin/env python3
"""build-social-cards.py :: render 1200x630 Open Graph cards from the poster.

Each page's card is a crop of the real wall chart with a title bar, so a
shared link is immediately legible as this site. Operator cards centre on
that operator's medallion position, which the brief asks for by name.

Requires a Chromium/Chrome binary for rasterisation. Set CHROME_BIN or rely
on the defaults probed below.

    python3 tools/build-social-cards.py
"""
import json, os, subprocess, tempfile, shutil, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "cards")
L = json.load(open(os.path.join(ROOT, "data", "poster-layout.json"), encoding="utf-8"))
W, H = L["meta"]["width"], L["meta"]["height"]
SVG = open(os.path.join(ROOT, "poster-reference.svg"), encoding="utf-8").read()

CHROME_CANDIDATES = [
    os.environ.get("CHROME_BIN", ""),
    "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    shutil.which("chromium") or "", shutil.which("chromium-browser") or "",
    shutil.which("google-chrome") or "",
]
CHROME = next((c for c in CHROME_CANDIDATES if c and os.path.exists(c)), None)
if not CHROME:
    sys.exit("No Chromium binary found; set CHROME_BIN")

def med_box(slug):
    for m_ in L["medallion"]:
        if m_["slug"] == slug:
            return m_
    return None

# (name, title, kicker, viewbox) :: viewbox None means fit whole poster
mb = L["meta"]["medallionBox"]
def crop_around(cx, cy, w):
    h = w * 630 / 1200
    return f'{max(0, min(W - w, cx - w / 2)):.0f} {max(0, min(H - h, cy - h / 2)):.0f} {w:.0f} {h:.0f}'

CARDS = [
    ("home", "The autonomous vehicle industry, drawn to scale", f"{L['meta']['companyCount']} ORGANISATIONS · 11 LAYERS", None),
    ("map", "The Wall Chart", f"ALL {L['meta']['companyCount']} ON ONE POSTER", None),
    ("companies", "The Ledger", f"{L['meta']['companyCount']} ROWS · EVERY FIELD · SHAREABLE VIEWS", None),
    ("operators", "The Ten", "OPERATORS A PASSENGER CAN ACTUALLY MEET",
     crop_around(mb["x"] + mb["w"] / 2, mb["y"] + mb["h"] / 2, mb["w"] * 1.35)),
    ("partnerships", "The Web", "148 MAPPED RELATIONSHIPS BY FUNCTION", None),
    ("funding", "The Money", "$41.8B ACROSS 30 EVENTS", None),
    ("economics", "The Arithmetic", "WILL ANY OF THIS PAY?", None),
    ("regulation", "The Permission", "WHO IS ALLOWED TO DRIVE, AND WHO DECIDES", None),
    ("safety", "What Has Gone Wrong", "INCIDENTS · RECALLS · SYSTEMIC FAILURES", None),
    ("owning-one", "Can I Buy One?", "THE PART THAT WENT BACKWARDS", None),
    ("beyond-roads", "Beyond Roads", "AUTONOMY SHIPPED IN 2008. NOT HERE.", None),
    ("method", "Method & Gaps", f"128 OF {L['meta']['companyCount']} MAPPED · CORRECTIONS WELCOME", None),
]
for m_ in L["medallion"]:
    CARDS.append((f'op-{m_["slug"]}', m_["name"], "THE TEN · OPERATOR DEEP DIVE",
                  crop_around(m_["x"] + m_["w"] / 2, m_["y"] + m_["h"] / 2, mb["w"] * 1.1)))

# operator pages reference cards named op-waymo, op-baidu, op-tesla, op-zoox,
# op-pony, op-weride, op-wayve, op-nuro, op-may, op-motional in their meta
ALIAS = {"op-baidu-apollo-go": "op-baidu", "op-pony-ai": "op-pony", "op-may-mobility": "op-may"}

PAGE = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body {{ margin: 0; width: 1200px; height: 630px; overflow: hidden;
         font-family: 'Archivo', 'Helvetica Neue', Arial, sans-serif; background: #FAFAF7; }}
  .art {{ position: absolute; inset: 0; }}
  .art svg {{ width: 100%; height: 100%; }}
  .bar {{ position: absolute; left: 0; right: 0; bottom: 0; background: #12130F; color: #FAFAF7;
          padding: 26px 44px 30px; }}
  .kick {{ font-family: 'IBM Plex Mono', monospace; font-size: 17px; letter-spacing: .16em;
           color: #F2B705; margin: 0 0 8px; }}
  .t {{ font-size: 52px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }}
  .wm {{ position: absolute; right: 44px; bottom: 34px; font-family: 'IBM Plex Mono', monospace;
         font-size: 15px; color: #8B8F82; letter-spacing: .08em; }}
</style></head><body>
  <div class="art">{svg}</div>
  <div class="bar"><p class="kick">{kicker}</p><p class="t">{title}</p>
    <span class="wm">AV ECOSYSTEM MAP</span></div>
</body></html>"""

def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="avcards-")
    made = 0
    for name, title, kicker, viewbox in CARDS:
        vb = viewbox or f"0 0 {W} {H}"
        svg = SVG.replace(f'viewBox="0 0 {W} {H}"', f'viewBox="{vb}" preserveAspectRatio="xMidYMid slice"', 1)
        page = PAGE.format(svg=svg, title=html.escape(title), kicker=html.escape(kicker))
        src = os.path.join(tmp, name + ".html")
        open(src, "w", encoding="utf-8").write(page)
        out_name = ALIAS.get(name, name)
        dest = os.path.join(OUT, out_name + ".png")
        subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                        "--force-device-scale-factor=1",
                        f"--window-size=1200,630", f"--screenshot={dest}",
                        "file://" + src],
                       check=True, capture_output=True)
        made += 1
        print("card", out_name + ".png")
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"wrote {made} cards to assets/cards/")

if __name__ == "__main__":
    main()
