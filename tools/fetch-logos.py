#!/usr/bin/env python3
"""fetch-logos.py :: build-time logo pipeline (brief section 8).

Reads the domains map from data/av-enrichment.json (companies) and the
publication, podcast and event domains from data/av-media.json (keyed
media-<domain>), walks a fallback chain per domain, normalises every mark to a
square transparent asset, and freezes the results into committed files:

    assets/logos/<slug>.svg|png     per-company asset
    assets/logos/sprite.svg         every vector mark as a <symbol id="logo-<slug>">
    assets/logos/atlas.png|webp     grid atlas of raster-only marks
    data/logo-manifest.json         the runtime index, lean: format (+ atlas cell)
    data/logo-provenance.json       source, url, fetch date, quality per mark

After a fetch, re-run tools/build-indexes.py and tools/build-poster-layout.py:
the poster embeds atlas cells at build time and must agree with the atlas.

The site renders monogram tiles for any company absent from the manifest, so
this script can be re-run quarterly (or never) without breaking a page.

Requires: requests, Pillow.  Run OUTSIDE restricted environments; company
sites, icon services and CDNs must be reachable.

    python3 tools/fetch-logos.py            # fetch everything missing
    python3 tools/fetch-logos.py --force    # refetch all
    python3 tools/fetch-logos.py --only waymo,zoox
    python3 tools/fetch-logos.py --assemble # skip fetching, rebuild sprite+atlas
"""
import json, os, re, sys, io, base64, datetime, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_DIR = os.path.join(ROOT, "assets", "logos")
MANIFEST = os.path.join(ROOT, "data", "logo-manifest.json")
PROVENANCE = os.path.join(ROOT, "data", "logo-provenance.json")
UA = {"User-Agent": "Mozilla/5.0 (compatible; av-ecosystem-map logo pipeline; "
      "+https://github.com/agyarek/av-ecosystem-map)"}
TIMEOUT = 12
ATLAS_CELL = 192         # px per mark in the atlas; chips render at 84, so this
                         # stays crisp on a 2x display and in the 4x PNG export
LOGO_API = os.environ.get("LOGO_API_TEMPLATE", "")  # e.g. https://img.logo.dev/{domain}?token=...

def load(name):
    return json.load(open(os.path.join(ROOT, "data", name), encoding="utf-8"))

def log(*a): print(*a, flush=True)

# ---------------------------------------------------------------- fetching
def get(url, sess):
    try:
        r = sess.get(url, headers=UA, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code == 200 and r.content:
            return r
    except Exception:
        pass
    return None

def find_candidates(domain, sess):
    """Yield (kind, url) in preference order for one domain."""
    base = f"https://{domain}"
    html = ""
    r = get(base, sess)
    if r is not None and "html" in (r.headers.get("content-type") or ""):
        html = r.text[:300_000]

    def links(rel_pat):
        out = []
        for m in re.finditer(r"<link[^>]+>", html, re.I):
            tag = m.group(0)
            rel = re.search(r'rel=["\']([^"\']+)', tag, re.I)
            href = re.search(r'href=["\']([^"\']+)', tag, re.I)
            if rel and href and re.search(rel_pat, rel.group(1), re.I):
                out.append(urllib.parse.urljoin(base, href.group(1)))
        return out

    for u in links(r"icon"):
        if u.lower().endswith(".svg"):
            yield "site-svg-icon", u
    yield "apple-touch", urllib.parse.urljoin(base, "/apple-touch-icon.png")
    for u in links(r"apple-touch-icon"):
        yield "apple-touch", u
    og = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html, re.I) \
        or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html, re.I)
    if og:
        yield "og-image", urllib.parse.urljoin(base, og.group(1))
    for u in links(r"icon"):
        yield "link-icon", u
    if LOGO_API:
        yield "logo-api", LOGO_API.format(domain=domain)
    yield "favicon-service", ("https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON"
                              f"&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=256")

