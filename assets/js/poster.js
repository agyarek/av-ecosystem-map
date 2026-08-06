/* poster.js :: the ecosystem map.
   Renders data/poster-layout.json verbatim (geometry is frozen at build time),
   then adds camera, selection, filters, exports and keyboard navigation.

   The composition is one tall rounded plate: full-width rows of districts
   stacked around the passenger-autonomy row at the centre. Every organisation
   has its own tile — the camera moves, the chart never abbreviates.

   Filtering dims; it never reflows. One company, one chip, always. */
(function () {
  'use strict';
  const { ROOT, esc, json, fmtM, reducedMotion,
          mountLogos, ICON, linkedinSearch } = window.AV;

  const svg = document.getElementById('poster');
  const viewport = document.getElementById('poster-viewport');
  const stage = document.getElementById('poster-stage');
  const shell = document.getElementById('map-shell');
  const rail = document.getElementById('map-rail');
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
  // same definitions the directory shows; tooltips so the labels explain themselves
  const MAT_DEFS = {
    Scaled: 'commercial service at meaningful volume',
    Commercial: 'charging real customers today',
    Pilot: 'live trials on real roads',
    'R&D': 'building, not yet deployed',
    Governance: 'regulators and standards bodies, not operating companies',
    Historical: 'shut down, exited or absorbed',
    Other: 'does not fit the operating spectrum',
  };

  let L = null, slim = null, bySlug = null, partners = null;
  let spriteText = null, atlasDataURL = null;
  const fullRecs = {};                       // complete records, one shard per selection
  const fullFetches = new Map();
  let W = 0, H = 0, MS = null, CS = null;
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
  const siteDomain = slug => (bySlug[slug] && bySlug[slug].d) || '';
  // Deployment answers "where can I ride one", which is only a question for the
  // organisations that carry passengers.
  const carriesPassengers = rec => !!(bySlug[rec.slug] || {}).p;
  // "Jane Doe, co-founder and CEO; John Roe, CTO" becomes linked names. The
  // dataset holds no verified profile URLs, so each name links to a LinkedIn
  // people search scoped by company rather than to a guessed profile.
  const people = (str, company, known) => String(str).split(/;\s*/).map(part => {
    const m = part.match(/^([^,(]+?)(\s*[,(].*)?$/);
    if (!m || !/[A-Za-z]{2}/.test(m[1]) || /^(n\/a|none|unknown)/i.test(m[1])) return esc(part);
    // co-leads are joined with "and" before the comma; any "and" after it is part
    // of a title ("co-founder and CEO") and must not be split on
    const names = m[1].split(/\s+(?:and|&)\s+/).map(n => n.trim()).filter(Boolean);
    return names.map(n =>
      `<a class="li" href="${esc((known && known[n]) || linkedinSearch(n, company))}" target="_blank" rel="noopener noreferrer">${ICON.linkedin}${esc(n)}</a>`
    ).join(' and ') + esc(m[2] || '');
  }).join('; ');

  // ------------------------------------------------------------ SVG build

  // lg is the chip's baked logo ref: 1 = sprite symbol, [x, y] = atlas cell,
  // 0 = no committed mark
  function logoMarkup(slug, lg, cx, cy, size, hue, mono, forExport) {
    const half = size / 2;
    if (lg === 1 && spriteText) {
      return `<use href="#logo-${esc(slug)}" x="${cx - half}" y="${cy}" width="${size}" height="${size}"/>`;
    }
    if (Array.isArray(lg) && L.meta.atlas) {
      const A = L.meta.atlas;
      // webp for live rendering (2.6x lighter); the export embeds the PNG so
      // the standalone SVG opens in editors that never learned webp
      const href = forExport && atlasDataURL ? atlasDataURL : ROOT + 'assets/logos/atlas.webp';
      return `<svg x="${cx - half}" y="${cy}" width="${size}" height="${size}" viewBox="${lg[0]} ${lg[1]} ${A.cell} ${A.cell}"><image href="${href}" width="${A.w}" height="${A.h}"/></svg>`;
    }
    // Typographic tile in the layer hue, for every mark the committed
    // manifest does not carry.
    const fill = forExport ? oklch(hue, 0.66, 0.06) : `oklch(var(--tile-l) var(--tile-c) ${hue})`;
    const txfill = forExport ? '#FFFFFF' : 'var(--tile-ink)';
    const tile =
      `<rect x="${cx - half}" y="${cy}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${fill}"/>` +
      `<text x="${cx}" y="${cy + size * 0.69}" font-size="${size * 0.47}" font-weight="800" text-anchor="middle" fill="${txfill}" font-family="Archivo, sans-serif">${esc(mono)}</text>`;
    return tile;
  }

  // Navigator tiles and the card header are HTML; mountLogos resolves these
  // from the committed manifest.
  const navLogo = (slug, name) =>
    `<img alt="${esc(name || '')}" data-logo="${esc(slug)}" width="256" height="256" decoding="async">`;

  const poly = pts => pts.map(p => p.join(',')).join(' ');

  function buildSVG(forExport) {
    const m = L.meta, oc = L.oct, PL = m.plate;
    const X = forExport;  // export = fixed light-paper colours, no interactivity
    const C = {
      paper: X ? '#FAFAF7' : 'var(--paper)', ink: X ? '#12130F' : 'var(--ink)',
      card: X ? '#FFFFFF' : 'var(--paper-2)', rule: X ? '#DEDFD8' : 'var(--rule)',
      muted: X ? '#6E7268' : 'var(--muted)', yellow: X ? '#F2B705' : 'var(--yellow)',
      med: X ? '#F4F2E9' : 'var(--med-bg)', medtx: X ? '#12130F' : 'var(--med-ink)',
      medsub: X ? '#63665C' : 'var(--med-sub)'
    };
    const hueFill = h => X ? oklch(h, 0.62, 0.075) : `oklch(var(--layer-l) var(--layer-c) ${h})`;
    const o = [];
    o.push(`<defs><clipPath id="plate-clip"><rect x="${PL.x}" y="${PL.y}" width="${PL.w}" height="${PL.h}" rx="${PL.rx}"/></clipPath>` +
      L.districts.map(d => `<clipPath id="dc-${esc(d.id)}"><polygon points="${poly(d.poly)}"/></clipPath>`).join('') +
      `</defs>`);
    o.push(`<rect width="${W}" height="${H}" fill="${C.paper}"/>`);
    o.push(`<g class="world">`);
    // One plate. The districts are rooms inside it, not panels floating on it.
    o.push(`<rect class="plate" x="${PL.x}" y="${PL.y}" width="${PL.w}" height="${PL.h}" rx="${PL.rx}" fill="${C.card}" stroke="${C.rule}" stroke-width="3"/>`);
    o.push(`<g clip-path="url(#plate-clip)">`);

    const chipsOf = {};
    for (const c of L.chips) (chipsOf[c.district] = chipsOf[c.district] || []).push(c);

    for (const d of L.districts) {
      // One group per layer: room and tiles light up together.
      o.push(X ? `<g>` : `<g class="district" data-district="${esc(d.id)}">`);
      o.push(`<g class="district-shell">`);
      const hd = d.header;
      // a whisper of the layer's own colour, so the plate reads as ten layers from
      // across the room and not as ten identical white rectangles
      o.push(`<polygon class="d-wash" points="${poly(d.poly)}" fill="${hueFill(d.hue)}" opacity=".05"/>`);
      // The header sits on the same ground as the tiles with nothing ruled
      // between them — the same language as the centre. The hue lives in the
      // count and descriptor text.
      const sz = d.labelSize, n = d.labelLines.length;
      // Top-anchored: name, then (in narrow side districts) the count, then the
      // one-line descriptor saying what the layer is.
      const narrow = hd.tw < 1100 && n > 1;
      const base = hd.y + 100;
      d.labelLines.forEach((line, i) => {
        o.push(`<text x="${hd.tx + 30}" y="${base + i * sz * 1.06}" font-size="${sz}" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(line)}</text>`);
      });
      let descBase = base + n * sz * 1.06;
      if (narrow) {
        o.push(`<text x="${hd.tx + 30}" y="${descBase}" font-size="${sz * 0.8}" font-weight="600" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count} orgs</text>`);
        descBase += sz * 0.9;
      } else {
        o.push(`<text x="${hd.tx + hd.tw - 30}" y="${base}" font-size="${sz}" font-weight="600" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count} orgs</text>`);
      }
      (d.desc || []).forEach((line, i) => {
        o.push(`<text x="${hd.tx + 30}" y="${descBase + i * (d.descSize + 6)}" font-size="${d.descSize || 24}" font-family="IBM Plex Mono, monospace" letter-spacing="2" fill="${C.muted}">${esc(line)}</text>`);
      });
      o.push(`<polygon class="d-edge" points="${poly(d.poly)}" fill="none" stroke="${C.rule}" stroke-width="3"/>`);
      if (!X) o.push(`<polygon class="d-glow" points="${poly(d.poly)}" fill="none" stroke="${hueFill(d.hue)}" stroke-width="9" opacity="0"/>`);
      o.push(`</g>`);

      for (const c of chipsOf[d.id] || []) {
        const cx = c.x + c.w / 2, cy = c.y;
        const meta = bySlug[c.slug] || {};
        if (!X) {
          const aria = [c.name, meta.c || '', meta.r || ''].filter(Boolean).join(', ')
            + (c.pc ? `; ${c.pc} mapped partners` : '')
            + (c.spokenTo ? '; spoken with directly' : '') + (c.exited ? '; exited' : '');
          o.push(`<g data-chip data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + c.h / 2}" data-bx="${c.x + 8}" data-by="${c.y + 6}" data-bw="${c.w - 16}" data-bh="${c.h - 12}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc(c.name.toLowerCase())}" ${c.spokenTo ? 'data-spoken="1"' : ''} ${c.exited ? 'data-exited="1"' : ''} tabindex="-1" role="button" aria-label="${esc(aria)}">`);
        } else {
          o.push(`<g>`);
        }
        o.push(`<rect class="chip-body" x="${c.x + 8}" y="${c.y + 6}" width="${c.w - 16}" height="${c.h - 12}" rx="16" fill="${C.paper}"/>`);
        o.push(logoMarkup(c.slug, c.logo, cx, cy + CS.logoY, CS.logo, c.hue, c.mono, X));
        wrapText(c.name, CS.nameChars, 2).forEach((ln, i) => {
          o.push(`<text x="${cx}" y="${cy + CS.nameY + i * CS.nameStep}" font-size="${CS.nameSize}" font-weight="700" text-anchor="middle" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
        });
        (c.sub || []).forEach((ln, j) => {
          o.push(`<text x="${cx}" y="${cy + CS.descY + j * CS.descStep}" font-size="${CS.descSize}" text-anchor="middle" fill="${C.muted}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
        });
        (c.pips || []).forEach((hue, i) => {
          o.push(`<circle cx="${c.x + 28 + i * 20}" cy="${c.y + 26}" r="7" fill="${hueFill(hue)}"/>`);
        });
        if (c.exited) o.push(`<line x1="${c.x + 18}" y1="${c.y + 14}" x2="${c.x + c.w - 18}" y2="${c.y + c.h - 20}" stroke="${C.muted}" stroke-width="2.5" opacity=".5"/>`);
        if (c.spokenTo) o.push(`<circle cx="${c.x + c.w - 28}" cy="${c.y + 26}" r="7.5" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1"/>`);
        o.push(`</g>`);
      }
      o.push(`</g>`);
    }

    o.push(`</g>`);   // end plate clip

    // ------------------------------------------------------- the centre
    // A rectangle now, not an octagon: a centred heading, one line saying what
    // the category is, and a grid of real tiles beneath it.
    const opts = poly(oc.points);
    o.push(X ? `<g>` : `<g class="district" data-district="passenger-autonomy">`);
    o.push(`<g class="medallion-shell">`);
    o.push(`<polygon class="oct-fill" points="${opts}" fill="${C.med}"/>`);
    o.push(`<polygon class="oct-edge" points="${opts}" fill="none" stroke="${C.yellow}" stroke-width="10"/>`);
    o.push(`<text x="${oc.cx}" y="${oc.titleY}" font-size="82" font-weight="900" letter-spacing="16" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">${esc(oc.title)}</text>`);
    o.push(`<text x="${oc.cx}" y="${oc.subY}" font-size="27" text-anchor="middle" fill="${C.medsub}" font-family="IBM Plex Mono, monospace" letter-spacing="4">${esc(oc.sub)} · ${esc(oc.foot)}</text>`);
    o.push(`</g>`);

    for (const c of L.medallion) {
      const cx = c.x + c.w / 2;
      const meta = bySlug[c.slug] || {};
      if (!X) {
        o.push(`<g data-chip data-med data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + c.h / 2}" data-bx="${c.x + 12}" data-by="${c.y + 8}" data-bw="${c.w - 24}" data-bh="${c.h - 16}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc(c.name.toLowerCase())}" ${meta.g ? 'data-spoken="1"' : ''} tabindex="-1" role="button" aria-label="${esc(c.name + '; operator; ' + (c.claim || ''))}">`);
      } else o.push(`<g>`);
      // These used to be a bare mark on a dark slab, with no tile of their own,
      // which is much of why they read as a different species from the other 551.
      // They now get the same bounded tile every district chip has, so they
      // inherit the same hover and selection states and the same logo pipeline.
      o.push(`<rect class="chip-body" x="${c.x + 12}" y="${c.y + 8}" width="${c.w - 24}" height="${c.h - 16}" rx="22" fill="${C.paper}"/>`);
      o.push(logoMarkup(c.slug, c.logo, cx, c.y + MS.logoY, MS.logo, c.hue, c.mono, X));
      o.push(`<text x="${cx}" y="${c.y + MS.nameY}" font-size="${MS.nameSize}" font-weight="700" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">${esc(c.name)}</text>`);
      wrapText(c.claim || '', MS.claimChars, 4).forEach((ln, j) => {
        o.push(`<text x="${cx}" y="${c.y + MS.claimY + j * MS.claimStep}" font-size="${MS.claimSize}" text-anchor="middle" fill="${C.medsub}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
      });
      o.push(`</g>`);
    }
    o.push(`</g>`);

    o.push(`<text x="${PL.x}" y="${H - 70}" font-size="30" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">AUTONOMOUS VEHICLE ECOSYSTEM MAP</text>`);
    o.push(`<text x="${PL.x + PL.w}" y="${H - 70}" font-size="26" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${C.muted}">${m.companyCount} ORGANISATIONS · 11 LAYERS · COMPILED BY KOFI AGYARE-KWABI</text>`);
    if (!X) o.push(`<g class="links" aria-hidden="true"></g>`);
    o.push(`</g>`);
    return o.join('');
  }

  // ------------------------------------------------------------ camera
  const cam = { x: 0, y: 0, w: 1, h: 1 };
  let fitW = 1;
  const vpSize = () => ({ vw: viewport.clientWidth, vh: viewport.clientHeight });

  function applyCam() {
    svg.setAttribute('viewBox', `${cam.x} ${cam.y} ${cam.w} ${cam.h}`);
    positionCard();
  }
  // Zoom is bounded at both ends: out to the whole chart, in to 1.5x the
  // default reading scale. Pan stops dead at the canvas edges — the chart is
  // scrollable to its margins, never past them.
  function clampCam() {
    const { vw, vh } = vpSize();
    fitW = Math.max(W, H * vw / vh);
    cam.h = cam.w * vh / vw;
    const s = vw / cam.w;
    const minS = vw / fitW;
    const maxS = 1.5 * vw / L.meta.homeView.w;
    if (s < minS) { cam.w = fitW; cam.h = cam.w * vh / vw; }
    if (s > maxS) { cam.w = L.meta.homeView.w / 1.5; cam.h = cam.w * vh / vw; }
    cam.x = cam.w >= W ? (W - cam.w) / 2 : Math.max(0, Math.min(W - cam.w, cam.x));
    cam.y = cam.h >= H ? (H - cam.h) / 2 : Math.max(0, Math.min(H - cam.h, cam.y));
  }
  function fit() {
    const { vw, vh } = vpSize();
    fitW = Math.max(W, H * vw / vh);
    cam.w = fitW; clampCam(); applyCam();
  }
  // The default view: the plate at full width, vertically centred on the
  // passenger-autonomy row. This is where the map boots and where it returns
  // after a resize or a fullscreen transition.
  function goHome() {
    const hv = L.meta.homeView, { vw, vh } = vpSize();
    cam.w = hv.w; cam.h = cam.w * vh / vw;
    cam.x = hv.cx - cam.w / 2; cam.y = hv.cy - cam.h / 2;
    clampCam(); applyCam();
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

  // The camera is bounded, not free: mouse drag pans anywhere, ctrl/cmd+wheel
  // (a trackpad pinch) and the +/- keys zoom between the whole chart and 1.5x
  // the default scale. Plain scrolling is never captured — the page scrolls
  // past the chart like any other content. Touch drag and pinch live only
  // inside full screen, so a phone's inline chart never traps its scroll.
  function bindCamera() {
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
      // a finger can wobble a few px and still mean "tap"
      const slop = e.pointerType === 'touch' ? 6 : 2;
      if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > slop) moved = true;
      if (!fsOn() && e.pointerType === 'touch') return;  // inline touch scrolls the page
      if (pts.size === 1) {
        const r = viewport.getBoundingClientRect();
        const dx = (e.clientX - prev.x) / r.width * cam.w;
        const dy = (e.clientY - prev.y) / r.height * cam.h;
        cam.x -= dx; cam.y -= dy; clampCam(); applyCam();
      } else if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = toPoster((a.x + b.x) / 2, (a.y + b.y) / 2);
        const targetW = pinch0.w * pinch0.d / Math.max(20, d);
        zoomAt(mid.x, mid.y, cam.w / targetW);
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
        // On a phone the inline chart is a doorway: the first tap opens it full
        // screen, and only inside full screen do taps reach the tiles.
        if (!fsOn() && e.pointerType === 'touch' && matchMedia('(max-width: 859px)').matches) {
          toggleFullscreen();
          downOn = null;
          return;
        }
        const t = downOn && downOn.closest ? downOn : document.elementFromPoint(e.clientX, e.clientY);
        const g = t && t.closest ? t.closest('[data-chip]') : null;
        if (g) select(g.dataset.slug);
        else clearSel();
      }
      downOn = null;
    };
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);

    // ctrl/cmd+wheel is a deliberate zoom (and how a trackpad pinch arrives);
    // a plain wheel is the page scrolling and passes straight through.
    viewport.addEventListener('wheel', e => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = toPoster(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.002));
    }, { passive: false });

    // hovering anywhere in a layer lights the whole layer
    svg.addEventListener('pointerover', e => setHot(e.target.closest('.district')));
    svg.addEventListener('pointerleave', () => setHot(null));

    // an iOS URL-bar or keyboard resize must not reset a pinched camera mid-use
    addEventListener('resize', () => {
      if (fsOn()) { clampCam(); applyCam(); } else goHome();
    });
  }

  // ------------------------------------------------------------ hover
  let hotEl = null;
  function setHot(el) {
    if (el === hotEl) return;
    if (hotEl) hotEl.classList.remove('hot');
    hotEl = el || null;
    // The rooms only lean while one of them is lit; without this every district
    // would carry a transform at rest and the plate would never sit flat.
    svg.classList.toggle('hot-on', !!hotEl);
    if (!hotEl) return;
    hotEl.classList.add('hot');
    // Districts share their borders, so a highlighted edge would be half-covered
    // by whichever neighbour happens to be drawn later. Lift it to the front.
    const links = svg.querySelector('.links');
    if (links && hotEl.parentNode === links.parentNode) links.parentNode.insertBefore(hotEl, links);
    else if (hotEl.parentNode) hotEl.parentNode.appendChild(hotEl);
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
    requestAnimationFrame(() => { goHome(); positionCard(); });
  }
  function bindFullscreen() {
    const btn = document.getElementById('x-full');
    if (btn) btn.addEventListener('click', toggleFullscreen);
    // the persistent overlay chrome: an exit that is always in the corner, and
    // a way back to the whole chart from any pinched-in view
    const ex = document.getElementById('fs-exit');
    if (ex) ex.addEventListener('click', toggleFullscreen);
    const ff = document.getElementById('fs-fit');
    if (ff) ff.addEventListener('click', fit);
    document.addEventListener('fullscreenchange', afterFS);
    document.addEventListener('webkitfullscreenchange', afterFS);
    addEventListener('keydown', e => { if (e.key === 'Escape' && pseudoFS) toggleFullscreen(); });
  }

  // ------------------------------------------------------------ selection
  const chipEl = slug => svg.querySelector(`[data-chip][data-slug="${CSS.escape(slug)}"]`);
  const centerOf = g => ({ x: +g.dataset.cx, y: +g.dataset.cy });

  // A partner line leaves a tile from the middle of whichever straight edge faces
  // its partner, so it never crosses the logo it is pointing at.
  function anchorOf(g, tx, ty) {
    const x = +g.dataset.bx, y = +g.dataset.by, w = +g.dataset.bw, h = +g.dataset.bh;
    const cx = x + w / 2, cy = y + h / 2, dx = tx - cx, dy = ty - cy;
    return Math.abs(dx) * h >= Math.abs(dy) * w
      ? { x: dx >= 0 ? x + w : x, y: cy }
      : { x: cx, y: dy >= 0 ? y + h : y };
  }

  async function select(slug) {
    const g = chipEl(slug);
    if (!g) return;
    clearSel(true);
    state.sel = slug;
    svg.classList.add('has-sel');
    g.classList.add('sel', 'lit');
    await Promise.all([ensurePartners(), ensureSlim()]);
    if (state.sel !== slug) return;   // superseded while the indexes loaded
    const links = svg.querySelector('.links');
    const from = centerOf(g);
    const rec = partners.bySlug[slug];
    const partnerRows = rec ? rec.partners : [];
    for (const p of partnerRows) {
      if (!p.slug) continue;
      const pg = chipEl(p.slug);
      if (!pg) continue;
      pg.classList.add('lit');
      const pc = centerOf(pg);
      const a = anchorOf(g, pc.x, pc.y), b = anchorOf(pg, from.x, from.y);
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.12;
      const my = (a.y + b.y) / 2 + (a.x - b.x) * 0.12;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
      links.appendChild(path);
    }
    renderCard(slug, partnerRows);
    // Selection never zooms, but it does travel: if the chosen chip (a search
    // hit, a partner link) sits outside the current view, pan it into frame at
    // the reader's own zoom level.
    {
      const px = cam.w * 0.06, py = cam.h * 0.06;
      if (from.x < cam.x + px || from.x > cam.x + cam.w - px ||
          from.y < cam.y + py || from.y > cam.y + cam.h - py) {
        flyTo(from.x, from.y, cam.w);
      }
    }
    ensureFullRec(slug).then(() => { if (state.sel === slug) renderCard(slug, partnerRows); });
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

  // Nothing beyond the layout loads at boot. The three detail payloads are
  // priced per interaction: the company's own ~1.5KB shard, the partner index
  // and the search index (for blurbs and site domains) all arrive on first
  // selection and are cached after that.
  function ensureFullRec(slug) {
    if (!fullFetches.has(slug)) {
      fullFetches.set(slug, json('data/companies/' + slug + '.json')
        .then(rec => { fullRecs[slug] = rec; })
        .catch(() => {}));
    }
    return fullFetches.get(slug);
  }
  let partnersPromise = null;
  function ensurePartners() {
    return partnersPromise || (partnersPromise = json('data/partner-index.json')
      .then(p => { partners = p; })
      .catch(() => { partners = { bySlug: {} }; }));
  }
  let slimPromise = null;
  function ensureSlim() {
    return slimPromise || (slimPromise = json('data/search-index.json').then(list => {
      for (const c of list) {
        const meta = bySlug[c.s];
        if (meta) { meta.b = c.b; meta.d = c.d; meta.t = c.t; }
      }
      // the boot chips filter on names only; blurbs join the haystack now
      svg.querySelectorAll('[data-chip]').forEach(g => {
        const meta = bySlug[g.dataset.slug];
        if (meta && meta.b) g.dataset.text += ' ' + String(meta.b).toLowerCase();
      });
    }).catch(() => {}));
  }

  function renderCard(slug, partnerRows) {
    const meta = bySlug[slug] || {};
    const rec = fullRecs[slug] || null;
    const op = isOperator(slug);
    const hue = window.AV.HUES[meta.c] ?? 220;
    const grouped = {};
    for (const p of partnerRows) (grouped[p.k] = grouped[p.k] || []).push(p);
    const facts = rec ? [
      ['HQ', rec.hq], ['Founded', rec.founded], ['Maturity', rec.opMaturity],
      // deployment answers "where can I ride one", so it only belongs on the
      // companies that carry passengers
      ...(carriesPassengers(rec) ? [['Deployment', rec.deployment]] : []),
      ['Fleet', rec.fleetSize],
      ['Funding', rec.fundingUSD ? fmtM(rec.fundingUSD) : ''],
      ['Valuation', rec.valuationUSD ? fmtM(rec.valuationUSD) : ''],
      ['Investors', rec.investors],
      ['Status', rec.status === 'active' ? 'Active'
        : (rec.acquiredBy ? 'Acquired by ' + rec.acquiredBy : 'Exited')],
      // every subcategory the company is active in, primary included, so a
      // click answers "where does this organisation sit" without zooming
      ['Active in', ((rec.all || []).filter(a => window.AV.HUES[a]).length
        ? (rec.all || []).filter(a => window.AV.HUES[a])
        : [rec.cat]).join(' · ')],
      ['Last verified', rec.lastVerified],
    ].filter(([, v]) => v) : [];
    const sources = (rec && rec.sources) || [];
    const site = siteDomain(slug);
    card.innerHTML = `
      <div class="cc-top">
        <span class="mono-tile cc-logo" aria-hidden="true" style="--tile:oklch(var(--layer-l) var(--layer-c) ${hue})">${esc((rec && rec.mono) || (meta.n || slug).slice(0, 2).toUpperCase())}${navLogo(slug, meta.n || slug)}</span>
        <div class="cc-id">
          <h2>${esc(meta.n || slug)}</h2>
          <p class="cc-layer"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${hue})"></span>${esc(meta.c || '')}${meta.r ? ' · ' + esc(meta.r) : ''}${meta.x ? ' · exited' : ''}</p>
        </div>
        <button class="cc-close" aria-label="Close details">×</button>
      </div>
      ${meta.g ? '<p class="spoken-bar">SPOKEN WITH DIRECTLY</p>' : ''}
      ${site ? `<p class="cc-site"><a href="https://${esc(site)}" target="_blank" rel="noopener noreferrer">${ICON.globe}${esc(site)}</a></p>` : ''}
      ${(rec && (rec.about || rec.sub)) || meta.b ? `<p class="cc-sub">${esc((rec && (rec.about || rec.sub)) || meta.b)}</p>` : ''}
      ${rec && rec.leadership && rec.leadership !== 'N/A (defunct)' ? `<p class="cc-lead"><span class="pk">LEADERSHIP</span> ${people(rec.leadership, rec.name, rec.linkedin)}</p>` : ''}
      ${facts.length ? `<dl class="cc-facts">${facts.map(([k, v]) =>
        `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl>` : ''}
      <div class="cc-partners"><span class="pk">PARTNERSHIPS</span> ${partnerRows.length
        ? Object.entries(grouped).map(([k, ps]) =>
          `<div class="pg-row"><span class="pk">${esc(k.toUpperCase())}</span><div class="pg-chips">${ps.map(p =>
            p.slug
              ? `<button class="cc-partner" data-go="${esc(p.slug)}"><span class="mono-tile cp-logo" aria-hidden="true">${esc((p.partner || '??').slice(0, 2).toUpperCase())}${navLogo(p.slug, p.partner)}</span><span>${esc(p.partner)}</span></button>`
              : `<span class="cc-partner is-plain">${esc(p.partner)}</span>`
          ).join('')}</div></div>`).join('')
        : `<span class="caption">If you know of any partnerships, please reach out to me.</span>
           <a class="btn cc-mail" href="${esc(window.AV.CORRECTION)}">EMAIL ME</a>`}</div>
      ${sources.length ? `<div class="cc-src"><span class="pk">SOURCES</span>${sources.map(s =>
        `<div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${s.date ? ` <span class="caption">${esc(s.date)}</span>` : ''}</div>`).join('')}</div>` : ''}
      <div class="cc-actions">
        ${op ? `<a class="btn" href="${ROOT}companies/${esc(slug)}/">OPERATOR PAGE</a>` : ''}
        <a class="btn" href="${ROOT}companies/?open=${encodeURIComponent(slug)}">${op ? 'DIRECTORY ROW' : 'OPEN IN THE DIRECTORY'}</a>
      </div>`;
    card.hidden = false;
    card.querySelector('.cc-close').addEventListener('click', () => clearSel());
    card.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.go)));
    mountLogos(card);
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
    // Checkbox dropdowns rather than chip rows: each group is one labelled
    // button opening a list you tick, with the count of each option beside it
    // so you can see how big a slice is before you commit to looking at it.
    const check = (attr, val, label, title) =>
      `<label${title ? ` title="${esc(title)}"` : ''}><input type="checkbox" ${attr}="${esc(val)}"> ${label}</label>`;
    const fl = document.getElementById('f-layers');
    fl.innerHTML = L.districts.map(d =>
      check('data-flayer', SHORT[d.layer],
        `<span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))} <span class="n">${d.count} orgs</span>`)
    ).join('') + check('data-flayer', 'middleware',
      `<span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling <span class="n">${slim.filter(c => SHORT[c.c] === 'middleware').length} orgs</span>`);
    const regions = [...new Set(slim.map(c => c.r).filter(Boolean))];
    document.getElementById('f-regions').innerHTML = regions.map(r =>
      check('data-fregion', REGION_KEY(r),
        `${esc(r)} <span class="n">${slim.filter(c => c.r === r).length} orgs</span>`)).join('');
    document.getElementById('f-mats').innerHTML = MATS.map(mt =>
      check('data-fmat', mt,
        `${esc(mt)} <span class="n">${slim.filter(c => c.m === mt).length} orgs</span>`,
        MAT_DEFS[mt])).join('');

    rail.addEventListener('change', e => {
      const i = e.target;
      if (!i.matches('input[type="checkbox"]')) return;
      const put = (set, v, on) => on ? set.add(v) : set.delete(v);
      if (i.dataset.flayer) put(state.layers, i.dataset.flayer, i.checked);
      else if (i.dataset.fregion) put(state.regions, i.dataset.fregion, i.checked);
      else if (i.dataset.fmat) put(state.mats, i.dataset.fmat, i.checked);
      else return;
      applyFilters();
    });
    // one open menu at a time, and outside clicks close it
    rail.querySelectorAll('details.picker').forEach(d => {
      d.addEventListener('toggle', () => {
        if (d.open) rail.querySelectorAll('details.picker[open]').forEach(o => { if (o !== d) o.open = false; });
      });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('details.picker'))
        rail.querySelectorAll('details.picker[open]').forEach(o => { o.open = false; });
    });

    rail.addEventListener('click', e => {
      const b = e.target.closest('button.chip'); if (!b) return;
      if (b.id === 'f-spoken') state.spoken = !state.spoken;
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
      ensureSlim();   // widen the haystack from names to names + blurbs
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
    rail.querySelectorAll('input[data-flayer]').forEach(b => { b.checked = state.layers.has(b.dataset.flayer); });
    rail.querySelectorAll('input[data-fregion]').forEach(b => { b.checked = state.regions.has(b.dataset.fregion); });
    rail.querySelectorAll('input[data-fmat]').forEach(b => { b.checked = state.mats.has(b.dataset.fmat); });
    // ticked-count badge on each dropdown button
    [['p-layers', state.layers], ['p-regions', state.regions], ['p-mats', state.mats]].forEach(([id, set]) => {
      const el = document.querySelector(`#${id} .pk-n`);
      if (el) { el.hidden = !set.size; el.textContent = set.size; }
    });
    document.getElementById('f-spoken').setAttribute('aria-pressed', state.spoken);
    document.getElementById('f-exited').setAttribute('aria-pressed', state.exited);
    document.getElementById('f-clear').hidden = !any;
    liveState.textContent = any
      ? `${n} of ${L.meta.companyCount} organisations match. Non-matching chips are dimmed in place, never removed.` : '';
    syncURL();
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
      if (e.key === 'Home') { fit(); e.preventDefault(); }
      else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') {
        zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1.25); e.preventDefault();
      } else if (e.key === '-' || e.key === '_') {
        zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 0.8); e.preventDefault();
      }
      else if (e.key === 'Escape') { clearSel(); setKbd(null); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (kbd) { select(kbd.dataset.slug); e.preventDefault(); }
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
  // The standalone SVG carries its own type: the site's committed woff2 files,
  // embedded as data URIs. The chart's text uses Archivo 600-900 and Plex Mono
  // 400 and 600; the serif never appears on the chart.
  const EXPORT_FONTS = [
    ["'Archivo'", 'assets/fonts/archivo-var.woff2', '400 900'],
    ["'IBM Plex Mono'", 'assets/fonts/plex-mono-400.woff2', '400'],
    ["'IBM Plex Mono'", 'assets/fonts/plex-mono-600.woff2', '600'],
  ];
  async function fontCSSWithData() {
    try {
      const faces = await Promise.all(EXPORT_FONTS.map(async ([family, path, weight]) => {
        const buf = await (await fetch(ROOT + path)).arrayBuffer();
        let bin = ''; const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
        return `@font-face{font-family:${family};font-weight:${weight};` +
          `src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
      }));
      return faces.join('');
    } catch (e) { return ''; }
  }
  async function exportString() {
    if (L.meta.atlas && !atlasDataURL) {
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
    download('av-ecosystem-map.svg',
      new Blob([await exportString()], { type: 'image/svg+xml' }));
  }
  async function exportPNG(mult, btn) {
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
      download(`av-ecosystem-map@${mult}x.png`, blob);
    } catch (e) {
      alert(`This browser cannot rasterise ${(W * mult)}×${(H * mult)} pixels in one canvas. The SVG export is lossless at any size; use it for print.`);
    } finally { btn.textContent = old; }
  }
  function bindExport() {
    document.getElementById('x-svg').addEventListener('click', exportSVG);
    // The chart is ~75 megapixels at 1x; browsers cap a single canvas around
    // 268MP, so 1.5x is the largest raster that renders anywhere. Print wants
    // the SVG, which is lossless at any size.
    const p1 = document.getElementById('x-png1');
    p1.addEventListener('click', () => exportPNG(1, p1));
    const p15 = document.getElementById('x-png15');
    p15.addEventListener('click', () => exportPNG(1.5, p15));
    // print reads the live viewBox, so square the camera up first
    document.getElementById('x-print').addEventListener('click', () => { fit(); window.print(); });
  }

  // ------------------------------------------------------------ layout mode
  // The chart itself renders at every width now — a phone gets the real thing
  // inline, tap-to-fullscreen to read it. The only mode left to choose is how
  // the card presents: parked beside a chip, or a bottom sheet on a phone.
  function chooseMode() {
    const sheet = matchMedia('(max-width: 759px)').matches;
    card.classList.toggle('sheet', sheet);
    if (sheet) { card.style.left = card.style.top = ''; }
  }

  // ------------------------------------------------------------ boot
  // v2 wire format: chips travel as per-district rows sharing the district's
  // tile size and hue. Inflate them back into the chip objects the renderer
  // was written against.
  function inflate(raw) {
    if (!raw.v) return raw;
    const chips = [];
    const districts = raw.districts.map(d => {
      const { rows, cw, ch, ...rest } = d;
      for (const r of rows) {
        const [slug, name, x, y, wh, mono, sub, pips, flags, region, mat, pc, logo] = r;
        chips.push({
          district: rest.id, layer: rest.layer, hue: rest.hue, slug, name, x, y,
          w: wh ? wh[0] : cw, h: wh ? wh[1] : ch, mono,
          sub: sub ? sub.split('\n') : [], pips: pips || [],
          spokenTo: !!(flags & 1), exited: !!(flags & 2), p: !!(flags & 4),
          region, mat, pc, logo: logo || 0,
        });
      }
      return rest;
    });
    return { ...raw, districts, chips };
  }

  async function boot() {
    L = inflate(await json('data/poster-layout.json'));
    const bootStatus = document.getElementById('filter-state');
    if (bootStatus) bootStatus.textContent = 'Drawing 562 tiles…';
    W = L.meta.width; H = L.meta.height; MS = L.meta.medStyle; CS = L.meta.chipStyle;
    bySlug = {};
    for (const c of L.chips) {
      bySlug[c.slug] = { n: c.name, c: c.layer, r: c.region, m: c.mat,
        ...(c.spokenTo ? { g: 1 } : {}), ...(c.exited ? { x: 1 } : {}),
        ...(c.p ? { p: 1 } : {}), pc: c.pc };
    }
    for (const mo of L.medallion) {
      bySlug[mo.slug] = { n: mo.name, c: mo.cat, r: mo.r, m: mo.m,
        ...((mo.f & 1) ? { g: 1 } : {}), ...((mo.f & 2) ? { x: 1 } : {}),
        ...((mo.f & 4) ? { p: 1 } : {}), pc: mo.pc };
    }
    slim = Object.values(bySlug);

    // committed marks only, baked into the layout; the sprite rides along
    // when any chip references a vector symbol
    if (L.chips.some(c => c.logo === 1) || L.medallion.some(mo => mo.logo === 1)) {
      try {
        spriteText = await (await fetch(ROOT + 'assets/logos/sprite.svg')).text();
      } catch (e) { spriteText = null; }
    }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (bootStatus) setTimeout(() => { if (bootStatus.textContent === 'Drawing 562 tiles…') bootStatus.textContent = ''; }, 600);
    // every layer lifts away from the same point, the centre of the plate
    svg.innerHTML = (spriteText ? `<defs>${spriteText.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</defs>` : '') + buildSVG(false);

    document.getElementById('legend-layers').innerHTML = L.districts.map(d =>
      `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))} <span class="n">${d.count}</span></span>`
    ).join('') + `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling renders inside the autonomy district <span class="n">3</span></span>
      <span class="lg"><span class="sw" style="background:var(--ink)"></span>Passenger autonomy, at the centre <span class="n">${L.medallion.length}</span></span>`;

    // capture the deep-link hash before syncURL can rewrite the address bar
    const initial = decodeURIComponent(location.hash.slice(1));

    // stage anchors from the home-page loop: light the region up rather than
    // flying the camera at it — the whole chart is always in frame now.
    // 'ten' is the old name for the passenger-autonomy stage; links carrying it
    // are already in the wild, so it still resolves.
    const highlightStage = id => {
      const ids = (id === 'passenger' || id === 'ten')
        ? ['passenger-autonomy'] : (STAGE_DISTRICTS[id] || []);
      if (!ids.length) return false;
      setHot(svg.querySelector(`.district[data-district="${CSS.escape(ids[0] || '')}"]`));
      return true;
    };

    buildRail(); readURL(); bindCamera(); bindKeys(); bindExport(); bindFullscreen();
    chooseMode();
    goHome();
    applyFilters();
    matchMedia('(max-width: 759px)').addEventListener('change', chooseMode);
    if (initial) {
      // let first paint land, then resolve (company slug or stage anchor)
      requestAnimationFrame(() => setTimeout(() => {
        if (chipEl(initial)) select(initial);
        else highlightStage(initial);
      }, 60));
    }
    addEventListener('hashchange', () => {
      const s = decodeURIComponent(location.hash.slice(1));
      if (s && chipEl(s) && s !== state.sel) select(s);
      else if (s && !chipEl(s)) highlightStage(s);
      else if (!s) clearSel(true);
    });

    window.AVposter = { select, fit, toggleFullscreen };
  }

  boot().catch(err => {
    viewport.innerHTML = `<p style="padding:24px" class="caption">The chart data failed to load (${esc(err.message)}). Reload, or view the <a href="${ROOT}poster-reference.svg">static reference render</a>.</p>`;
  });
})();
