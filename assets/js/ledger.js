/* ledger.js :: 560 rows, every field, sortable, filterable, exportable.
   All state serialises into the URL so any view is shareable. */
(function () {
  'use strict';
  const { ROOT, esc, fmtM, json, HUES, layerColor, mountLogos, ICON,
          linkedinSearch, wikiSummary, stockQuote } = window.AV;

  const SHORT = {
    'AV Driver / Autonomy Software': 'driver', 'Sensing & Compute Hardware': 'sensing',
    'Data, Maps & Simulation': 'data', 'AV Middleware & Tooling': 'middleware',
    'Vehicle Platform & Manufacturing': 'vehicle', 'Demand & Commercial Platforms': 'demand',
    'Fleet Operations & Depot': 'fleet', 'Connectivity & Infrastructure': 'connectivity',
    'Capital, Insurance & Risk': 'capital', 'Governance: Regulators & Government': 'regulators',
    'Governance: Standards, Safety & Advocacy': 'standards'
  };
  // stored in millions of miles; a bare toLocaleString would read as units
  const fmtMiles = v => !v ? '' :
    v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'bn'
      : v >= 1 ? v.toFixed(1).replace(/\.0$/, '') + 'm'
        : (v * 1000).toFixed(0) + 'k';

  const RKEY = r => (r || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const MATS = ['Scaled', 'Commercial', 'Pilot', 'R&D', 'Governance', 'Historical', 'Other'];

  let slimBySlug = {};
  const domainOf = c => (slimBySlug[c.slug] || {}).d || '';
  const logoDomainOf = c => (slimBySlug[c.slug] || {}).l || domainOf(c);
  const wikiOf = c => (slimBySlug[c.slug] || {}).w || '';
  const tickerOf = c => (slimBySlug[c.slug] || {}).t || '';
  // "Jane Doe and John Roe, co-CEOs" becomes linked names. The dataset holds no
  // verified profile URLs, so each links to a LinkedIn people search scoped by
  // company rather than to a guessed profile.
  const people = (str, company) => String(str).split(/;\s*/).map(part => {
    const m = part.match(/^([^,(]+?)(\s*[,(].*)?$/);
    if (!m || !/[A-Za-z]{2}/.test(m[1]) || /^(n\/a|none|unknown)/i.test(m[1])) return esc(part);
    const names = m[1].split(/\s+(?:and|&)\s+/).map(n => n.trim()).filter(Boolean);
    return names.map(n =>
      `<a class="li" href="${esc(linkedinSearch(n, company))}" target="_blank" rel="noopener noreferrer">${ICON.linkedin}${esc(n)}</a>`
    ).join(' and ') + esc(m[2] || '');
  }).join('; ');

  const layerTag = cat => `<span class="layer-tag"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${HUES[cat] ?? 220})"></span>${esc((cat || '').replace('Governance: ', ''))}</span>`;

  // Column registry. `on` columns are the default view; the rest live in the picker.
  const COLS = [
    { k: 'name', l: 'Company', on: 1, cls: 'c-name', v: c => c.name,
      // one flex wrapper inside the cell: a display value on the <td> itself would
      // drop it out of the table layout and its border would stop meeting the row's
      h: c => `<span class="nm-wrap"><span class="mono-tile row-logo" aria-hidden="true" style="--tile:${layerColor(c.cat)}">${esc((c.mono || c.name.slice(0, 2)).toUpperCase())}${logoDomainOf(c) ? `<img alt="" data-logo-domain="${esc(logoDomainOf(c))}" decoding="async">` : ''}</span><span class="nm">${esc(c.name)}</span>${c.spokenTo ? '<span class="spoken-tag">SPOKEN WITH DIRECTLY</span>' : ''}</span>` },
    { k: 'cat', l: 'Layer', on: 1, cls: 'c-cat', v: c => c.cat, h: c => layerTag(c.cat) },
    { k: 'sub', l: 'Sub-focus', on: 1, cls: 'c-sub', v: c => c.sub, h: c => `<span class="clamp">${esc(c.sub)}</span>` },
    { k: 'hq', l: 'HQ', on: 1, v: c => c.hq, h: c => esc(c.hq) },
    { k: 'region', l: 'Region', on: 1, cls: 'c-region', v: c => c.region, h: c => esc(c.region) },
    { k: 'founded', l: 'Founded', on: 1, num: 1, cls: 'num-cell', v: c => c.foundedYear || 0, h: c => c.foundedYear || '' },
    { k: 'maturity', l: 'Maturity', on: 1, v: c => c.opMaturity, h: c => `<span class="clamp">${esc(c.opMaturity || '')}</span>` },
    { k: 'funding', l: 'Funding', on: 1, num: 1, cls: 'num-cell c-funding', v: c => c.fundingUSD || 0, h: c => c.fundingUSD ? fmtM(c.fundingUSD) : '' },
    { k: 'fleet', l: 'Fleet', on: 1, num: 1, cls: 'num-cell', v: c => c.fleetSize || 0, h: c => c.fleetSize ? c.fleetSize.toLocaleString('en-US') : '' },
    { k: 'signal', l: 'Latest', on: 1, cls: 'c-signal', v: c => c.signal, h: c => `<span class="clamp">${esc(c.signal || '')}</span>` },
    { k: 'leadership', l: 'Leadership', v: c => c.leadership, h: c => `<span class="clamp">${esc(c.leadership || '')}</span>` },
    { k: 'model', l: 'Business model', v: c => c.model, h: c => `<span class="clamp">${esc(c.model || '')}</span>` },
    { k: 'financing', l: 'Financing', v: c => c.financing, h: c => `<span class="clamp">${esc(c.financing || '')}</span>` },
    { k: 'investors', l: 'Investors', v: c => c.investors, h: c => `<span class="clamp">${esc(c.investors || '')}</span>` },
    { k: 'deployment', l: 'Deployment', v: c => c.deployment, h: c => `<span class="clamp">${esc(c.deployment || '')}</span>` },
    { k: 'metrics', l: 'Metrics', v: c => c.metrics, h: c => `<span class="clamp">${esc(c.metrics || '')}</span>` },
    { k: 'partners', l: 'Partners', num: 1, cls: 'num-cell', v: c => c._pcount, h: c => c._pcount || '' },
    { k: 'valuation', l: 'Valuation', num: 1, cls: 'num-cell', v: c => c.valuationUSD || 0, h: c => c.valuationUSD ? fmtM(c.valuationUSD) : '' },
    // milesReal and milesVirtual are stored in MILLIONS of miles: Waymo's 220.6
    // is 220.6 million, not two hundred and twenty. Rendering the raw number
    // understated every operator on the map by six orders of magnitude.
    { k: 'milesReal', l: 'Real miles', num: 1, cls: 'num-cell', v: c => c.milesReal || 0, h: c => fmtMiles(c.milesReal) },
    { k: 'milesVirtual', l: 'Virtual miles', num: 1, cls: 'num-cell', v: c => c.milesVirtual || 0, h: c => fmtMiles(c.milesVirtual) },
    { k: 'acquiredBy', l: 'Acquirer', v: c => c.acquiredBy, h: c => esc(c.acquiredBy || '') },
    { k: 'segment', l: 'Segment', v: c => c.segment, h: c => esc(c.segment || '') },
    { k: 'status', l: 'Status', v: c => c.status, h: c => esc(c.status || '') },
  ];

  const state = {
    q: '', layers: new Set(), regions: new Set(), countries: new Set(), mats: new Set(),
    f0: '', f1: '', m0: '', m1: '', v0: '', v1: '',
    spoken: false, exited: false, partners: false, funded: false,
    sort: [['name', 'asc']], cols: new Set(), density: false, open: null
  };

  let rows = [];          // enriched company records
  let pIndex = null;
  let visible = [];       // current filter+sort result
  const $ = id => document.getElementById(id);

  // ------------------------------------------------------------ filtering
  const FILTERS = {
    q: c => !state.q || c._text.includes(state.q),
    layers: c => !state.layers.size || state.layers.has(c._layerKey),
    regions: c => !state.regions.size || state.regions.has(c._regionKey),
    countries: c => !state.countries.size || state.countries.has(c.hqCountry),
    mats: c => !state.mats.size || state.mats.has(c._mat),
    founded: c => (!state.f0 || (c.foundedYear || 0) >= +state.f0)
      && (!state.f1 || (c.foundedYear || 9999) <= +state.f1),
    funding: c => (!state.m0 && !state.m1) ||
      (c.fundingUSD != null && (!state.m0 || c.fundingUSD >= +state.m0) && (!state.m1 || c.fundingUSD <= +state.m1)),
    fleet: c => (!state.v0 && !state.v1) ||
      (c.fleetSize != null && (!state.v0 || c.fleetSize >= +state.v0) && (!state.v1 || c.fleetSize <= +state.v1)),
    spoken: c => !state.spoken || c.spokenTo,
    exited: c => !state.exited || c.status !== 'active',
    partners: c => !state.partners || c._pcount > 0,
    funded: c => !state.funded || (c.fundingUSD || 0) > 0,
  };
  const FILTER_NAMES = {
    q: 'text search', layers: 'layer', regions: 'region', countries: 'country',
    mats: 'maturity', founded: 'founded-year range', funding: 'funding range',
    fleet: 'fleet range', spoken: 'spoken-with', exited: 'exited-only',
    partners: 'has-mapped-partners', funded: 'has-disclosed-funding'
  };
  const activeFilters = () => Object.keys(FILTERS).filter(k => {
    if (k === 'q') return !!state.q;
    if (['layers', 'regions', 'countries', 'mats'].includes(k)) return state[k].size > 0;
    if (k === 'founded') return state.f0 || state.f1;
    if (k === 'funding') return state.m0 || state.m1;
    if (k === 'fleet') return state.v0 || state.v1;
    return state[k];
  });

  function applyAll() {
    const active = activeFilters();
    visible = rows.filter(c => active.every(k => FILTERS[k](c)));
    const [pk, pd] = state.sort[0] || ['name', 'asc'];
    const sec = state.sort[1];
    const col = k => COLS.find(cc => cc.k === k) || COLS[0];
    const cmp = (a, b, k, d) => {
      const cA = col(k).v(a), cB = col(k).v(b);
      const n = typeof cA === 'number' || typeof cB === 'number'
        ? (cA || 0) - (cB || 0)
        : String(cA || '').localeCompare(String(cB || ''));
      return d === 'desc' ? -n : n;
    };
    visible.sort((a, b) => cmp(a, b, pk, pd) || (sec ? cmp(a, b, sec[0], sec[1]) : 0)
      || a.name.localeCompare(b.name));
    render();
    syncURL();
  }

  // ------------------------------------------------------------ rendering
  const shownCols = () => COLS.filter(c => c.on || state.cols.has(c.k));

  function renderHead() {
    $('lg-head').innerHTML = '<tr>' + shownCols().map(c => {
      const cur = state.sort[0] && state.sort[0][0] === c.k ? state.sort[0][1] : null;
      const aria = cur ? ` aria-sort="${cur === 'asc' ? 'ascending' : 'descending'}"` : '';
      return `<th${aria}><button data-sort="${c.k}" title="Sort by ${esc(c.l)}; shift-click for a second key">${esc(c.l)}<span class="dir" aria-hidden="true">${cur ? (cur === 'asc' ? '▲' : '▼') : ''}</span></button></th>`;
    }).join('') + '</tr>';
  }

  function rowHTML(c) {
    const cols = shownCols().map(col =>
      `<td class="${col.cls || ''}">${col.h(c) ?? ''}</td>`).join('');
    return `<tr class="row${c.status !== 'active' ? ' exited' : ''}" data-slug="${esc(c.slug)}" id="r-${esc(c.slug)}"
      tabindex="0" aria-expanded="${state.open === c.slug}" aria-label="${esc(c.name)}, expand details">${cols}</tr>`;
  }

  function render() {
    renderHead();
    $('lg-body').innerHTML = visible.map(rowHTML).join('');
    mountLogos($('lg-body'));
    const empty = $('lg-empty');
    if (!visible.length) {
      const blocking = activeFilters().find(k => {
        const others = activeFilters().filter(o => o !== k);
        return rows.some(c => others.every(o => FILTERS[o](c)));
      });
      empty.innerHTML = `<p>Nothing matches. ${blocking ? `The <strong>${FILTER_NAMES[blocking]}</strong> filter is doing the excluding.` : 'The combination of filters excludes all 560.'}</p>
        <button class="btn" id="empty-clear">CLEAR ALL FILTERS</button>`;
      empty.hidden = false;
      $('empty-clear').addEventListener('click', clearAll);
    } else empty.hidden = true;
    if (state.open) {
      const tr = $('r-' + state.open);
      if (tr) openDetail(tr, state.open, false); else state.open = null;
    }
    const sortName = COLS.find(c => c.k === (state.sort[0] || [])[0]);
    $('lg-state').textContent = `${visible.length} of ${rows.length} organisations shown` +
      (sortName ? `, sorted by ${sortName.l.toLowerCase()} ${state.sort[0][1] === 'asc' ? 'ascending' : 'descending'}` : '') +
      (activeFilters().length ? `. Filters active: ${activeFilters().map(k => FILTER_NAMES[k]).join(', ')}.` : '.');
    $('lg-clear').hidden = !activeFilters().length;
  }

  // ------------------------------------------------------------ detail
  // A metrics string is one long sentence per company. Split it so each figure
  // stands on its own line, and separate the fragments that carry a number from
  // the ones that only say a number could not be established.
  function metricBullets(c) {
    const raw = [c.metrics, c.signal].filter(Boolean).join('; ');
    let depth = 0, guarded = '';
    for (const ch of raw) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
      guarded += (depth && (ch === ';' || ch === '.')) ? '\u0000' + ch.charCodeAt(0) : ch;
    }
    const parts = guarded.split(/;\s+|(?<=\.)\s+(?=[A-Z0-9])/)
      .map(s => s.replace(/\u0000(\d+)/g, (_, n) => String.fromCharCode(+n)))
      .map(s => s.trim().replace(/[;.]+$/, '')).filter(s => s.length > 3);
    const seen = new Set(), facts = [], caveats = [];
    for (const s of parts) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      (/\d/.test(s) && !/^(unknown|not )/i.test(s) ? facts : caveats).push(s);
    }
    return { facts: facts.slice(0, 8), caveats: caveats.slice(0, 2) };
  }

  const carriesPassengers = c => !!(slimBySlug[c.slug] || {}).p;

  // Everything that has to come off the network after the row opens: the picture,
  // and the share price where the company is listed and a quote provider is
  // configured. Both fail silently, because a detail panel that is missing a
  // photo is fine and one showing a wrong price is not.
  function fillDetailExtras(c, dt) {
    const title = wikiOf(c);
    if (title) wikiSummary(title).then(w => {
      const box = dt.querySelector('.d-shot');
      if (!w || !box || !box.isConnected) return;
      box.innerHTML = `<a href="${esc(w.page)}" target="_blank" rel="noopener noreferrer">
        <img src="${esc(w.thumb)}" alt="${esc(c.name)}" loading="lazy" decoding="async">
        <span class="d-credit">Wikipedia</span></a>`;
      box.hidden = false;
    });
    const slot = dt.querySelector('.d-quote');
    const ticker = slot && slot.dataset.ticker;
    if (!ticker) return;
    slot.innerHTML = `<span class="tick">${esc(ticker)}</span>`;
    stockQuote(ticker).then(q => {
      if (!q || !slot.isConnected) return;
      slot.innerHTML = `<span class="tick">${esc(ticker)}</span>
        <strong>${q.price.toFixed(2)}</strong>
        <span class="caption">as of ${q.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        ${q.at.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>`;
    });
  }

  function detailHTML(c) {
    const p = pIndex.bySlug[c.slug];
    const site = domainOf(c);
    const { facts, caveats } = metricBullets(c);
    const dl = [
      ['Type', c.type], ['All layers', (c.all || []).join(' · ')], ['HQ', c.hq],
      ['Markets', c.regions], ['Founded', c.founded],
      ['Business model', c.model], ['Financing', c.financing], ['Investors', c.investors],
      ['Maturity', c.opMaturity],
      // deployment answers "where can I ride one", so it stays on the companies
      // that carry passengers and comes off everyone else
      ...(carriesPassengers(c) ? [['Deployment', c.deployment]] : []),
      ['Status', c.status],
      ['Funding', c.fundingUSD ? fmtM(c.fundingUSD) : ''], ['Valuation', c.valuationUSD ? fmtM(c.valuationUSD) : ''],
      ['Fleet', c.fleetSize], ['Acquired by', c.acquiredBy], ['Segment', c.segment],
      ['Last verified', c.lastVerified],
    ].filter(([, v]) => v || v === 0);
    return `<div class="detail-inner">
      <div class="d-head">
        <span class="mono-tile d-logo" aria-hidden="true" style="--tile:${layerColor(c.cat)}">${esc(c.mono || c.name.slice(0, 2).toUpperCase())}${site ? `<img alt="" data-logo-domain="${esc(site)}" decoding="async">` : ''}</span>
        <div>
          <h3>${esc(c.name)}</h3>
          <p class="caption">${layerTag(c.cat)} · ${esc(c.region)}</p>
        </div>
        ${c.spokenTo ? '<p class="spoken-bar">SPOKEN WITH DIRECTLY</p>' : ''}
      </div>
      ${site ? `<p class="d-site"><a href="https://${esc(site)}" target="_blank" rel="noopener noreferrer">${ICON.globe}${esc(site)}</a>
        <span class="d-quote" data-ticker="${esc(tickerOf(c))}"></span></p>` : ''}
      <div class="d-shot" hidden></div>
      <p class="about">${esc(c.about || c.sub || '')}</p>
      ${c.leadership && c.leadership !== 'N/A (defunct)'
        ? `<div class="d-block"><h4>Leadership</h4><p class="d-people">${people(c.leadership, c.name)}</p></div>` : ''}
      ${facts.length || caveats.length ? `<div class="d-block"><h4>Key metrics</h4>
        ${facts.length ? `<ul class="d-metrics">${facts.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${caveats.map(s => `<p class="caption">${esc(s)}</p>`).join('')}</div>` : ''}
      <div class="d-block"><h4>Record</h4>
        <dl>${dl.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl></div>
      <div class="d-block d-src"><h4>In the news</h4>
        ${(c.sources || []).length ? c.sources.map(s =>
          `<div>${ICON.news} <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> <span class="caption">${esc(s.date)}</span></div>`).join('')
          : `<p class="caption">No article filed against this record yet. <a href="https://news.google.com/search?q=${encodeURIComponent('"' + c.name + '" autonomous')}" target="_blank" rel="noopener noreferrer">Search the news</a>, and the footer takes corrections.</p>`}
      </div>
      <div class="d-block d-partners"><h4>Mapped partnerships${p ? ` · ${p.count}` : ''}</h4>
        ${p ? '<ul>' + p.partners.map(pp =>
          `<li><span class="pk">${esc(pp.k.toUpperCase())}</span>${pp.slug
            ? `<a href="../companies/?open=${encodeURIComponent(pp.slug)}">${esc(pp.partner)}</a>`
            : esc(pp.partner)}${pp.n ? `<div class="caption">${esc(pp.n)}</div>` : ''}</li>`).join('') + '</ul>'
          : '<p class="caption">None mapped yet. If you know one, the button below reaches a human.</p>'}
      </div>
      <div class="d-actions">
        <a class="btn" href="../map/#${esc(c.slug)}">SHOW ON THE WALL CHART</a>
        <a class="btn" href="mailto:agyarek+avecosystemmap@gmail.com?subject=${encodeURIComponent('AV map: ' + c.name)}">HELP IMPROVE THIS CARD</a>
      </div>
    </div>`;
  }

  function closeDetail() {
    document.querySelectorAll('tr.detail').forEach(t => t.remove());
    document.querySelectorAll('tr.row[aria-expanded="true"]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    state.open = null;
  }
  function openDetail(tr, slug, scroll) {
    closeDetail();
    const c = rows.find(r => r.slug === slug);
    if (!c) return;
    state.open = slug;
    tr.setAttribute('aria-expanded', 'true');
    const dt = document.createElement('tr');
    dt.className = 'detail';
    dt.innerHTML = `<td colspan="${shownCols().length}">${detailHTML(c)}</td>`;
    tr.after(dt);
    mountLogos(dt);
    fillDetailExtras(c, dt);
    // scroll-margin-top on tr.row keeps the row clear of the sticky header
    tr.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  // ------------------------------------------------------------ export
  function exportRows(kind) {
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'json') {
      const blob = new Blob([JSON.stringify(visible.map(({ _text, _layerKey, _regionKey, _mat, _pcount, ...c }) => c), null, 1)],
        { type: 'application/json' });
      dl(`av-companies-view-${visible.length}-${stamp}.json`, blob);
      return;
    }
    const keys = ['id', 'name', 'slug', 'cat', 'sub', 'hq', 'hqCountry', 'region', 'foundedYear',
      'leadership', 'about', 'model', 'financing', 'investors', 'opMaturity', 'deployment',
      'metrics', 'signal', 'confidence', 'status', 'fundingUSD', 'valuationUSD', 'fleetSize',
      'acquiredBy', 'segment', 'spokenTo', 'lastVerified'];
    const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [keys.join(',')].concat(visible.map(c => keys.map(k => q(c[k])).join(','))).join('\n');
    dl(`av-companies-view-${visible.length}-${stamp}.csv`, new Blob(['﻿' + csv], { type: 'text/csv' }));
  }
  function dl(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  // ------------------------------------------------------------ URL state
  function syncURL() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.layers.size) p.set('layer', [...state.layers].join(','));
    if (state.regions.size) p.set('region', [...state.regions].join(','));
    if (state.countries.size) p.set('country', [...state.countries].join(','));
    if (state.mats.size) p.set('maturity', [...state.mats].join(','));
    if (state.f0) p.set('f0', state.f0); if (state.f1) p.set('f1', state.f1);
    if (state.m0) p.set('m0', state.m0); if (state.m1) p.set('m1', state.m1);
    if (state.v0) p.set('v0', state.v0); if (state.v1) p.set('v1', state.v1);
    for (const t of ['spoken', 'exited', 'partners', 'funded']) if (state[t]) p.set(t, '1');
    const s = state.sort.map(x => x.join(':')).join(',');
    if (s !== 'name:asc') p.set('sort', s);
    if (state.cols.size) p.set('cols', [...state.cols].join(','));
    if (state.density) p.set('density', 'compact');
    if (state.open) p.set('open', state.open);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }
  function readURL() {
    const p = new URLSearchParams(location.search);
    state.q = (p.get('q') || '').toLowerCase();
    (p.get('layer') || '').split(',').filter(Boolean).forEach(v => state.layers.add(v));
    (p.get('region') || '').split(',').filter(Boolean).forEach(v => state.regions.add(v));
    (p.get('country') || '').split(',').filter(Boolean).forEach(v => state.countries.add(v));
    (p.get('maturity') || '').split(',').filter(Boolean).forEach(v => state.mats.add(v));
    ['f0', 'f1', 'm0', 'm1', 'v0', 'v1'].forEach(k => { state[k] = p.get(k) || ''; });
    ['spoken', 'exited', 'partners', 'funded'].forEach(k => { state[k] = p.get(k) === '1'; });
    if (p.get('sort')) state.sort = p.get('sort').split(',').slice(0, 2)
      .map(x => x.split(':')).filter(x => COLS.some(c => c.k === x[0]))
      .map(([k, d]) => [k, d === 'desc' ? 'desc' : 'asc']);
    if (!state.sort.length) state.sort = [['name', 'asc']];
    (p.get('cols') || '').split(',').filter(k => COLS.some(c => c.k === k && !c.on))
      .forEach(k => state.cols.add(k));
    state.density = p.get('density') === 'compact';
    state.open = p.get('open');
  }

  // ------------------------------------------------------------ controls
  function buildControls(slimBySlug) {
    $('lg-layers').innerHTML = '<span class="rail-label">Layer</span>' +
      Object.entries(SHORT).map(([cat, key]) =>
        `<button class="chip" data-flayer="${key}" aria-pressed="false"><span class="dot" style="background:oklch(var(--layer-l) var(--layer-c) ${HUES[cat]})"></span>${esc(cat.replace('Governance: ', ''))}</button>`).join('');
    const regions = [...new Set(rows.map(c => c.region).filter(Boolean))];
    $('lg-regions').innerHTML = regions.map(r =>
      `<button class="chip" data-fregion="${RKEY(r)}" aria-pressed="false">${esc(r)}</button>`).join('');
    $('lg-mats').innerHTML = MATS.map(mt =>
      `<button class="chip" data-fmat="${mt}" aria-pressed="false">${mt}</button>`).join('');
    const countries = {};
    rows.forEach(c => { if (c.hqCountry) countries[c.hqCountry] = (countries[c.hqCountry] || 0) + 1; });
    $('country-pop').innerHTML = Object.entries(countries).sort((a, b) => b[1] - a[1])
      .map(([co, n]) => `<label><input type="checkbox" value="${esc(co)}"> ${esc(co)} <span class="caption">${n}</span></label>`).join('');
    $('col-pop').innerHTML = COLS.filter(c => !c.on).map(c =>
      `<label><input type="checkbox" value="${c.k}"> ${esc(c.l)}</label>`).join('');

    document.querySelector('main').addEventListener('click', e => {
      const sort = e.target.closest('[data-sort]');
      if (sort) {
        const k = sort.dataset.sort;
        const col = COLS.find(c => c.k === k);
        if (e.shiftKey && state.sort[0] && state.sort[0][0] !== k) {
          state.sort = [state.sort[0], [k, col.num ? 'desc' : 'asc']];
        } else if (state.sort[0] && state.sort[0][0] === k) {
          state.sort[0][1] = state.sort[0][1] === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort = [[k, col.num ? 'desc' : 'asc']];
        }
        applyAll(); return;
      }
      const chip = e.target.closest('button.chip');
      if (chip) {
        const tog = (set, v) => set.has(v) ? set.delete(v) : set.add(v);
        if (chip.dataset.flayer) tog(state.layers, chip.dataset.flayer);
        else if (chip.dataset.fregion) tog(state.regions, chip.dataset.fregion);
        else if (chip.dataset.fmat) tog(state.mats, chip.dataset.fmat);
        else if (chip.id === 't-spoken') state.spoken = !state.spoken;
        else if (chip.id === 't-exited') state.exited = !state.exited;
        else if (chip.id === 't-partners') state.partners = !state.partners;
        else if (chip.id === 't-funded') state.funded = !state.funded;
        else if (chip.id === 'lg-clear') { clearAll(); return; }
        else if (chip.id === 'lg-density') {
          state.density = !state.density;
          document.body.classList.toggle('compact', state.density);
          chip.setAttribute('aria-pressed', state.density); syncURL(); return;
        }
        else if (chip.id === 'lg-csv') { exportRows('csv'); return; }
        else if (chip.id === 'lg-json') { exportRows('json'); return; }
        else return;
        reflectChips(); applyAll(); return;
      }
      const tr = e.target.closest('tr.row');
      if (tr && !e.target.closest('a, button')) {
        if (state.open === tr.dataset.slug) { closeDetail(); syncURL(); }
        else { openDetail(tr, tr.dataset.slug, true); syncURL(); }
      }
    });
    document.querySelector('main').addEventListener('keydown', e => {
      const tr = e.target.closest && e.target.closest('tr.row');
      if (tr && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (state.open === tr.dataset.slug) { closeDetail(); syncURL(); }
        else { openDetail(tr, tr.dataset.slug, true); syncURL(); }
      }
    });

    let qt;
    $('lg-q').addEventListener('input', e => {
      clearTimeout(qt);
      qt = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); applyAll(); }, 140);
    });
    for (const [id, key] of [['r-f0', 'f0'], ['r-f1', 'f1'], ['r-m0', 'm0'], ['r-m1', 'm1'], ['r-v0', 'v0'], ['r-v1', 'v1']]) {
      $(id).addEventListener('input', e => {
        clearTimeout(qt);
        qt = setTimeout(() => { state[key] = e.target.value.replace(/[^\d]/g, ''); applyAll(); }, 200);
      });
    }
    $('country-pop').addEventListener('change', e => {
      const v = e.target.value;
      e.target.checked ? state.countries.add(v) : state.countries.delete(v);
      applyAll();
    });
    $('col-pop').addEventListener('change', e => {
      const v = e.target.value;
      e.target.checked ? state.cols.add(v) : state.cols.delete(v);
      applyAll();
    });
    $('sheet-toggle').addEventListener('click', () => {
      const open = document.body.classList.toggle('sheet-open');
      $('sheet-toggle').setAttribute('aria-expanded', open);
      $('sheet-toggle').textContent = open ? 'DONE' : 'FILTERS';
    });
  }

  function reflectChips() {
    document.querySelectorAll('[data-flayer]').forEach(b => b.setAttribute('aria-pressed', state.layers.has(b.dataset.flayer)));
    document.querySelectorAll('[data-fregion]').forEach(b => b.setAttribute('aria-pressed', state.regions.has(b.dataset.fregion)));
    document.querySelectorAll('[data-fmat]').forEach(b => b.setAttribute('aria-pressed', state.mats.has(b.dataset.fmat)));
    $('t-spoken').setAttribute('aria-pressed', state.spoken);
    $('t-exited').setAttribute('aria-pressed', state.exited);
    $('t-partners').setAttribute('aria-pressed', state.partners);
    $('t-funded').setAttribute('aria-pressed', state.funded);
  }
  function reflectInputs() {
    $('lg-q').value = state.q;
    $('r-f0').value = state.f0; $('r-f1').value = state.f1;
    $('r-m0').value = state.m0; $('r-m1').value = state.m1;
    $('r-v0').value = state.v0; $('r-v1').value = state.v1;
    document.body.classList.toggle('compact', state.density);
    $('lg-density').setAttribute('aria-pressed', state.density);
    $('country-pop').querySelectorAll('input').forEach(i => { i.checked = state.countries.has(i.value); });
    $('col-pop').querySelectorAll('input').forEach(i => { i.checked = state.cols.has(i.value); });
  }
  function clearAll() {
    Object.assign(state, { q: '', f0: '', f1: '', m0: '', m1: '', v0: '', v1: '', spoken: false, exited: false, partners: false, funded: false });
    state.layers.clear(); state.regions.clear(); state.countries.clear(); state.mats.clear();
    reflectChips(); reflectInputs(); applyAll();
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    const [companies, pidx, slim] = await Promise.all([
      json('data/av-companies.json'), json('data/partner-index.json'), json('data/search-index.json')
    ]);
    pIndex = pidx;
    slimBySlug = Object.fromEntries(slim.map(s => [s.s, s]));
    rows = companies.map(c => ({
      ...c,
      _text: [c.name, c.sub, c.about, c.deployment, c.investors].join(' ').toLowerCase(),
      _layerKey: SHORT[c.cat] || '', _regionKey: RKEY(c.region),
      _mat: (slimBySlug[c.slug] || {}).m || 'Other',
      _pcount: (pidx.bySlug[c.slug] || {}).count || 0,
    }));
    readURL();
    buildControls(slimBySlug);
    reflectChips(); reflectInputs();
    applyAll();
    if (state.open) {
      const tr = $('r-' + state.open);
      if (tr) { openDetail(tr, state.open, true); }
    }
    window.AVledger = {
      open(slug) {
        clearAll();
        const tr = $('r-' + slug);
        if (tr) { openDetail(tr, slug, true); syncURL(); }
      }
    };
  }
  boot().catch(err => {
    $('lg-body').innerHTML = `<tr><td colspan="10" class="caption" style="padding:24px">The ledger data failed to load (${esc(err.message)}). Reload, or download the <a href="${ROOT}data/av-companies.csv">raw CSV</a>.</td></tr>`;
  });
})();
