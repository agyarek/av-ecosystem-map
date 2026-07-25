/* poster.js — the wall chart.
   Renders data/poster-layout.json verbatim (geometry is frozen at build time),
   then adds camera, selection, filters, exports and keyboard navigation.
   Filtering dims; it never reflows. One company, one chip, always. */
(function () {
  'use strict';
  const { ROOT, esc, json, reducedMotion } = window.AV;

  const svg = document.getElementById('poster');
  const viewport = document.getElementById('poster-viewport');
  const stage = document.getElementById('poster-stage');
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
  const REGION_KEY = r => r.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const MATS = ['Scaled', 'Commercial', 'Pilot', 'R&D', 'Governance', 'Historical', 'Other'];

  let L = null, slim = null, bySlug = null, partners = null;
  let manifest = null, spriteText = null, atlasDataURL = null;
  let W = 0, H = 0;
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

  // ------------------------------------------------------------ SVG build
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
    // The deliberate fallback: a monogram tile in the layer hue. Rendered
    // consistently it reads as a design decision, not a missing image.
    const fill = forExport ? oklch(hue, 0.66, 0.06) : `oklch(var(--tile-l) var(--tile-c) ${hue})`;
    const txfill = forExport ? '#FFFFFF' : 'var(--tile-ink)';
    return `<rect x="${cx - half}" y="${cy}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${fill}"/>` +
      `<text x="${cx}" y="${cy + size * 0.69}" font-size="${size * 0.47}" font-weight="800" text-anchor="middle" fill="${txfill}" font-family="Archivo, sans-serif">${esc(mono)}</text>`;
  }

  function buildSVG(forExport) {
    const m = L.meta;
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

    for (const b of L.bands) {
      const ty = b.y + b.labelH * 0.66;
      o.push(`<g class="band-label">`);
      o.push(`<text x="${b.x}" y="${ty}" font-size="52" font-weight="800" letter-spacing="6" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(b.label)}</text>`);
      o.push(`<text x="${b.x + b.w}" y="${ty}" font-size="30" text-anchor="end" fill="${C.muted}" font-style="italic" font-family="Archivo, sans-serif">${esc(b.note)}</text>`);
      o.push(`<line x1="${b.x}" y1="${b.y + b.labelH - 14}" x2="${b.x + b.w}" y2="${b.y + b.labelH - 14}" stroke="${C.ink}" stroke-width="4"/>`);
      o.push(`</g>`);
    }

    for (const d of L.districts) {
      o.push(`<g class="district-shell">`);
      o.push(`<rect x="${d.x + 6}" y="${d.y + 6}" width="${d.w - 12}" height="${d.h - 12}" rx="14" fill="${C.card}" stroke="${C.rule}" stroke-width="2"/>`);
      o.push(`<rect x="${d.x + 6}" y="${d.y + 6}" width="${d.w - 12}" height="8" rx="4" fill="${hueFill(d.hue)}"/>`);
      const label = d.layer.replace('Governance: ', '');
      o.push(`<text x="${d.x + 26}" y="${d.y + d.headerH * 0.72}" font-size="34" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(label.toUpperCase())}</text>`);
      o.push(`<text x="${d.x + d.w - 26}" y="${d.y + d.headerH * 0.72}" font-size="34" font-weight="600" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count}</text>`);
      o.push(`</g>`);
    }

    for (const c of L.chips) {
      const cx = c.x + c.w / 2, cy = c.y;
      const meta = bySlug[c.slug] || {};
      if (!X) {
        const aria = [c.name, meta.c || '', meta.r || ''].filter(Boolean).join(', ')
          + (partners.bySlug[c.slug] ? `; ${partners.bySlug[c.slug].count} mapped partners` : '')
          + (c.spokenTo ? '; spoken with directly' : '') + (c.exited ? '; exited' : '');
        o.push(`<g data-chip data-slug="${esc(c.slug)}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${c.spokenTo ? 'data-spoken="1"' : ''} ${c.exited ? 'data-exited="1"' : ''} tabindex="-1" role="button" aria-label="${esc(aria)}">`);
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

    const mb = m.medallionBox;
    o.push(`<g class="medallion-shell"><rect x="${mb.x + 6}" y="${mb.y + 6}" width="${mb.w - 12}" height="${mb.h - 12}" rx="20" fill="${C.med}"/>`);
    o.push(`<text x="${mb.x + mb.w / 2}" y="${mb.y + 108}" font-size="60" font-weight="900" letter-spacing="14" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">THE TEN</text>`);
    o.push(`<text x="${mb.x + mb.w / 2}" y="${mb.y + 150}" font-size="26" text-anchor="middle" fill="${C.yellow}" font-family="IBM Plex Mono, monospace" letter-spacing="3">OPERATORS A PASSENGER CAN ACTUALLY MEET</text></g>`);
    for (const c of L.medallion) {
      const cx = c.x + c.w / 2;
      const meta = bySlug[c.slug] || {};
      if (!X) {
        o.push(`<g data-chip data-med data-slug="${esc(c.slug)}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${meta.g ? 'data-spoken="1"' : ''} tabindex="-1" role="button" aria-label="${esc(c.name + '; operator; ' + (c.claim || ''))}">`);
      } else o.push(`<g>`);
      const lm = manifest && manifest[c.slug];
      if (lm) {
        o.push(logoMarkup(c.slug, cx, c.y + 70, 136, c.hue, c.mono, X));
      } else {
        o.push(`<rect class="chip-body" x="${cx - 68}" y="${c.y + 70}" width="136" height="136" rx="28" fill="${C.medtx}"/>`);
        o.push(`<text x="${cx}" y="${c.y + 164}" font-size="62" font-weight="900" text-anchor="middle" fill="${C.med}" font-family="Archivo, sans-serif">${esc(c.mono)}</text>`);
      }
      o.push(`<text x="${cx}" y="${c.y + 248}" font-size="31" font-weight="700" text-anchor="middle" fill="${C.medtx}" font-family="Archivo, sans-serif">${esc(c.name)}</text>`);
      wrapText(c.claim || '', 30, 4).forEach((ln, j) => {
        o.push(`<text x="${cx}" y="${c.y + 292 + j * 26}" font-size="19" text-anchor="middle" fill="${C.medsub}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
      });
      o.push(`</g>`);
    }

    o.push(`<text x="${m.margin}" y="${H - 70}" font-size="30" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">AUTONOMOUS VEHICLE ECOSYSTEM MAP</text>`);
    o.push(`<text x="${W - m.margin}" y="${H - 70}" font-size="26" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${C.muted}">${m.companyCount} ORGANISATIONS · 11 LAYERS · COMPILED BY KOFI AGYARE-KWABI</text>`);
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
  }
  function clampCam() {
    const { vw, vh } = vpSize();
    cam.h = cam.w * vh / vw;
    const s = vw / cam.w;
    const minS = vw / fitW, maxS = 4;
    if (s < minS) { cam.w = fitW; cam.h = cam.w * vh / vw; }
    if (s > maxS) { cam.w = vw / maxS; cam.h = cam.w * vh / vw; }
    cam.x = cam.w >= W ? (W - cam.w) / 2 : Math.max(0, Math.min(W - cam.w, cam.x));
    cam.y = cam.h >= H ? (H - cam.h) / 2 : Math.max(0, Math.min(H - cam.h, cam.y));
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
  function flyTo(px, py, targetW) {
    const from = { ...cam }, token = ++flyToken;
    const to = { w: Math.max(vpSize().vw / 4, Math.min(fitW, targetW)) };
    to.h = to.w * vpSize().vh / vpSize().vw;
    to.x = px - to.w / 2; to.y = py - to.h / 2;
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
    let pinch0 = null, moved = false;
    viewport.addEventListener('pointerdown', e => {
      viewport.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
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
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; };
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);

    // click = select (suppressed after a drag)
    svg.addEventListener('click', e => {
      if (moved) return;
      const g = e.target.closest('[data-chip]');
      if (g) select(g.dataset.slug, false);
      else clearSel();
    });

    document.getElementById('z-in').addEventListener('click', () => zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1.45));
    document.getElementById('z-out').addEventListener('click', () => zoomAt(cam.x + cam.w / 2, cam.y + cam.h / 2, 1 / 1.45));
    document.getElementById('z-fit').addEventListener('click', fit);
    addEventListener('resize', () => { fit(); });
  }

  // ------------------------------------------------------------ selection
  const chipEl = slug => svg.querySelector(`[data-chip][data-slug="${CSS.escape(slug)}"]`);
  const centerOf = g => {
    const b = g.querySelector('.chip-body') || g;
    const x = parseFloat(b.getAttribute('x')), y = parseFloat(b.getAttribute('y'));
    return { x: x + parseFloat(b.getAttribute('width')) / 2, y: y + parseFloat(b.getAttribute('height')) / 2 };
  };

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
    if (fly) {
      flyTo(from.x, from.y, Math.min(fitW, 2600));
      if (!reducedMotion()) {
        g.classList.remove('pulse'); void g.getBoundingClientRect();
        g.classList.add('pulse');
        setTimeout(() => g.classList.remove('pulse'), 2000);
      }
    }
    renderCard(slug, partnerRows);
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

  function renderCard(slug, partnerRows) {
    const meta = bySlug[slug] || {};
    const isOp = L.medallion.some(mo => mo.slug === slug);
    const hue = window.AV.HUES[meta.c] ?? 220;
    const grouped = {};
    for (const p of partnerRows) (grouped[p.k] = grouped[p.k] || []).push(p);
    card.innerHTML = `
      <div class="cc-top"><h2>${esc(meta.n || slug)}</h2>
        <button class="cc-close" aria-label="Close details">×</button></div>
      <p class="cc-layer"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${hue})"></span>${esc(meta.c || '')}${meta.r ? ' · ' + esc(meta.r) : ''}${meta.x ? ' · exited' : ''}${meta.g ? ' · <span class="gold-dot"></span> spoken with' : ''}</p>
      ${meta.b ? `<p class="cc-sub">${esc(meta.b)}</p>` : ''}
      <div class="cc-partners">${partnerRows.length
        ? Object.entries(grouped).map(([k, ps]) =>
          `<div><span class="pk">${esc(k.toUpperCase())}</span> ${ps.map(p =>
            p.slug ? `<button data-go="${esc(p.slug)}">${esc(p.partner)}</button>` : esc(p.partner)
          ).join(' · ')}</div>`).join('')
        : '<span class="caption">No partnerships mapped yet. Know one? The footer takes corrections.</span>'}</div>
      <div class="cc-actions">
        ${isOp ? `<a class="btn" href="${ROOT}operators/${esc(slug)}/">OPERATOR PAGE</a>` : ''}
        <a class="btn" href="${ROOT}companies/?open=${encodeURIComponent(slug)}">FULL RECORD</a>
      </div>`;
    card.hidden = false;
    card.querySelector('.cc-close').addEventListener('click', () => clearSel());
    card.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.go, true)));
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
      ? `${n} of 560 organisations match. Non-matching chips are dimmed in place, never removed.` : '';
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
    && !new URLSearchParams(location.search).has('chart');
  function buildNavigator() {
    const nav = document.getElementById('navigator');
    const districtChips = id => L.chips.filter(c => c.district === id)
      .filter(c => { const g = chipEl(c.slug); return !g || !g.classList.contains('dimmed'); });
    nav.innerHTML = `
      <div class="med-strip" role="list" aria-label="The ten operators">
        ${L.medallion.map(mo => `
          <button class="med-card" role="listitem" data-navsel="${esc(mo.slug)}">
            <span class="mono-tile" style="--tile:oklch(var(--layer-l) var(--layer-c) ${mo.hue})">${esc(mo.mono)}</span>
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
                <span class="mono-tile" style="--tile:oklch(var(--layer-l) var(--layer-c) ${c.hue})">${esc(c.mono)}</span>
                <span>${esc(c.name)}</span>
              </button>`).join('')}
          </div>
        </details>`).join('')}`;
    nav.querySelectorAll('[data-navsel]').forEach(b =>
      b.addEventListener('click', () => {
        const slug = b.dataset.navsel;
        state.sel = slug;
        renderCard(slug, (partners.bySlug[slug] || { partners: [] }).partners);
        history.replaceState(null, '', location.pathname + location.search + '#' + slug);
      }));
  }
  function chooseMode() {
    const narrow = isNarrow();
    stage.hidden = narrow;
    rail.hidden = narrow;
    navWrap.hidden = !narrow;
    // the floating card must escape the hidden stage on small screens
    card.classList.toggle('sheet', narrow);
    (narrow ? document.body : stage).appendChild(card);
    if (narrow) buildNavigator(); else fit();
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    const [layout, slimIdx, pIdx] = await Promise.all([
      json('data/poster-layout.json'), json('data/search-index.json'), json('data/partner-index.json')
    ]);
    L = layout; slim = slimIdx; partners = pIdx;
    W = L.meta.width; H = L.meta.height;
    bySlug = Object.fromEntries(slim.map(c => [c.s, c]));

    try {  // logo assets are optional by design; monograms are the default
      manifest = await json('data/logo-manifest.json');
      if (manifest && Object.keys(manifest).some(k => manifest[k].format === 'svg')) {
        spriteText = await (await fetch(ROOT + 'assets/logos/sprite.svg')).text();
      }
    } catch (e) { manifest = null; }

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = (spriteText ? `<defs>${spriteText.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</defs>` : '') + buildSVG(false);

    document.getElementById('legend-layers').innerHTML = L.districts.map(d =>
      `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))} <span class="n">${d.count}</span></span>`
    ).join('') + `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling renders inside the autonomy district <span class="n">3</span></span>
      <span class="lg"><span class="sw" style="background:var(--ink)"></span>The Ten, centre <span class="n">10</span></span>`;

    // capture the deep-link hash before syncURL can rewrite the address bar
    const initial = decodeURIComponent(location.hash.slice(1));

    buildRail(); readURL(); bindCamera(); bindKeys(); bindExport();
    chooseMode();
    applyFilters();
    matchMedia('(max-width: 859px)').addEventListener('change', chooseMode);
    if (initial && chipEl(initial)) {
      // let first paint land, then fly
      requestAnimationFrame(() => setTimeout(() => select(initial, true), 60));
    }
    addEventListener('hashchange', () => {
      const s = decodeURIComponent(location.hash.slice(1));
      if (s && s !== state.sel) select(s, true);
      else if (!s) clearSel(true);
    });

    window.AVposter = { select };
  }

  boot().catch(err => {
    viewport.innerHTML = `<p style="padding:24px" class="caption">The chart data failed to load (${esc(err.message)}). Reload, or view the <a href="${ROOT}poster-reference.svg">static reference render</a>.</p>`;
  });
})();
