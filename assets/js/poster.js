/* poster.js :: the wall chart.
   Renders data/poster-layout.json verbatim (geometry is frozen at build time),
   then adds camera, selection, filters, exports and keyboard navigation.

   The composition is one rounded plate with an octagon cut out of the middle:
   the passenger-autonomy companies inside the octagon, the ten remaining layers tiling the
   frame around it and sharing their borders.

   Filtering dims; it never reflows. One company, one chip, always. */
(function () {
  'use strict';
  const { ROOT, esc, json, fmtM, reducedMotion, LOGO_SOURCES, LOGO_MIN,
          probeLogo, mountLogos, ICON, linkedinSearch } = window.AV;

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
  const logoDomain = slug => (bySlug[slug] && (bySlug[slug].l || bySlug[slug].d)) || '';
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
    const domain = logoDomain(slug);
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
  // Each candidate is probed with a plain Image first, so its real pixel size is
  // known before anything is shown. The first mark at LOGO_MIN or better wins; if
  // no source clears the bar the largest one seen is used anyway, so a company
  // with only a small icon still gets its logo rather than dropping to a monogram.
  function bindLogo(img) {
    probeLogo(img.dataset.domain, href => {
      logoQueue.inflight--;
      if (href) {
        img.setAttribute('href', href);
        img.style.opacity = '1';
        const bg = svg.querySelector(`[data-logo-bg="${CSS.escape(img.dataset.logo)}"]`);
        if (bg) bg.style.opacity = '1';
      }
      pump();
    });
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

  // The viewport sweep only ever loads what the camera has visited, so marks kept
  // appearing one patch at a time as you panned, and a chip you never scrolled to
  // stayed a monogram forever. Once the on-screen marks are in flight, queue every
  // remaining one so the chart finishes loading on its own. Still capped at MAX
  // concurrent probes, so this fills in behind you rather than firing 561 requests
  // at once — the stall the sweep was written to avoid.
  //
  // Skipped entirely when the committed logo assets are present: those render
  // inline from the sprite and atlas, with no probing and nothing to stagger.
  function backfillLogos() {
    if (manifest) return;
    svg.querySelectorAll('image.logo-img:not([data-queued])').forEach(img => {
      img.dataset.queued = '1';
      logoQueue.pending.add(img);
    });
    pump();
  }
  const scheduleBackfill = () => (window.requestIdleCallback || (fn => setTimeout(fn, 1200)))(backfillLogos);

  // Navigator tiles and the card header are HTML, so a plain lazy <img> over the
  // monogram is enough.
  const navLogo = slug => {
    const d = logoDomain(slug);
    return d ? `<img alt="" data-logo-domain="${esc(d)}" decoding="async">` : '';
  };

  const poly = pts => pts.map(p => p.join(',')).join(' ');

  function buildSVG(forExport) {
    const m = L.meta, oc = L.oct, PL = m.plate;
    const X = forExport;  // export = fixed light-paper colours, no interactivity
    const C = {
      paper: X ? '#FAFAF7' : 'var(--paper)', ink: X ? '#12130F' : 'var(--ink)',
      card: X ? '#FFFFFF' : 'var(--paper-2)', rule: X ? '#DEDFD8' : 'var(--rule)',
      muted: X ? '#6E7268' : 'var(--muted)', yellow: X ? '#F2B705' : 'var(--yellow)',
      med: X ? '#F4F2E9' : 'var(--med-bg)', medtx: X ? '#12130F' : 'var(--med-ink)',
      medsub: X ? '#6E7268' : 'var(--med-sub)'
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
      o.push(`<g clip-path="url(#dc-${esc(d.id)})">`);
      o.push(`<rect class="d-tint" x="${hd.x}" y="${hd.y}" width="${hd.w}" height="${hd.h}" fill="${hueFill(d.hue)}" opacity=".13"/>`);
      o.push(`<rect x="${hd.x}" y="${hd.y + hd.h - 9}" width="${hd.w}" height="9" fill="${hueFill(d.hue)}"/>`);
      o.push(`</g>`);
      const sz = d.labelSize, n = d.labelLines.length;
      // Narrow side districts stack the count under the name instead of racing
      // it across the same line; wide ones keep name left, count right.
      const narrow = hd.tw < 1100 && n > 1;
      const block = n + (narrow ? 1 : 0);
      const base = hd.y + hd.h / 2 + sz * 0.36 - (sz * 0.62 * (block - 1)) / 2;
      d.labelLines.forEach((line, i) => {
        o.push(`<text x="${hd.tx + 30}" y="${base + i * sz * 1.06}" font-size="${sz}" font-weight="700" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(line)}</text>`);
      });
      if (narrow) {
        o.push(`<text x="${hd.tx + 30}" y="${base + n * sz * 1.06}" font-size="${sz * 0.8}" font-weight="600" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count} orgs</text>`);
      } else {
        o.push(`<text x="${hd.tx + hd.tw - 30}" y="${hd.y + hd.h / 2 + sz * 0.36}" font-size="${sz}" font-weight="600" text-anchor="end" font-family="IBM Plex Mono, monospace" fill="${hueFill(d.hue)}">${d.count} orgs</text>`);
      }
      // Each room draws a slice of its layer, so it has to say so. The control
      // names what is not on the wall and opens the full roster; in an export it
      // is still worth printing, because the chart should not look complete when
      // it is not.
      const hidden = (d.overflow || []).length;
      if (hidden && d.bar) {
        // The door, not a whisper: a bar the full width of the district that
        // says plainly how much of the layer is not on the wall.
        const b = d.bar;
        o.push(X ? `<g>` : `<g class="d-more" data-expand="${esc(d.id)}" role="button" tabindex="-1" aria-label="Show all ${d.count} organisations in ${esc(d.layer)}">`);
        o.push(`<rect class="d-bar" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="18" fill="${hueFill(d.hue)}" fill-opacity=".16" stroke="${hueFill(d.hue)}" stroke-width="3"/>`);
        o.push(`<text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 13}" text-anchor="middle" font-size="36" font-weight="600" font-family="IBM Plex Mono, monospace" fill="${C.ink}">SHOW ALL ${d.count} ORGS  ▾</text>`);
        o.push(`</g>`);
      }
      o.push(`<polygon class="d-edge" points="${poly(d.poly)}" fill="none" stroke="${C.rule}" stroke-width="3"/>`);
      if (!X) o.push(`<polygon class="d-glow" points="${poly(d.poly)}" fill="none" stroke="${hueFill(d.hue)}" stroke-width="9" opacity="0"/>`);
      o.push(`</g>`);

      for (const c of chipsOf[d.id] || []) {
        const cx = c.x + c.w / 2, cy = c.y;
        const meta = bySlug[c.slug] || {};
        if (!X) {
          const aria = [c.name, meta.c || '', meta.r || ''].filter(Boolean).join(', ')
            + (partners.bySlug[c.slug] ? `; ${partners.bySlug[c.slug].count} mapped partners` : '')
            + (c.spokenTo ? '; spoken with directly' : '') + (c.exited ? '; exited' : '');
          o.push(`<g data-chip data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + c.h / 2}" data-bx="${c.x + 8}" data-by="${c.y + 6}" data-bw="${c.w - 16}" data-bh="${c.h - 12}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${c.spokenTo ? 'data-spoken="1"' : ''} ${c.exited ? 'data-exited="1"' : ''} tabindex="-1" role="button" aria-label="${esc(aria)}">`);
        } else {
          o.push(`<g>`);
        }
        o.push(`<rect class="chip-body" x="${c.x + 8}" y="${c.y + 6}" width="${c.w - 16}" height="${c.h - 12}" rx="16" fill="${C.paper}" stroke="${C.rule}"/>`);
        o.push(logoMarkup(c.slug, cx, cy + 18, 172, c.hue, c.mono, X));
        wrapText(c.name).forEach((ln, i) => {
          o.push(`<text x="${cx}" y="${cy + 216 + i * 21}" font-size="19" text-anchor="middle" fill="${C.ink}" font-family="Archivo, sans-serif">${esc(ln)}</text>`);
        });
        (c.pips || []).forEach((hue, i) => {
          o.push(`<circle cx="${c.x + 28 + i * 20}" cy="${c.y + 26}" r="7" fill="${hueFill(hue)}"/>`);
        });
        if (c.exited) o.push(`<line x1="${c.x + 18}" y1="${c.y + 14}" x2="${c.x + c.w - 18}" y2="${c.y + c.h - 20}" stroke="${C.muted}" stroke-width="2.5" opacity=".5"/>`);
        if (c.spokenTo) o.push(`<circle cx="${c.x + c.w - 28}" cy="${c.y + 26}" r="7.5" fill="${C.yellow}"/>`);
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
        o.push(`<g data-chip data-med data-slug="${esc(c.slug)}" data-cx="${cx}" data-cy="${c.y + c.h / 2}" data-bx="${c.x + 12}" data-by="${c.y + 8}" data-bw="${c.w - 24}" data-bh="${c.h - 16}" data-cat="${esc(SHORT[meta.c] || '')}" data-region="${esc(REGION_KEY(meta.r || ''))}" data-mat="${esc(meta.m || '')}" data-text="${esc((c.name + ' ' + (meta.b || '')).toLowerCase())}" ${meta.g ? 'data-spoken="1"' : ''} tabindex="-1" role="button" aria-label="${esc(c.name + '; operator; ' + (c.claim || ''))}">`);
      } else o.push(`<g>`);
      // These used to be a bare mark on a dark slab, with no tile of their own,
      // which is much of why they read as a different species from the other 551.
      // They now get the same bounded tile every district chip has, so they
      // inherit the same hover and selection states and the same logo pipeline.
      o.push(`<rect class="chip-body" x="${c.x + 12}" y="${c.y + 8}" width="${c.w - 24}" height="${c.h - 16}" rx="22" fill="${C.paper}" stroke="${C.rule}"/>`);
      o.push(logoMarkup(c.slug, cx, c.y + MS.logoY, MS.logo, c.hue, c.mono, X));
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

  // ------------------------------------------------------ the layer roster
  // A district draws a slice of its layer; this is where the rest lives. Drawn
  // and undrawn companies are listed together, because to a reader they are all
  // just "the companies in this layer" — which of them happened to get a tile is
  // an artefact of the chart, not a fact about the industry.
  let rosterLayer = null;
  const rosterEl = () => document.getElementById('roster');

  function rosterRows(d) {
    const drawn = L.chips.filter(c => c.district === d.id)
      .map(c => ({ name: c.name, slug: c.slug, mono: c.mono, exited: c.exited, on: true }));
    const rest = (d.overflow || [])
      .map(c => ({ name: c.name, slug: c.slug, mono: c.mono, exited: c.exited, on: false }));
    return drawn.concat(rest).sort((a, b) => a.name.localeCompare(b.name));
  }

  function paintRoster(q) {
    const d = rosterLayer;
    if (!d) return;
    const rows = rosterRows(d);
    const needle = (q || '').trim().toLowerCase();
    const hits = needle ? rows.filter(r => r.name.toLowerCase().includes(needle)) : rows;
    document.getElementById('roster-state').textContent =
      needle ? `${hits.length} of ${rows.length} match` : `${rows.length} organisations`;
    document.getElementById('roster-list').innerHTML = hits.map(r =>
      `<li><button data-go="${esc(r.slug)}">
        <span class="mono-tile" style="--tile:oklch(var(--tile-l) var(--tile-c) ${d.hue})">${esc(r.mono)}</span>
        <span>${esc(r.name)}${r.exited ? ' <s class="caption">exited</s>' : ''}</span>
        ${r.on ? '<span class="rk">on chart</span>' : ''}
      </button></li>`).join('') ||
      '<li><p class="caption" style="padding:8px 4px">No match in this layer.</p></li>';
    document.getElementById('roster-list').querySelectorAll('button[data-go]').forEach(b =>
      b.addEventListener('click', () => { closeRoster(); select(b.dataset.go, true); }));
  }

  function openRoster(id) {
    const d = L.districts.find(x => x.id === id);
    if (!d) return;
    rosterLayer = d;
    document.getElementById('roster-title').textContent =
      `${d.layer.replace('Governance: ', '')} · ${d.shown} of ${d.count} on the chart`;
    const q = document.getElementById('roster-q');
    q.value = '';
    paintRoster('');
    rosterEl().hidden = false;
    q.focus();
  }
  function closeRoster() {
    rosterEl().hidden = true;
    rosterLayer = null;
  }

  function bindRoster() {
    if (!rosterEl()) return;
    document.getElementById('roster-close').addEventListener('click', closeRoster);
    document.getElementById('roster-q').addEventListener('input', e => paintRoster(e.target.value));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !rosterEl().hidden) { closeRoster(); viewport.focus(); }
    });
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
        const ex = t && t.closest ? t.closest('[data-expand]') : null;
        const g = t && t.closest ? t.closest('[data-chip]') : null;
        if (ex) openRoster(ex.dataset.expand);
        else if (g) select(g.dataset.slug, true);
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

  // A partner line leaves a tile from the middle of whichever straight edge faces
  // its partner, so it never crosses the logo it is pointing at.
  function anchorOf(g, tx, ty) {
    const x = +g.dataset.bx, y = +g.dataset.by, w = +g.dataset.bw, h = +g.dataset.bh;
    const cx = x + w / 2, cy = y + h / 2, dx = tx - cx, dy = ty - cy;
    return Math.abs(dx) * h >= Math.abs(dy) * w
      ? { x: dx >= 0 ? x + w : x, y: cy }
      : { x: cx, y: dy >= 0 ? y + h : y };
  }

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
      const pc = centerOf(pg);
      const a = anchorOf(g, pc.x, pc.y), b = anchorOf(pg, from.x, from.y);
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.12;
      const my = (a.y + b.y) / 2 + (a.x - b.x) * 0.12;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
      links.appendChild(path);
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
      // deployment answers "where can I ride one", so it only belongs on the
      // companies that carry passengers
      ...(carriesPassengers(rec) ? [['Deployment', rec.deployment]] : []),
      ['Fleet', rec.fleetSize],
      ['Funding', rec.fundingUSD ? fmtM(rec.fundingUSD) : ''],
      ['Valuation', rec.valuationUSD ? fmtM(rec.valuationUSD) : ''],
      ['Investors', rec.investors],
      ['Status', rec.status === 'active' ? 'Active'
        : (rec.acquiredBy ? 'Acquired by ' + rec.acquiredBy : 'Exited')],
      ['Also in', (rec.all || []).filter(a => a !== rec.cat && window.AV.HUES[a]).join(' · ')],
      ['Last verified', rec.lastVerified],
    ].filter(([, v]) => v) : [];
    const sources = (rec && rec.sources) || [];
    const site = siteDomain(slug);
    card.innerHTML = `
      <div class="cc-top">
        <span class="mono-tile cc-logo" aria-hidden="true" style="--tile:oklch(var(--layer-l) var(--layer-c) ${hue})">${esc((rec && rec.mono) || (meta.n || slug).slice(0, 2).toUpperCase())}${navLogo(slug)}</span>
        <div class="cc-id">
          <h2>${esc(meta.n || slug)}</h2>
          <p class="cc-layer"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${hue})"></span>${esc(meta.c || '')}${meta.r ? ' · ' + esc(meta.r) : ''}${meta.x ? ' · exited' : ''}</p>
        </div>
        <button class="cc-close" aria-label="Close details">×</button>
      </div>
      ${meta.g ? '<p class="spoken-bar">SPOKEN WITH DIRECTLY</p>' : ''}
      ${site ? `<p class="cc-site"><a href="https://${esc(site)}" target="_blank" rel="noopener noreferrer">${ICON.globe}${esc(site)}</a></p>` : ''}
      <div class="cc-shot" hidden></div>
      ${(rec && (rec.about || rec.sub)) || meta.b ? `<p class="cc-sub">${esc((rec && (rec.about || rec.sub)) || meta.b)}</p>` : ''}
      ${rec && rec.leadership && rec.leadership !== 'N/A (defunct)' ? `<p class="cc-lead"><span class="pk">LEADERSHIP</span> ${people(rec.leadership, rec.name, rec.linkedin)}</p>` : ''}
      ${facts.length ? `<dl class="cc-facts">${facts.map(([k, v]) =>
        `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl>` : ''}
      <div class="cc-partners"><span class="pk">PARTNERSHIPS</span> ${partnerRows.length
        ? Object.entries(grouped).map(([k, ps]) =>
          `<div class="pg-row"><span class="pk">${esc(k.toUpperCase())}</span><div class="pg-chips">${ps.map(p =>
            p.slug
              ? `<button class="cc-partner" data-go="${esc(p.slug)}"><span class="mono-tile cp-logo" aria-hidden="true">${esc((p.partner || '??').slice(0, 2).toUpperCase())}${navLogo(p.slug)}</span><span>${esc(p.partner)}</span></button>`
              : `<span class="cc-partner is-plain">${esc(p.partner)}</span>`
          ).join('')}</div></div>`).join('')
        : '<span class="caption">None mapped yet. The footer takes corrections.</span>'}</div>
      ${sources.length ? `<div class="cc-src"><span class="pk">SOURCES</span>${sources.map(s =>
        `<div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${s.date ? ` <span class="caption">${esc(s.date)}</span>` : ''}</div>`).join('')}</div>` : ''}
      <div class="cc-actions">
        ${op ? `<a class="btn" href="${ROOT}companies/${esc(slug)}/">OPERATOR PAGE</a>` : ''}
        <a class="btn" href="${ROOT}companies/?open=${encodeURIComponent(slug)}">${op ? 'LEDGER ROW' : 'OPEN IN THE LEDGER'}</a>
      </div>`;
    card.hidden = false;
    card.querySelector('.cc-close').addEventListener('click', () => clearSel());
    card.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.go, true)));
    mountLogos(card);
    if (meta.w) window.AV.wikiSummary(meta.w).then(w => {
      const box = card.querySelector('.cc-shot');
      if (!w || !box || state.sel !== slug) return;
      box.innerHTML = `<a href="${esc(w.page)}" target="_blank" rel="noopener noreferrer">
        <img src="${esc(w.thumb)}" alt="${esc(meta.n || slug)}" loading="lazy" decoding="async">
        <span class="cc-credit">Wikipedia</span></a>`;
      box.hidden = false;
      positionCard();
    });
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
    const check = (attr, val, label) =>
      `<label><input type="checkbox" ${attr}="${esc(val)}"> ${label}</label>`;
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
        `${esc(mt)} <span class="n">${slim.filter(c => c.m === mt).length} orgs</span>`)).join('');

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
      <div class="med-strip" role="list" aria-label="Passenger autonomy">
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
    mountLogos(nav);
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
    // every layer lifts away from the same point, the centre of the octagon
    svg.innerHTML = (spriteText ? `<defs>${spriteText.replace(/^[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</defs>` : '') + buildSVG(false);

    document.getElementById('legend-layers').innerHTML = L.districts.map(d =>
      `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) ${d.hue})"></span>${esc(d.layer.replace('Governance: ', ''))} <span class="n">${d.count}</span></span>`
    ).join('') + `<span class="lg"><span class="sw" style="background:oklch(var(--layer-l) var(--layer-c) 105)"></span>Middleware &amp; Tooling renders inside the autonomy district <span class="n">3</span></span>
      <span class="lg"><span class="sw" style="background:var(--ink)"></span>Passenger autonomy, inside the octagon <span class="n">${L.medallion.length}</span></span>`;

    // capture the deep-link hash before syncURL can rewrite the address bar
    const initial = decodeURIComponent(location.hash.slice(1));

    // stage anchors from the home-page loop: fly to a region, not a company.
    // 'ten' is the old name for the passenger-autonomy stage; links carrying it
    // are already in the wild, so it still resolves.
    const stageRect = id => {
      if (id === 'passenger' || id === 'ten') return L.meta.medallionBox;
      const ids = STAGE_DISTRICTS[id];
      if (!ids) return null;
      const ds = L.districts.filter(d => ids.includes(d.id));
      if (!ds.length) return null;
      const x0 = Math.min(...ds.map(d => d.x)), y0 = Math.min(...ds.map(d => d.y));
      const x1 = Math.max(...ds.map(d => d.x + d.w));
      const y1 = Math.max(...ds.map(d => d.y + d.h));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };
    const flyToStage = id => {
      const r = stageRect(id);
      if (!r) return false;
      flyTo(r.x + r.w / 2, r.y + r.h / 2,
        Math.max(r.w * 1.12, r.h * 1.12 * vpSize().vw / vpSize().vh));
      const ids = (id === 'passenger' || id === 'ten')
        ? ['passenger-autonomy'] : (STAGE_DISTRICTS[id] || []);
      setHot(svg.querySelector(`.district[data-district="${CSS.escape(ids[0] || '')}"]`));
      return true;
    };

    sweepLogos();
    scheduleBackfill();
    buildRail(); readURL(); bindCamera(); bindKeys(); bindExport(); bindFullscreen(); bindRoster();
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
