/* poster.js :: the wall chart.
   Renders data/poster-layout.json verbatim (geometry is frozen at build time),
   then adds camera, selection, filters, exports and keyboard navigation.

   The composition is a hexagonal rosette: the ten operators inside a hexagon,
   the ten remaining layers docked on its six borders as rotated panels. The
   panels tilt; the company tiles inside them never do.

   Filtering dims; it never reflows. One company, one chip, always. */
(function () {
  'use strict';
  const { ROOT, esc, json, fmtM, reducedMotion } = window.AV;

  const svg = document.getElementById('poster');
  const viewport = document.getElementById('poster-viewport');
  const stage = document.getElementById('poster-stage');
  const shell = document.getElementById('map-shell');
  const rail = document.getElementById('map-rail');
  const navWrap = document.getElementById('navigator-wrap');
  const card = document.getElementById('company-card');
  const liveState = document.getElementById('filter-state');

  const SHORT = {  // cat -> URL key (brief: /map/?layer=sensing&region=greater-china)
    'AV Driver / Autonomy Software': 'driver', 'Sensing & Compute Hardware': 'sensing',
    'Data, Maps & Simulation': 'data', 'AV Middleware & Tooling': 'middleware',
    'Vehicle Platform & Manufacturing': 'vehicle', 'Demand & Commercial Platforms': 'demand',
    'Fleet Operations & Depot': 'fleet', 'Connectivity & Infrastructure': 'connectivity',
    'Capital, Insurance & Risk': 'capital', 'Governance: Regulators & Government': 'regulators',
    'Governance: Standards, Safety & Advocacy': 'standards'
  };
  // The home page still tells the ride as four stages. The chart no longer draws
  // them as bands, so a stage anchor resolves to the districts it covers.
  const STAGE_DISTRICTS = {
    request: ['demand-commercial-platforms'],
    driver: ['av-driver-autonomy-software', 'sensing-compute-hardware',
             'data-maps-simulation', 'connectivity-infrastructure'],
    vehicle: ['vehicle-platform-manufacturing'],
    pitlane: ['fleet-operations-depot'],
    across: ['capital-insurance-risk', 'governance-regulators-government',
             'governance-standards-safety-advocacy'],
  };
  const REGION_KEY = r => r.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const MATS = ['Scaled', 'Commercial', 'Pilot', 'R&D', 'Governance', 'Historical', 'Other'];

  let L = null, slim = null, bySlug = null, partners = null;
  let manifest = null, spriteText = null, atlasDataURL = null;
  let full = null, fullPromise = null;      // the complete records, fetched on demand
  let W = 0, H = 0, MS = null;
  const state = {
    sel: null, layers: new Set(), regions: new Set(), mats: new Set(),
    spoken: false, exited: false, q: ''
  };

  // ------------------------------------------------------------ helpers
  const wrapText = (name, maxchars = 15, maxlines = 2) => {
    const words = String(name).split(/\s+/); const lines = []; let cur = '';
    for (const w of words) {
      const t = (cur + ' ' + w).trim();
      if (t.length <= maxchars) cur = t;
      else { if (cur) lines.push(cur); cur = w; if (lines.length === maxlines) break; }
    }
    if (cur && lines.length < maxlines) lines.push(cur);
    const flat = words.join(' ');
    if (lines.length === maxlines && flat.length > lines.join(' ').length) {
      lines[maxlines - 1] = lines[maxlines - 1].slice(0, maxchars - 1) + '…';
    }
    return lines.slice(0, maxlines);
  };
  const oklch = (hue, l, c) => `oklch(${l} ${c} ${hue})`;
  const isOperator = slug => L.medallion.some(mo => mo.slug === slug);

  // ------------------------------------------------------------ SVG build
  // Remote favicon services, tried in order. These are what make logos appear
  // with no build step: the browser fetches them directly, so the committed
  // assets from tools/fetch-logos.py are an optional quality upgrade rather
  // than a prerequisite. When those assets exist they take precedence below.
  const LOGO_SOURCES = [
    d => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent('https://' + d)}&size=256`,
    d => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`,
    d => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(d)}.ico`,
  ];

  function logoMarkup(slug, cx, cy, size, hue, mono, forExport) {
    const m = manifest && manifest[slug];
    const half = size / 2;
    if (m && m.format === 'svg' && spriteText) {
      return `<use href="#logo-${esc(slug)}" x="${cx - half}" y="${cy}" width="${size}" height="${size}"/>`;
    }
    if (m && m.format === 'png' && m.atlas && manifest.__atlas__) {
      const A = manifest.__atlas__;
      const href = forExport && atlasDataURL ? atlasDataURL : ROOT + 'assets/logos/atlas.png';
      return `<svg x="${cx - half}" y="${cy}" width="${size}" height="${size}" viewBox="${m.atlas.x} ${m.atlas.y} ${A.cell} ${A.cell}"><image href="${href}" width="${A.w}" height="${A.h}"/></svg>`;
    }
    // Monogram tile in the layer hue. It always renders, and a remote logo is
    // layered over it once loaded, so a slow or missing favicon degrades to a
    // deliberate-looking tile rather than a hole.
    const fill = forExport ? oklch(hue, 0.66, 0.06) : `oklch(var(--tile-l) var(--tile-c) ${hue})`;
    const txfill = forExport ? '#FFFFFF' : 'var(--tile-ink)';
    const tile =
      `<rect x="${cx - half}" y="${cy}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${fill}"/>` +
      `<text x="${cx}" y="${cy + size * 0.69}" font-size="${size * 0.47}" font-weight="800" text-anchor="middle" fill="${txfill}" font-family="Archivo, sans-serif">${esc(mono)}</text>`;
    const domain = bySlug[slug] && bySlug[slug].d;
    if (forExport || !domain) return tile;
    // href is filled in by the lazy loader once the chip is near the viewport
    return tile +
      `<rect class="logo-bg" data-logo-bg="${esc(slug)}" x="${cx - half}" y="${cy}" width="${size}" height="${size}" rx="${size * 0.22}" fill="#FFFFFF" opacity="0"/>` +
      `<image class="logo-img" data-logo="${esc(slug)}" data-domain="${esc(domain)}" data-try="0" ` +
      `x="${cx - half + size * 0.08}" y="${cy + size * 0.08}" width="${size * 0.84}" height="${size * 0.84}" ` +
      `preserveAspectRatio="xMidYMid meet" opacity="0"/>`;
  }

  // ------------------------------------------------------------ lazy logos
  // 442 favicon requests at once would stall a phone, so load only what is on
  // or near screen, newest camera position first, and top up after each move.
  const logoQueue = { pending: new Set(), inflight: 0, MAX: 8 };
  function bindLogo(img) {
    const domain = img.dataset.domain;
    const attempt = () => {
      const t = +img.dataset.try;
      if (t >= LOGO_SOURCES.length) { logoQueue.inflight--; pump(); return; }
      img.dataset.try = t + 1;
      img.setAttribute('href', LOGO_SOURCES[t](domain));
    };
    img.addEventListener('load', () => {
      logoQueue.inflight--;
      img.style.opacity = '1';
      const bg = svg.querySelector(`[data-logo-bg="${CSS.escape(img.dataset.logo)}"]`);
      if (bg) bg.style.opacity = '1';
      pump();
    }, { once: false });
    img.addEventListener('error', attempt);
    attempt();
  }
  function pump() {
    while (logoQueue.inflight < logoQueue.MAX && logoQueue.pending.size) {
      const img = logoQueue.pending.values().next().value;
      logoQueue.pending.delete(img);
      logoQueue.inflight++;
      bindLogo(img);
    }
  }
  let logoSweepScheduled = false;
  function sweepLogos() {
    if (logoSweepScheduled) return;
    logoSweepScheduled = true;
    requestAnimationFrame(() => {
      logoSweepScheduled = false;
      const pad = cam.w * 0.35;
      const x0 = cam.x - pad, x1 = cam.x + cam.w + pad;
      const y0 = cam.y - pad, y1 = cam.y + cam.h + pad;
      svg.querySelectorAll('image.logo-img:not([data-queued])').forEach(img => {
        const x = +img.getAttribute('x'), y = +img.getAttribute('y');
        if (x < x0 || x > x1 || y < y0 || y > y1) return;
        img.dataset.queued = '1';
        logoQueue.pending.add(img);
      });
      pump();
    });
  }

  // Navigator tiles and the card header are HTML, so a plain lazy <img> over the
  // monogram is enough.
  const navLogo = slug => {
    const d = bySlug[slug] && bySlug[slug].d;
    return d ? `<img src="${LOGO_SOURCES[0](d)}" alt="" loading="lazy" decoding="async"
      onload="this.style.opacity=1" onerror="this.remove()">` : '';
  };

  // A district panel: root side square so it sits flush against the hexagon,
  // outer corners rounded. Drawn inside translate(ox,oy) rotate(rot).
  function panelPath(d, r) {
    const x = d.x, w = d.w, h = d.h;
    return d.out > 0
      ? `M ${x} 0 L ${x + w} 0 L ${x + w} ${h - r} Q ${x + w} ${h} ${x + w - r} ${h} L ${x + r} ${h} Q ${x} ${h} ${x} ${h - r} Z`
      : `M ${x} 0 L ${x} ${-(h - r)} Q ${x} ${-h} ${x + r} ${-h} L ${x + w - r} ${-h} Q ${x + w} ${-h} ${x + w} ${-(h - r)} L ${x + w} 0 Z`;
  }

  function buildSVG(forExport) {
    const m = L.meta, hx = L.hex;
    const X = forExport;  // export = fixed light-paper colours, no interactivity
    const C = {
      paper: X ? '#FAFAF7' : 'var(--paper)', ink: X ? '#12130F' : 'var(--ink)',
      card: X ? '#FFFFFF' : 'var(--paper-2)', rule: X ? '#DEDFD8' : 'var(--rule)',
      muted: X ? '#6E7268' : 'var(--muted)', yellow: X ? '#F2B705' : 'var(--yellow)',
      med: X ? '#12130F' : 'var(--med-bg)', medtx: X ? '#FAFAF7' : 'var(--med-ink)',
      medsub: X ? '#B9BCB2' : 'var(--med-sub)'
    };
    const hueFill = h => X ? oklch(h, 0.62, 0.075) : `oklch(var(--layer-l) var(--layer-c) ${h})`;
    const o = [];
    o.push(`<rect width="${W}" height="${H}" fill="${C.paper}"/>`);
    o.push(`<g class="world">`);

    const chipsOf = {};
    for (const c of L.chips) (chipsOf[c.district] = chipsOf[c.district] || []).push(c);

    for (const d of L.districts) {
      // One group per layer: frame and tiles move, light up and lift together.
      o.push(X ? `<g>` : `<g class="district" data-district="${esc(d.id)}">`);
      o.push(`<g class="district-shell" transform="translate(${d.ox},${d.oy}) rotate(${d.rot})">`);
      const hy = d.out > 0 ? 0 : -d.headerH;
      o.push(`<path class="d-frame" d="${panelPath(d, 18)}" fill="${C.card}" stroke="${C.rule}" stroke-width="2"/>`);
      // a whisper of the layer's own colour, so the rosette reads as ten layers
      // from across the room and not as ten identical white plates
      o.push(`<path class="d-wash" d="${panelPath(d, 18)}" fill="${hueFill(d.hue)}" opacity=".05"/>`);
      o.push(`<rect class="d-tint" x="${d.x}" y="${hy}" width="${d.w}" height="${d.headerH}" fill="${hueFill(d.hue)}" opacity=".13"/>`);
      o.push(`<rect x="${d.x}" y="${hy + (d.out > 0 ? d.headerH - 9 : 0)}" width="${d.w}" height="9" fill="${hueFill(d.hue)}"/>`);
      if (!X) o.push(`<path class="d-glow" d="${panelPath(d, 18)}" fill="none" stroke="${hueFill(d.hue)}" stroke-width="7" opacity="0"/>`);
      const ty = d.out > 0 ? 132 : -78;
      const label = d.layer.replace('Governance: ', '');
      o.push(`<text x="${d.x + 30}" y="${ty}" font-size="40" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(label.toUpperCase())}</text>`);
      o.push(`<text x="${d.x + d.w - 30}" y="${ty}" font-size="40" font-weight="600" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count}</text>`);
      o.push(`</g>`);

      for (const c of chipsOf[d.id] || []) {
        const cx = c.x + c.w / 2, cy = c.y;
        const meta = bySlug[c.slug] || {};
        if (!X) {
          const aria = [c.name, meta.c || '', meta.r || ''].filter(Boolean).join(', ')
            + (partners.bySlug[c.slug] ? `; ${partners.bySlug[c.slug].count} mapped partners` : '')
            + (c.spokenTo ? '; spoken with directly' : '') + (c.exited ? '; exited' : '');
          o.push(`<g data-chip data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + c.h / 2}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${c.spokenTo ? 'data-spoken="1"' : ''} ${c.exited ? 'data-exited="1"' : ''} tabindex="-1" role="button" aria-label="${esc(aria)}">`);
        } else {
          o.push(`<g>`);
        }
        o.push(`<rect class="chip-body" x="${c.x + 8}" y="${c.y + 6}" width="${c.w - 16}" height="${c.h - 12}" rx="12" fill="${C.paper}" stroke="${C.rule}"/>`);
        o.push(logoMarkup(c.slug, cx, cy + 18, 72, c.hue, c.mono, X));
        wrapText(c.name).forEach((ln, i) => {
          o.push(`<text x="${cx}" y="${cy + 112 + i * 20}" font-size="17" text-anchor="middle" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
        });
        (c.pips || []).forEach((hue, i) => {
          o.push(`<circle cx="${c.x + 22 + i * 16}" cy="${c.y + 20}" r="5.5" fill="${hueFill(hue)}"/>`);
        });
        if (c.exited) o.push(`<line x1="${c.x + 14}" y1="${c.y + 12}" x2="${c.x + c.w - 14}" y2="${c.y + c.h - 18}" stroke="${C.muted}" stroke-width="2" opacity=".5"/>`);
        if (c.spokenTo) o.push(`<circle cx="${c.x + c.w - 22}" cy="${c.y + 20}" r="6" fill="${C.yellow}"/>`);
        o.push(`</g>`);
      }
      o.push(`</g>`);
    }

    // ------------------------------------------------------- the hexagon
    const pts = hx.points.map(p => p.join(',')).join(' ');
    o.push(X ? `<g>` : `<g class="district" data-district="the-ten">`);
    o.push(`<g class="medallion-shell">`);
    o.push(`<polygon class="hex-fill" points="${pts}" fill="${C.med}"/>`);
    o.push(`<polygon class="hex-edge" points="${pts}" fill="none" stroke="${C.yellow}" stroke-width="14"/>`);
    o.push(`<text x="${hx.cx}" y="${hx.titleY}" font-size="86" font-weight="900" letter-spacing="18" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">${esc(hx.title)}</text>`);
    o.push(`<text x="${hx.cx}" y="${hx.subY}" font-size="28" text-anchor="middle" fill="${C.yellow}" font-family="IBM Plex Mono, monospace" letter-spacing="4">${esc(hx.sub)}</text>`);
    o.push(`<line x1="${hx.cx - 520}" y1="${hx.ruleY}" x2="${hx.cx + 520}" y2="${hx.ruleY}" stroke="${C.medsub}" stroke-width="2" opacity=".4"/>`);
    o.push(`<text x="${hx.cx}" y="${hx.footY}" font-size="24" text-anchor="middle" fill="${C.medsub}" font-family="IBM Plex Mono, monospace" letter-spacing="3">${esc(hx.foot)}</text>`);
    o.push(`</g>`);

    for (const c of L.medallion) {
      const cx = c.x + c.w / 2;
      const meta = bySlug[c.slug] || {};
      if (!X) {
        o.push(`<g data-chip data-med data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + MS.logoY + MS.logo / 2}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${meta.g ? 'data-spoken="1"' : ''} tabindex="-1" role="button" aria-label="${esc(c.name + '; operator; ' + (c.claim || ''))}">`);
      } else o.push(`<g>`);
      // The operator marks sit on the dark hexagon, so they get a light plate
      // behind them rather than the layer-hue tile used on chips.
      const lm = manifest && manifest[c.slug];
      const dom = bySlug[c.slug] && bySlug[c.slug].d;
      const half = MS.logo / 2;
      if (lm) {
        o.push(logoMarkup(c.slug, cx, c.y + MS.logoY, MS.logo, c.hue, c.mono, X));
      } else {
        o.push(`<rect class="chip-body" x="${cx - half}" y="${c.y + MS.logoY}" width="${MS.logo}" height="${MS.logo}" rx="36" fill="${C.medtx}"/>`);
        o.push(`<text x="${cx}" y="${c.y + MS.logoY + MS.logo * 0.68}" font-size="${MS.logo * 0.44}" font-weight="900" text-anchor="middle" fill="${C.med}" font-family="Archivo, sans-serif">${esc(c.mono)}</text>`);
        if (!X && dom) {
          o.push(`<rect class="logo-bg" data-logo-bg="${esc(c.slug)}" x="${cx - half}" y="${c.y + MS.logoY}" width="${MS.logo}" height="${MS.logo}" rx="36" fill="#FFFFFF" opacity="0"/>`);
          o.push(`<image class="logo-img" data-logo="${esc(c.slug)}" data-domain="${esc(dom)}" data-try="0" ` +
            `x="${cx - half + 12}" y="${c.y + MS.logoY + 12}" width="${MS.logo - 24}" height="${MS.logo - 24}" preserveAspectRatio="xMidYMid meet" opacity="0"/>`);
        }
      }
      o.push(`<text x="${cx}" y="${c.y + MS.nameY}" font-size="${MS.nameSize}" font-weight="700" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">${esc(c.name)}</text>`);
      wrapText(c.claim || '', MS.claimChars, 4).forEach((ln, j) => {
        o.push(`<text x="${cx}" y="${c.y + MS.claimY + j * MS.claimStep}" font-size="${MS.claimSize}" text-anchor="middle" fill="${C.medsub}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
      });
      o.push(`</g>`);
    }
    o.push(`</g>`);

    o.push(`<text x="${m.margin}" y="${H - 70}" font-size="30" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">AUTONOMOUS VEHICLE ECOSYSTEM MAP</text>`);
    o.push(`<text x="${W - m.margin}" y="${H - 70}" font-size="26" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${C.muted}">${m.companyCount} ORGANISATIONS · 11 LAYERS · COMPILED BY KOFI AGYARE-KWABI</text>`);
    if (!X) o.push(`<g class="links" aria-hidden="true"></g>`);
    o.push(`</g>`);
    return o.join('');
  }

  // ------------------------------------------------------------ camera
  const cam = { x: 0, y: 0, w: 1, h: 1 };
  let fitW = 1;
  const OVERSCAN = 0.3;   // how far past an edge the camera may travel, as a
                          // fraction of the viewport, so a corner company can
                          // still be parked near the top left
  const vpSize = () => ({ vw: viewport.clientWidth, vh: viewport.clientHeight });

  function applyCam() {
    svg.setAttribute('viewBox', `${cam.x} ${cam.y} ${cam.w} ${cam.h}`);
    sweepLogos();
    positionCard();
  }
  function clampCam() {
    const { vw, vh } = vpSize();
    cam.h = cam.w * vh / vw;
    const s = vw / cam.w;
    const minS = vw / fitW, maxS = 4;
    if (s < minS) { cam.w = fitW; cam.h = cam.w * vh / vw; }
    if (s > maxS) { cam.w = vw / maxS; cam.h = cam.w * vh / vw; }
    const ox = cam.w * OVERSCAN, oy = cam.h * OVERSCAN;
    cam.x = cam.w >= W ? (W - cam.w) / 2 : Math.max(-ox, Math.min(W - cam.w + ox, cam.x));
    cam.y = cam.h >= H ? (H - cam.h) / 2 : Math.max(-oy, Math.min(H - cam.h + oy, cam.y));
  }
  function fit() {
    const { vw, vh } = vpSize();
    fitW = Math.max(W, H * vw / vh);
    cam.w = fitW; clampCam(); applyCam();
  }
  function zoomAt(px, py, factor) {  // px,py in poster coords stay fixed on screen
    const rx = (px - cam.x) / cam.w, ry = (py - cam.y) / cam.h;
    cam.w /= factor;
    clampCam();
    cam.x = px - rx * cam.w; cam.y = py - ry * cam.h;
    clampCam(); applyCam();
  }
  function toPoster(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    return {
      x: cam.x + (clientX - r.left) / r.width * cam.w,
      y: cam.y + (clientY - r.top) / r.height * cam.h
    };
  }
  let flyToken = 0;
  // fx, fy say where in the viewport the target should land, as fractions.
  // Selection parks a company near the top left and opens its card beside it.
  function flyTo(px, py, targetW, fx, fy) {
    fx = fx == null ? 0.5 : fx; fy = fy == null ? 0.5 : fy;
    const from = { ...cam }, token = ++flyToken;
    const to = { w: Math.max(vpSize().vw / 4, Math.min(fitW, targetW)) };
    to.h = to.w * vpSize().vh / vpSize().vw;
    to.x = px - fx * to.w; to.y = py - fy * to.h;
    if (reducedMotion()) { Object.assign(cam, to); clampCam(); applyCam(); return; }
    const t0 = performance.now(), D = 480;
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    (function step(now) {
      if (token !== flyToken) return;
      const t = Math.min(1, (now - t0) / D), e = ease(t);
      cam.x = from.x + (to.x - from.x) * e; cam.y = from.y + (to.y - from.y) * e;
      cam.w = from.w + (to.w - from.w) * e;
      clampCam(); applyCam();
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  function bindCamera() {
    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const p = toPoster(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.pow(1.0015, -e.deltaY));
    }, { passive: false });

    const pts = new Map();
    let pinch0 = null, moved = false, downOn = null;
    viewport.addEventListener('pointerdown', e => {
      viewport.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      downOn = e.target;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), w: cam.w };
      }
    });
    viewport.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        const r = viewport.getBoundingClientRect();
        const dx = (e.clientX - prev.x) / r.width * cam.w;
        const dy = (e.clientY - prev.y) / r.height * cam.h;
        if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 2) moved = true;
        cam.x -= dx; cam.y -= dy; clampCam(); applyCam();
      } else if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toPoster((a.x + b.x) / 2, (a.y + b.y) / 2);
        const targetW = pinch0.w * pinch0.d / Math.max(20, d);
        zoomAt(mid.x, mid.y, cam.w / targetW);
        moved = true;
      }
    });
    // Selection happens on pointerup, not click: the viewport captures the
    // pointer so it can keep receiving drags outside its own box, and a captured
    // pointer retargets the compatibility click event to the capturing element,
    // so a click listener on the SVG never sees which chip was pressed.
    const up = e => {
      if (viewport.hasPointerCapture && viewport.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }
      const tap = e.type === 'pointerup' && pts.size === 1 && !moved;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = null;
      if (tap) {
        const t = downOn && downOn.closest ? downOn : document.elementFromPoint(e.clientX, e.clientY);
        const g = t && t.closest ? t.closest('[data-chip]') : null;
        if (g) select(g.dataset.slug, true);
        else clearSel();
      }
      downOn = null;
    };
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);

    // hovering anywhere in a layer lights the whole layer
    svg.addEventListener('pointerover', e => setHot(e.target.closest('.district')));
    svg.addEventListener('pointerleave', () => setHot(null));

    document.getElementById('z-in').addEventListener('click', () => zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1.45));
    document.getElementById('z-out').addEventListener('click', () => zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1 / 1.45));
    document.getElementById('z-fit').addEventListener('click', fit);
    addEventListener('resize', () => { fit(); });
  }

  // ------------------------------------------------------------ hover
  let hotEl = null;
  function setHot(el) {
    if (el === hotEl) return;
    if (hotEl) hotEl.classList.remove('hot');
    hotEl = el || null;
    if (hotEl) hotEl.classList.add('hot');
  }

  // ------------------------------------------------------------ full screen
  let pseudoFS = false;
  const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || pseudoFS;
  function toggleFullscreen() {
    if (fsOn()) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      if (pseudoFS) { pseudoFS = false; afterFS(); }
      return;
    }
    const req = shell.requestFullscreen || shell.webkitRequestFullscreen;
    // iOS Safari will not put a div full screen, so fall back to a fixed overlay
    // that fills the browser viewport instead of refusing the request.
    if (req) req.call(shell).then(afterFS).catch(() => { pseudoFS = true; afterFS(); });
    else { pseudoFS = true; afterFS(); }
  }
  function afterFS() {
    document.body.classList.toggle('fs-pseudo', pseudoFS);
    const on = fsOn();
    const btn = document.getElementById('x-full');
    if (btn) { btn.textContent = on ? 'EXIT FULL SCREEN' : 'FULL SCREEN'; btn.setAttribute('aria-pressed', on); }
    chooseMode();
    requestAnimationFrame(() => { fit(); positionCard(); });
  }
  function bindFullscreen() {
    const btn = document.getElementById('x-full');
    if (btn) btn.addEventListener('click', toggleFullscreen);
    const nb = document.getElementById('nav-full');
    if (nb) nb.addEventListener('click', e => { e.preventDefault(); toggleFullscreen(); });
    document.addEventListener('fullscreenchange', afterFS);
    document.addEventListener('webkitfullscreenchange', afterFS);
    addEventListener('keydown', e => { if (e.key === 'Escape' && pseudoFS) toggleFullscreen(); });
  }

  // ------------------------------------------------------------ selection
  const chipEl = slug => svg.querySelector(`[data-chip][data-slug="${CSS.escape(slug)}"]`);
  const centerOf = g => ({ x: +g.dataset.cx, y: +g.dataset.cy });

  function select(slug, fly) {
    const g = chipEl(slug);
    if (!g) return;
    clearSel(true);
    state.sel = slug;
    svg.classList.add('has-sel');
    g.classList.add('sel', 'lit');
    const links = svg.querySelector('.links');
    const from = centerOf(g);
    const rec = partners.bySlug[slug];
    const partnerRows = rec ? rec.partners : [];
    for (const p of partnerRows) {
      if (!p.slug) continue;
      const pg = chipEl(p.slug);
      if (!pg) continue;
      pg.classList.add('lit');
      const to = centerOf(pg);
      const mx = (from.x + to.x) / 2 + (to.y - from.y) * 0.12;
      const my = (from.y + to.y) / 2 + (from.x - to.x) * 0.12;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`);
      links.appendChild(path);
      if (!reducedMotion()) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 400ms ease';
        requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
      }
    }
    renderCard(slug, partnerRows);
    if (fly) {
      // park the company near the top left, with enough margin that it reads as
      // the thing in focus, and leave the room to its right for the card
      flyTo(from.x, from.y, Math.min(fitW, 2400), 0.2, 0.24);
      if (!reducedMotion()) {
        g.classList.remove('pulse'); void g.getBoundingClientRect();
        g.classList.add('pulse');
        setTimeout(() => g.classList.remove('pulse'), 2000);
      }
    }
    ensureFull().then(() => { if (state.sel === slug) renderCard(slug, partnerRows); });
    history.replaceState(null, '', location.pathname + location.search + '#' + slug);
  }

  function clearSel(soft) {
    state.sel = null;
    svg.classList.remove('has-sel');
    svg.querySelectorAll('.sel, .lit').forEach(el => el.classList.remove('sel', 'lit'));
    const links = svg.querySelector('.links');
    if (links) links.innerHTML = '';
    card.hidden = true;
    if (!soft) history.replaceState(null, '', location.pathname + location.search);
  }

  // The full records are 700KB, which is not worth loading for a page nobody may
  // click into. The card renders from the slim index first and fills in.
  function ensureFull() {
    return fullPromise || (fullPromise = json('data/av-companies.json')
      .then(a => { full = Object.fromEntries(a.map(c => [c.slug, c])); })
      .catch(() => { full = {}; }));
  }

  function renderCard(slug, partnerRows) {
    const meta = bySlug[slug] || {};
    const rec = (full && full[slug]) || null;
    const op = isOperator(slug);
    const hue = window.AV.HUES[meta.c] ?? 220;
    const grouped = {};
    for (const p of partnerRows) (grouped[p.k] = grouped[p.k] || []).push(p);
    const facts = rec ? [
      ['HQ', rec.hq], ['Founded', rec.founded], ['Maturity', rec.opMaturity],
      ['Deployment', rec.deployment], ['Fleet', rec.fleetSize],
      ['Funding', rec.fundingUSD ? fmtM(rec.fundingUSD) : ''],
      ['Valuation', rec.valuationUSD ? fmtM(rec.valuationUSD) : ''],
      ['Investors', rec.investors],
      ['Status', rec.status === 'active' ? 'Active'
        : (rec.acquiredBy ? 'Acquired by ' + rec.acquiredBy : 'Exited')],
      ['Also in', (rec.all || []).filter(a => a !== rec.cat && window.AV.HUES[a]).join(' · ')],
      ['Confidence', rec.confidence], ['Last verified', rec.lastVerified],
    ].filter(([, v]) => v) : [];
    const sources = (rec && rec.sources) || [];
    card.innerHTML = `
      <div class="cc-top">
        <span class="mono-tile cc-logo" aria-hidden="true" style="--tile:oklch(var(--layer-l) var(--layer-c) ${hue})">${esc((rec && rec.mono) || (meta.n || slug).slice(0, 2).toUpperCase())}${navLogo(slug)}</span>
        <div class="cc-id">
          <h2>${esc(meta.n || slug)}</h2>
          <p class="cc-layer"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${hue})"></span>${esc(meta.c || '')}${meta.r ? ' · ' + esc(meta.r) : ''}${meta.x ? ' · exited' : ''}${meta.g ? ' · <span class="gold-dot"></span> spoken with' : ''}</p>
        </div>
        <button class="cc-close" aria-label="Close details">×</button>
      </div>
      ${(rec && (rec.about || rec.sub)) || meta.b ? `<p class="cc-sub">${esc((rec && (rec.about || rec.sub)) || meta.b)}</p>` : ''}
      ${facts.length ? `<dl class="cc-facts">${facts.map(([k, v]) =>
        `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl>` : ''}
      <div class="cc-partners"><span class="pk">PARTNERSHIPS</span> ${partnerRows.length
        ? Object.entries(grouped).map(([k, ps]) =>
          `<div><span class="pk">${esc(k.toUpperCase())}</span> ${ps.map(p =>
            p.slug ? `<button data-go="${esc(p.slug)}">${esc(p.partner)}</button>` : esc(p.partner)
          ).join(' · ')}</div>`).join('')
        : '<span class="caption">None mapped yet. The footer takes corrections.</span>'}</div>
      ${sources.length ? `<div class="cc-src"><span class="pk">SOURCES</span>${sources.map(s =>
        `<div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${s.date ? ` <span class="caption">${esc(s.date)}</span>` : ''}</div>`).join('')}</div>` : ''}
      <div class="cc-actions">
        ${op ? `<a class="btn" href="${ROOT}operators/${esc(slug)}/">OPERATOR PAGE</a>` : ''}
        <a class="btn" href="${ROOT}companies/?open=${encodeURIComponent(slug)}">${op ? 'LEDGER ROW' : 'OPEN IN THE LEDGER'}</a>
      </div>`;
    card.hidden = false;
    card.querySelector('.cc-close').addEventListener('click', () => clearSel());
    card.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.go, true)));
    positionCard();
  }

  // The card follows its company: it opens beside the chip and tracks it while
  // the camera moves, flipping to the other side rather than covering it.
  function positionCard() {
    if (!state.sel || card.hidden || card.classList.contains('sheet')) return;
    const g = chipEl(state.sel);
    if (!g) return;
    const gb = g.getBoundingClientRect(), sb = stage.getBoundingClientRect();
    const vb = viewport.getBoundingClientRect();   // the chart, which may be
    const cw = card.offsetWidth, ch = card.offsetHeight, PAD = 14;  // narrower
    const minL = vb.left - sb.left + PAD, maxL = vb.right - sb.left - cw - PAD;
    let left = gb.right - sb.left + 18;
    if (left > maxL) left = gb.left - sb.left - cw - 18;   // flip rather than cover
    left = Math.max(minL, Math.min(left, maxL));
    const top = Math.max(vb.top - sb.top + PAD,
      Math.min(gb.top - sb.top - 8, vb.bottom - sb.top - ch - PAD));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }

  // ------------------------------------------------------------ filters
  function buildRail() {
    const fl = document.getElementById('f-layers');
    fl.innerHTML = '<span class="rail-label">Layer</span>' + L.districts.map(d => {
      const key = SHORT[d.layer];
      return `<button class="chip" data-flayer="${key}" aria-pressed="false">
        <span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))}</button>`;
    }).join('') + `<button class="chip" data-flayer="middleware" aria-pressed="false">
        <span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling</button>`;
    const regions = [...new Set(slim.map(c => c.r).filter(Boolean))];
    document.getElementById('f-regions').innerHTML = regions.map(r =>
      `<button class="chip" data-fregion="${REGION_KEY(r)}" aria-pressed="false">${esc(r)}</button>`).join('');
    document.getElementById('f-mats').innerHTML = MATS.map(mt =>
      `<button class="chip" data-fmat="${mt}" aria-pressed="false">${mt}</button>`).join('');

    rail.addEventListener('click', e => {
      const b = e.target.closest('button.chip'); if (!b) return;
      const tog = (set, v) => set.has(v) ? set.delete(v) : set.add(v);
      if (b.dataset.flayer) tog(state.layers, b.dataset.flayer);
      else if (b.dataset.fregion) tog(state.regions, b.dataset.fregion);
      else if (b.dataset.fmat) tog(state.mats, b.dataset.fmat);
      else if (b.id === 'f-spoken') state.spoken = !state.spoken;
      else if (b.id === 'f-exited') state.exited = !state.exited;
      else if (b.id === 'f-clear') {
        state.layers.clear(); state.regions.clear(); state.mats.clear();
        state.spoken = state.exited = false; state.q = '';
        document.getElementById('f-text').value = '';
      } else return;
      applyFilters();
    });
    let ft;
    document.getElementById('f-text').addEventListener('input', e => {
      clearTimeout(ft);
      ft = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); applyFilters(); }, 120);
    });
  }

  function matches(g) {
    if (state.layers.size && !state.layers.has(g.dataset.cat)) return false;
    if (state.regions.size && !state.regions.has(g.dataset.region)) return false;
    if (state.mats.size && !state.mats.has(g.dataset.mat)) return false;
    if (state.spoken && !g.dataset.spoken) return false;
    if (state.exited && !g.dataset.exited) return false;
    if (state.q && !g.dataset.text.includes(state.q)) return false;
    return true;
  }

  function applyFilters() {
    const any = state.layers.size || state.regions.size || state.mats.size
      || state.spoken || state.exited || state.q;
    let n = 0;
    svg.querySelectorAll('[data-chip]').forEach(g => {
      const ok = !any || matches(g);
      g.classList.toggle('dimmed', any && !ok);
      if (ok) n++;
    });
    rail.querySelectorAll('[data-flayer]').forEach(b => b.setAttribute('aria-pressed', state.layers.has(b.dataset.flayer)));
    rail.querySelectorAll('[data-fregion]').forEach(b => b.setAttribute('aria-pressed', state.regions.has(b.dataset.fregion)));
    rail.querySelectorAll('[data-fmat]').forEach(b => b.setAttribute('aria-pressed', state.mats.has(b.dataset.fmat)));
    document.getElementById('f-spoken').setAttribute('aria-pressed', state.spoken);
    document.getElementById('f-exited').setAttribute('aria-pressed', state.exited);
    document.getElementById('f-clear').hidden = !any;
    liveState.textContent = any
      ? `${n} of ${L.meta.companyCount} organisations match. Non-matching chips are dimmed in place, never removed.` : '';
    syncURL();
    if (navWrap && !navWrap.hidden) buildNavigator();
  }

  function syncURL() {
    const p = new URLSearchParams();
    if (state.layers.size) p.set('layer', [...state.layers].join(','));
    if (state.regions.size) p.set('region', [...state.regions].join(','));
    if (state.mats.size) p.set('maturity', [...state.mats].join(','));
    if (state.spoken) p.set('spoken', '1');
    if (state.exited) p.set('exited', '1');
    if (state.q) p.set('q', state.q);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + (state.sel ? '#' + state.sel : ''));
  }
  function readURL() {
    const p = new URLSearchParams(location.search);
    (p.get('layer') || '').split(',').filter(Boolean).forEach(v => state.layers.add(v));
    (p.get('region') || '').split(',').filter(Boolean).forEach(v => state.regions.add(v));
    (p.get('maturity') || '').split(',').filter(Boolean).forEach(v => state.mats.add(v));
    state.spoken = p.get('spoken') === '1';
    state.exited = p.get('exited') === '1';
    state.q = (p.get('q') || '').toLowerCase();
    document.getElementById('f-text').value = state.q;
  }

  // ------------------------------------------------------------ keyboard
  let kbd = null;
  function bindKeys() {
    viewport.addEventListener('keydown', e => {
      const DIR = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      if (e.key === '+' || e.key === '=') { zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1.45); e.preventDefault(); }
      else if (e.key === '-') { zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1 / 1.45); e.preventDefault(); }
      else if (e.key === 'Home') { fit(); e.preventDefault(); }
      else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); e.preventDefault(); }
      else if (e.key === 'Escape') { clearSel(); setKbd(null); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (kbd) { select(kbd.dataset.slug, true); e.preventDefault(); }
      } else if (DIR[e.key]) {
        e.preventDefault();
        moveKbd(DIR[e.key]);
      }
    });
  }
  function setKbd(g) {
    if (kbd) kbd.classList.remove('kbd-focus');
    kbd = g;
    if (g) {
      g.classList.add('kbd-focus');
      setHot(g.closest('.district'));
      const c = centerOf(g);
      const pad = cam.w * 0.06;
      if (c.x < cam.x + pad || c.x > cam.x + cam.w - pad || c.y < cam.y + pad || c.y > cam.y + cam.h - pad) {
        flyTo(c.x, c.y, cam.w);
      }
      liveState.textContent = g.getAttribute('aria-label');
    }
  }
  function moveKbd([dx, dy]) {
    const all = [...svg.querySelectorAll('[data-chip]:not(.dimmed)')];
    if (!all.length) return;
    if (!kbd) {
      const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2;
      setKbd(all.reduce((best, g) => {
        const c = centerOf(g), d = Math.hypot(c.x - cx, c.y - cy);
        return !best || d < best.d ? { g, d } : best;
      }, null).g);
      return;
    }
    const from = centerOf(kbd);
    let best = null;
    for (const g of all) {
      if (g === kbd) continue;
      const c = centerOf(g);
      const vx = c.x - from.x, vy = c.y - from.y;
      const along = vx * dx + vy * dy;
      if (along <= 10) continue;
      const ortho = Math.abs(vx * dy) + Math.abs(vy * dx);
      const cost = along + ortho * 2.5;
      if (!best || cost < best.cost) best = { g, cost };
    }
    if (best) setKbd(best.g);
  }

  // ------------------------------------------------------------ export
  async function fontCSSWithData() {
    try {
      const cssURL = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap';
      const css = await (await fetch(cssURL)).text();
      const urls = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map(mm => mm[1]);
      let out = css;
      await Promise.all(urls.slice(0, 8).map(async u => {
        const buf = await (await fetch(u)).arrayBuffer();
        let bin = ''; const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
        out = out.replace(u, 'data:font/woff2;base64,' + btoa(bin));
      }));
      return out;
    } catch (e) { return ''; }
  }
  async function exportString() {
    if (manifest && !atlasDataURL) {
      try {
        const blob = await (await fetch(ROOT + 'assets/logos/atlas.png')).blob();
        atlasDataURL = await new Promise(res => {
          const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob);
        });
      } catch (e) { /* monograms only */ }
    }
    const fonts = await fontCSSWithData();
    const defs = spriteText ? `<defs>${spriteText.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
      (fonts ? `<style>${fonts}</style>` : '') + defs + buildSVG(true) + '</svg>';
  }
  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  async function exportSVG() {
    download('av-ecosystem-wall-chart.svg',
      new Blob([await exportString()], { type: 'image/svg+xml' }));
  }
  async function exportPNG(mult) {
    const btn = document.getElementById('x-png' + mult);
    const old = btn.textContent; btn.textContent = 'RENDERING…';
    try {
      const str = await exportString();
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml' }));
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const canvas = document.createElement('canvas');
      canvas.width = W * mult; canvas.height = H * mult;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('blob');
      download(`av-ecosystem-wall-chart@${mult}x.png`, blob);
    } catch (e) {
      alert(`This browser cannot rasterise ${(W * mult)}×${(H * mult)} pixels in one canvas. The SVG export is lossless at any size; use it for print.`);
    } finally { btn.textContent = old; }
  }
  function bindExport() {
    document.getElementById('x-svg').addEventListener('click', exportSVG);
    document.getElementById('x-png2').addEventListener('click', () => exportPNG(2));
    document.getElementById('x-png4').addEventListener('click', () => exportPNG(4));
    document.getElementById('x-print').addEventListener('click', () => window.print());
  }

  // ------------------------------------------------------------ navigator (mobile)
  const isNarrow = () => matchMedia('(max-width: 859px)').matches
    && !new URLSearchParams(location.search).has('chart') && !fsOn();
  function buildNavigator() {
    const nav = document.getElementById('navigator');
    const districtChips = id => L.chips.filter(c => c.district === id)
      .filter(c => { const g = chipEl(c.slug); return !g || !g.classList.contains('dimmed'); });
    nav.innerHTML = `
      <div class="med-strip" role="list" aria-label="The ten operators">
        ${L.medallion.map(mo => `
          <button class="med-card" role="listitem" data-navsel="${esc(mo.slug)}">
            <span class="mono-tile" style="--tile:oklch(var(--layer-l) var(--layer-c) ${mo.hue})">${esc(mo.mono)}${navLogo(mo.slug)}</span>
            <span class="mc-name">${esc(mo.name)}</span>
            <span class="mc-claim">${esc(mo.claim || '')}</span>
          </button>`).join('')}
      </div>
      ${L.districts.map(d => `
        <details>
          <summary><span class="bar" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>
            ${esc(d.layer.replace('Governance: ', ''))}<span class="cnt">${d.count}</span></summary>
          <div class="dgrid">
            ${districtChips(d.id).map(c => `
              <button class="dchip${c.exited ? ' exited' : ''}" data-navsel="${esc(c.slug)}">
                ${c.spokenTo ? '<span class="gd gold-dot" aria-hidden="true"></span>' : ''}
                <span class="mono-tile" style="--tile:oklch(var(--layer-l) var(--layer-c) ${c.hue})">${esc(c.mono)}${navLogo(c.slug)}</span>
                <span>${esc(c.name)}</span>
              </button>`).join('')}
          </div>
        </details>`).join('')}`;
    nav.querySelectorAll('[data-navsel]').forEach(b =>
      b.addEventListener('click', () => {
        const slug = b.dataset.navsel;
        state.sel = slug;
        const rows = (partners.bySlug[slug] || { partners: [] }).partners;
        renderCard(slug, rows);
        ensureFull().then(() => { if (state.sel === slug) renderCard(slug, rows); });
        history.replaceState(null, '', location.pathname + location.search + '#' + slug);
      }));
  }
  function chooseMode() {
    const narrow = isNarrow();
    // On a phone there is no room to park a card beside a chip, so it becomes a
    // sheet even in full screen. It still has to live inside the element that
    // went full screen, or the browser would not paint it at all.
    const sheet = matchMedia('(max-width: 759px)').matches;
    stage.hidden = narrow;
    rail.hidden = narrow;
    navWrap.hidden = !narrow;
    card.classList.toggle('sheet', sheet);
    if (sheet) { card.style.left = card.style.top = ''; }
    ((narrow && !fsOn()) ? document.body : stage).appendChild(card);
    if (narrow) buildNavigator(); else fit();
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    const [layout, slimIdx, pIdx] = await Promise.all([
      json('data/poster-layout.json'), json('data/search-index.json'), json('data/partner-index.json')
    ]);
    L = layout; slim = slimIdx; partners = pIdx;
    W = L.meta.width; H = L.meta.height; MS = L.meta.medStyle;
    bySlug = Object.fromEntries(slim.map(c => [c.s, c]));

    try {  // logo assets are optional by design; monograms are the default
      manifest = await json('data/logo-manifest.json');
      if (manifest && Object.keys(manifest).some(k => manifest[k].format === 'svg')) {
        spriteText = await (await fetch(ROOT + 'assets/logos/sprite.svg')).text();
      }
    } catch (e) { manifest = null; }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // every layer lifts away from the same point, the centre of the hexagon
    svg.style.setProperty('--hx', L.hex.cx + 'px');
    svg.style.setProperty('--hy', L.hex.cy + 'px');
    svg.innerHTML = (spriteText ? `<defs>${spriteText.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</defs>` : '') + buildSVG(false);

    document.getElementById('legend-layers').innerHTML = L.districts.map(d =>
      `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))} <span class="n">${d.count}</span></span>`
    ).join('') + `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling renders inside the autonomy district <span class="n">3</span></span>
      <span class="lg"><span class="sw" style="background:var(--ink)"></span>The Ten, inside the hexagon <span class="n">10</span></span>`;

    // capture the deep-link hash before syncURL can rewrite the address bar
    const initial = decodeURIComponent(location.hash.slice(1));

    // stage anchors from the home-page loop: fly to a region, not a company
    const stageRect = id => {
      if (id === 'ten') return L.meta.medallionBox;
      const ids = STAGE_DISTRICTS[id];
      if (!ids) return null;
      const ds = L.districts.filter(d => ids.includes(d.id));
      if (!ds.length) return null;
      const x0 = Math.min(...ds.map(d => d.bbox.x)), y0 = Math.min(...ds.map(d => d.bbox.y));
      const x1 = Math.max(...ds.map(d => d.bbox.x + d.bbox.w));
      const y1 = Math.max(...ds.map(d => d.bbox.y + d.bbox.h));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };
    const flyToStage = id => {
      const r = stageRect(id);
      if (!r) return false;
      flyTo(r.x + r.w / 2, r.y + r.h / 2,
        Math.max(r.w * 1.12, r.h * 1.12 * vpSize().vw / vpSize().vh));
      const ids = id === 'ten' ? ['the-ten'] : (STAGE_DISTRICTS[id] || []);
      setHot(svg.querySelector(`.district[data-district="${CSS.escape(ids[0] || '')}"]`));
      return true;
    };

    sweepLogos();
    buildRail(); readURL(); bindCamera(); bindKeys(); bindExport(); bindFullscreen();
    chooseMode();
    applyFilters();
    matchMedia('(max-width: 859px)').addEventListener('change', chooseMode);
    if (initial) {
      // let first paint land, then fly (company slug or stage anchor)
      requestAnimationFrame(() => setTimeout(() => {
        if (chipEl(initial)) select(initial, true);
        else flyToStage(initial);
      }, 60));
    }
    addEventListener('hashchange', () => {
      const s = decodeURIComponent(location.hash.slice(1));
      if (s && chipEl(s) && s !== state.sel) select(s, true);
      else if (s && !chipEl(s)) flyToStage(s);
      else if (!s) clearSel(true);
    });

    window.AVposter = { select, fit, toggleFullscreen };
  }

  boot().catch(err => {
    viewport.innerHTML = `<p style="padding:24px" class="caption">The chart data failed to load (${esc(err.message)}). Reload, or view the <a href="${ROOT}poster-reference.svg">static reference render</a>.</p>`;
  });
})();