# ---------------------------------------------------------------- normalise
def normalise_raster(blob):
    """Square transparent 256px PNG, trimmed to the mark + 8% padding.
    Returns (png_bytes, source_px, quality) or None."""
    from PIL import Image
    try:
        im = Image.open(io.BytesIO(blob)).convert("RGBA")
    except Exception:
        return None
    if min(im.size) < 24:
        return None
    src_px = min(im.size)
    alpha = im.getchannel("A")
    if alpha.getextrema()[0] < 250:                      # real transparency: trim it
        bbox = alpha.getbbox()
    else:                                                # opaque: trim uniform border
        corners = [im.getpixel(p)[:3] for p in
                   [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
        if len(set(corners)) == 1:
            from PIL import ImageChops
            bg = Image.new("RGBA", im.size, corners[0] + (255,))
            bbox = ImageChops.difference(im, bg).getbbox()
            if bbox and corners[0] == (255, 255, 255):   # white ground becomes transparent
                datas = im.getdata()
                im.putdata([(r, g, b, 0) if (r, g, b) == (255, 255, 255) and a == 255
                            else (r, g, b, a) for r, g, b, a in datas])
        else:
            bbox = None
    if bbox:
        im = im.crop(bbox)
    side = max(im.size)
    pad = max(1, round(side * 0.08))
    canvas = Image.new("RGBA", (side + 2 * pad,) * 2, (0, 0, 0, 0))
    canvas.paste(im, ((canvas.width - im.width) // 2, (canvas.height - im.height) // 2), im)
    canvas = canvas.resize((256, 256), Image.LANCZOS)
    out = io.BytesIO()
    canvas.save(out, "PNG", optimize=True)
    quality = "raster" if src_px >= 96 else "poor"
    return out.getvalue(), src_px, quality

def looks_svg(blob, ctype):
    head = blob[:400].lstrip()
    return b"<svg" in head or "svg" in (ctype or "")

# ---------------------------------------------------------------- assemble
SVG_OPEN_RE = re.compile(rb"<svg\b[^>]*>", re.I)

def symbol_for(slug, svg_bytes):
    """Wrap a standalone SVG as <symbol id="logo-slug">, preserving viewBox."""
    m = SVG_OPEN_RE.search(svg_bytes)
    if not m:
        return None
    open_tag = m.group(0).decode("utf-8", "replace")
    vb = re.search(r'viewBox="([^"]+)"', open_tag)
    if not vb:
        w = re.search(r'width="([\d.]+)', open_tag)
        h = re.search(r'height="([\d.]+)', open_tag)
        vb_val = f"0 0 {w.group(1) if w else 100} {h.group(1) if h else 100}"
    else:
        vb_val = vb.group(1)
    inner = svg_bytes[m.end():]
    inner = re.sub(rb"</svg\s*>\s*$", b"", inner.strip())
    body = inner.decode("utf-8", "replace")
    if re.search(r"<(script|foreignObject)\b", body, re.I):
        return None                                       # never inline active content
    return f'<symbol id="logo-{slug}" viewBox="{vb_val}">{body}</symbol>'

def assemble(manifest):
    from PIL import Image
    os.makedirs(LOGO_DIR, exist_ok=True)
    symbols, rasters = [], []
    for slug, meta in sorted(manifest.items()):
        if meta.get("format") == "svg":
            path = os.path.join(LOGO_DIR, slug + ".svg")
            if os.path.exists(path):
                sym = symbol_for(slug, open(path, "rb").read())
                if sym: symbols.append(sym); continue
            meta["format"] = "png"                        # fall through if unwrappable
        path = os.path.join(LOGO_DIR, slug + ".png")
        if os.path.exists(path):
            rasters.append(slug)

    sprite = ('<svg xmlns="http://www.w3.org/2000/svg" '
              'xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">'
              + "".join(symbols) + "</svg>")
    open(os.path.join(LOGO_DIR, "sprite.svg"), "w", encoding="utf-8").write(sprite)

    cols = max(1, int(len(rasters) ** 0.5 + 0.999)) if rasters else 1
    rows = -(-len(rasters) // cols) if rasters else 1
    atlas = Image.new("RGBA", (cols * ATLAS_CELL, rows * ATLAS_CELL), (0, 0, 0, 0))
    coords = {}
    for i, slug in enumerate(rasters):
        im = Image.open(os.path.join(LOGO_DIR, slug + ".png")).convert("RGBA") \
                  .resize((ATLAS_CELL, ATLAS_CELL), Image.LANCZOS)
        x, y = (i % cols) * ATLAS_CELL, (i // cols) * ATLAS_CELL
        atlas.paste(im, (x, y))
        coords[slug] = {"x": x, "y": y}
    atlas.save(os.path.join(LOGO_DIR, "atlas.png"), "PNG", optimize=True)
    try:
        atlas.save(os.path.join(LOGO_DIR, "atlas.webp"), "WEBP", quality=88, method=6)
    except Exception:
        pass
    for slug, c in coords.items():
        manifest[slug]["atlas"] = c
    manifest["__atlas__"] = {"w": atlas.width, "h": atlas.height, "cell": ATLAS_CELL}
    log(f"assembled sprite.svg ({len(symbols)} symbols) and atlas "
        f"({len(rasters)} marks, {cols}x{rows} cells of {ATLAS_CELL}px)")

# ---------------------------------------------------------------- main
def main():
    import requests
    force = "--force" in sys.argv
    assemble_only = "--assemble" in sys.argv
    only = set()
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))

    # the full bookkeeping lives in provenance; the manifest keeps only what
    # the pages read at runtime. Older combined manifests migrate transparently.
    companies = load("av-companies.json")
    enrichment = load("av-enrichment.json")
    domains = enrichment.get("domains", {})
    # logoDomains says "this company's usable mark lives on its parent's
    # domain"; honour it first, then fall back to the company's own site
    logo_domains = enrichment.get("logoDomains", {})
    slug_by_name = {c["name"]: c["slug"] for c in companies}
    items = []
    for name, dom in sorted(domains.items()):
        if name not in slug_by_name:
            continue
        doms = [d for d in (logo_domains.get(name), dom) if d]
        items.append((name, doms, slug_by_name[name]))
    # the media page's marks ride the same pipeline, keyed media-<domain>
    media_key = lambda d: "media-" + re.sub(r"[^a-z0-9]+", "-", d.lower()).strip("-")
    seen = set()
    for kind in ("publications", "podcasts", "events"):
        for m in load("av-media.json").get(kind, []):
            dom = (m.get("domain") or "").strip()
            if dom and dom not in seen:
                seen.add(dom)
                items.append((m.get("name", dom), [dom], media_key(dom)))
    manifest = {}
    if os.path.exists(PROVENANCE):
        manifest = json.load(open(PROVENANCE, encoding="utf-8"))
    elif os.path.exists(MANIFEST):
        old = json.load(open(MANIFEST, encoding="utf-8"))
        if any(isinstance(v, dict) and "source" in v for v in old.values()):
            manifest = old

    if not assemble_only:
        os.makedirs(LOGO_DIR, exist_ok=True)
        sess = requests.Session()
        todo = [(name, doms, slug) for name, doms, slug in items
                if (not only or slug in only)
                and (force or slug not in manifest)]
        log(f"{len(todo)} marks to fetch ({len(domains)} company domains known)")
        ok = fail = 0
        for name, doms, slug in todo:
            got = None
            for kind, url in (c for d in doms for c in find_candidates(d, sess)):
                r = get(url, sess)
                if r is None: continue
                blob, ctype = r.content, r.headers.get("content-type", "")
                if looks_svg(blob, ctype):
                    open(os.path.join(LOGO_DIR, slug + ".svg"), "wb").write(blob)
                    got = {"source": kind, "url": url, "format": "svg", "quality": "vector"}
                    break
                norm = normalise_raster(blob)
                if norm:
                    png, px, quality = norm
                    open(os.path.join(LOGO_DIR, slug + ".png"), "wb").write(png)
                    got = {"source": kind, "url": url, "format": "png",
                           "quality": quality, "px": px}
                    break
            if got:
                got["fetched"] = datetime.date.today().isoformat()
                manifest[slug] = got
                ok += 1
                log(f"  ok   {slug:36s} {got['source']:16s} {got['quality']}")
            else:
                fail += 1
                log(f"  MISS {slug:36s} ({', '.join(doms)})")
        log(f"fetched {ok}, missed {fail}")

    if manifest:
        assemble(manifest)
    json.dump(manifest, open(PROVENANCE, "w", encoding="utf-8"), indent=1, sort_keys=True)
    lean = {}
    for k, v in manifest.items():
        if k == "__atlas__":
            lean[k] = v
        elif v.get("format") == "svg":
            lean[k] = {"f": "svg"}
        elif "atlas" in v:
            lean[k] = {"f": "png", "a": [v["atlas"]["x"], v["atlas"]["y"]]}
    json.dump(lean, open(MANIFEST, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    log(f"wrote data/logo-provenance.json ({len(manifest)} entries) and the lean "
        f"runtime manifest ({os.path.getsize(MANIFEST)} bytes). Marks absent from "
        f"the manifest render as monogram tiles by design.")

if __name__ == "__main__":
    main()
