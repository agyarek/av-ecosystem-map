/* core.js — shared chrome: theme, nav state, header search, helpers.
   Every page loads this; it must stay small and dependency-free. */
(function () {
  'use strict';

  // Root-relative path resolution: core.js knows where it lives, so every
  // page can address data/ and assets/ without hardcoding its own depth.
  const src = document.currentScript && document.currentScript.src || '';
  const ROOT = src.replace(/assets\/js\/core\.js.*$/, '');

  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtM = m => m >= 1000 ? '$' + (m / 1000).toFixed(m >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'B'
    : '$' + Math.round(m) + 'M';
  const jsonCache = new Map();
  const json = url => {
    const u = ROOT + url;
    if (!jsonCache.has(u)) jsonCache.set(u, fetch(u).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + u);
      return r.json();
    }));
    return jsonCache.get(u);
  };
  const HUES = {
    'AV Driver / Autonomy Software': 265, 'Sensing & Compute Hardware': 200,
    'Data, Maps & Simulation': 150, 'AV Middleware & Tooling': 105,
    'Vehicle Platform & Manufacturing': 40, 'Demand & Commercial Platforms': 20,
    'Fleet Operations & Depot': 320, 'Connectivity & Infrastructure': 230,
    'Capital, Insurance & Risk': 60, 'Governance: Regulators & Government': 290,
    'Governance: Standards, Safety & Advocacy': 340
  };
  const layerColor = cat =>
    `oklch(var(--layer-l) var(--layer-c) ${HUES[cat] ?? 220})`;
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.AV = { ROOT, esc, fmtM, json, HUES, layerColor, reducedMotion };

  // ------------------------------------------------------------- theme
  const applyTheme = t => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('avTheme', t); } catch (e) { /* private mode */ }
  };
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // ------------------------------------------------------------- nav state
  const page = document.body.dataset.page || '';
  document.querySelectorAll('nav.primary a').forEach(a => {
    if (a.dataset.nav === page) a.setAttribute('aria-current', 'page');
  });

  // ------------------------------------------------------------- search
  const wrap = document.getElementById('site-search');
  if (!wrap) return;
  const input = wrap.querySelector('input');
  const drop = document.getElementById('search-results');
  let index = null, active = -1, hits = [];

  const loadIndex = () => {
    if (!index) index = json('data/search-index.json');
    return index;
  };
  const rank = (q, list) => {
    q = q.toLowerCase();
    const scored = [];
    for (const c of list) {
      const n = c.n.toLowerCase();
      let s = -1;
      if (n === q) s = 0;
      else if (n.startsWith(q)) s = 1;
      else if (n.split(/[^a-z0-9]+/).some(w => w.startsWith(q))) s = 2;
      else if (n.includes(q)) s = 3;
      else if (c.b && c.b.toLowerCase().includes(q)) s = 4;
      if (s >= 0) scored.push([s, c]);
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1].n.localeCompare(b[1].n))
      .slice(0, 8).map(x => x[1]);
  };
  const go = c => {
    close();
    input.value = '';
    if (page === 'map' && window.AVposter) { window.AVposter.select(c.s, true); return; }
    if (page === 'companies' && window.AVledger) { window.AVledger.open(c.s); return; }
    location.href = page === 'map'
      ? ROOT + 'map/#' + c.s
      : ROOT + 'companies/?open=' + encodeURIComponent(c.s);
  };
  const render = () => {
    drop.innerHTML = hits.map((c, i) =>
      `<button class="hit${i === active ? ' active' : ''}" role="option" aria-selected="${i === active}">
        <span class="hn">${esc(c.n)}${c.x ? ' <s class="caption">exited</s>' : ''}</span>
        <span class="hc">${esc((c.c || '').replace('Governance: ', ''))}</span>
      </button>`).join('') || '<div class="hit"><span class="caption">No matches in 560 organisations</span></div>';
    drop.classList.toggle('open', true);
    [...drop.querySelectorAll('button.hit')].forEach((b, i) =>
      b.addEventListener('click', () => go(hits[i])));
  };
  const close = () => { drop.classList.remove('open'); active = -1; };

  let t = null;
  input.addEventListener('focus', loadIndex);
  input.addEventListener('input', () => {
    clearTimeout(t);
    const q = input.value.trim();
    if (q.length < 2) { close(); return; }
    t = setTimeout(async () => {
      hits = rank(q, await loadIndex());
      active = -1;
      render();
    }, 80);
  });
  input.addEventListener('keydown', e => {
    if (!drop.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, hits.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    else if (e.key === 'Enter' && hits.length) { e.preventDefault(); go(hits[Math.max(active, 0)]); }
    else if (e.key === 'Escape') close();
  });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
})();
