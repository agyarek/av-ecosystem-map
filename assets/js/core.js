/* core.js :: shared chrome: theme, nav state, header search, helpers.
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

  // ------------------------------------------------------------- logos
  // Remote logo sources, tried in order. These are what make marks appear with no
  // build step; the committed assets from tools/fetch-logos.py are an optional
  // quality upgrade rather than a prerequisite.
  //
  // Order is by resolution first and connection cost second. The aggregators live
  // on one host each, so hundreds of companies share a handful of connections; a
  // company's own touch icon is usually the sharpest mark available but costs a
  // fresh DNS lookup and handshake per company, so it is only reached when the
  // shared hosts return something too small to use. Clearbit's free logo API, the
  // usual answer here, shut down in December 2025. Set LOGO_DEV_TOKEN to a
  // logo.dev publishable token to put a real logo CDN in front; the keyless
  // sources still apply without one.
  const LOGO_DEV_TOKEN = '';
  const LOGO_SOURCES = [
    d => LOGO_DEV_TOKEN && `https://img.logo.dev/${encodeURIComponent(d)}?token=${LOGO_DEV_TOKEN}&size=256&format=png&retina=true`,
    d => `https://unavatar.io/${encodeURIComponent(d)}?fallback=false`,
    d => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent('https://' + d)}&size=256`,
    d => `https://${d}/apple-touch-icon.png`,
    d => `https://${d}/apple-touch-icon-precomposed.png`,
    d => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`,
    d => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(d)}.ico`,
  ];
  const LOGO_MIN = 64;   // below this a mark is only used if nothing better exists

  // Probe each candidate with a plain Image so its real pixel size is known before
  // anything is shown. The first mark at LOGO_MIN or better wins; if none clears
  // the bar the largest one seen is used anyway, so a company with only a small
  // icon still gets its logo rather than dropping to a monogram. `apply` receives
  // the winning URL, or null when every source failed.
  // Results are memoised per domain: renderCard calls mountLogos twice for a single
  // click (once on the slim record, again once the full one arrives), and a company
  // can appear on a card, in the navigator and in the table at the same time. Without
  // this the same ladder of probes ran from scratch every time, and the mark visibly
  // re-resolved on each render.
  const logoCache = new Map();
  function probeLogo(domain, apply) {
    if (logoCache.has(domain)) return logoCache.get(domain).then(apply);
    let settle;
    logoCache.set(domain, new Promise(res => { settle = res; }));
    const done = url => { settle(url); apply(url); };
    let best = null, bestPx = 0;
    (function step(i) {
      if (i >= LOGO_SOURCES.length) return done(best);
      const url = LOGO_SOURCES[i](domain);
      if (!url) return step(i + 1);
      const test = new Image();
      test.decoding = 'async';
      test.onload = () => {
        const px = Math.max(test.naturalWidth || 0, test.naturalHeight || 0);
        if (px >= LOGO_MIN) return done(url);
        if (px > bestPx) { best = url; bestPx = px; }
        step(i + 1);
      };
      test.onerror = () => step(i + 1);
      test.src = url;
    })(0);
  }

  // Fill every <img data-logo-domain="..."> under `root` with the best mark
  // available, or remove it so whatever sits behind it (a monogram) shows through.
  const mountLogos = root => {
    (root || document).querySelectorAll('img[data-logo-domain]').forEach(el => {
      const domain = el.dataset.logoDomain;
      delete el.dataset.logoDomain;
      probeLogo(domain, url => {
        if (!url) return el.remove();
        el.src = url; el.style.opacity = '1';
      });
    });
  };

  // ------------------------------------------------------------- icons
  const ICON = {
    globe: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4M8 1.8c1.7 1.7 2.6 3.9 2.6 6.2S9.7 12.5 8 14.2C6.3 12.5 5.4 10.3 5.4 8S6.3 3.5 8 1.8z"/></svg>',
    linkedin: '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M3.2 5.8h2.2V13H3.2V5.8zM4.3 2.3a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zM7.1 5.8h2.1v1h.03c.3-.55 1-1.13 2.08-1.13 2.22 0 2.63 1.4 2.63 3.23V13h-2.2V9.35c0-.87-.02-2-1.24-2-1.24 0-1.43.94-1.43 1.93V13H7.1V5.8z"/></svg>',
    news: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="1.8" y="3" width="12.4" height="10" rx="1.4"/><path d="M4.2 5.8h5M4.2 8.2h5M4.2 10.6h3.4"/></svg>',
  };
  // A person's name, linked to a LinkedIn people search scoped by their company.
  // This is a lookup, not a claimed profile URL: the dataset does not hold
  // verified profile links, and inventing them would be worse than searching.
  const linkedinSearch = (person, company) =>
    'https://www.linkedin.com/search/results/people/?keywords=' +
    encodeURIComponent([person, company].filter(Boolean).join(' '));

  // -------------------------------------------------------- wikipedia
  // A freely licensed picture and a one-line description, fetched when a card
  // opens. The REST summary endpoint is CORS-open, needs no key, and follows
  // redirects, so a near-miss title still resolves. A wrong or missing title
  // returns 404 and the caller shows nothing, which is the whole failure mode.
  const wikiCache = new Map();
  function wikiSummary(title) {
    if (!title) return Promise.resolve(null);
    if (!wikiCache.has(title)) {
      const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' +
        encodeURIComponent(String(title).replace(/ /g, '_'));
      wikiCache.set(title, fetch(url).then(r => r.ok ? r.json() : null).then(j => {
        if (!j || j.type === 'disambiguation') return null;
        const img = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
        if (!img) return null;
        return {
          img, thumb: (j.thumbnail && j.thumbnail.source) || img,
          page: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) ||
                ('https://en.wikipedia.org/wiki/' + encodeURIComponent(String(title).replace(/ /g, '_'))),
          extract: j.extract || '', title: j.title || title,
        };
      }).catch(() => null));
    }
    return wikiCache.get(title);
  }

  // ----------------------------------------------------------- quotes
  // A static site cannot fetch a share price without a provider: none of the free
  // quote endpoints send CORS headers, so the browser is refused before the data
  // arrives. Point STOCK_ENDPOINT at a provider that does (Finnhub's free tier
  // works from the browser) using {symbol} as the placeholder, and adjust
  // READ_QUOTE if its response is not shaped like {c: price}. Left empty the card
  // omits the price rather than showing a broken or stale one.
  const STOCK_ENDPOINT = '';
  const READ_QUOTE = j => (j && (j.c != null ? j.c : (j.price != null ? j.price : null)));
  const quoteCache = new Map();
  const stockEnabled = () => !!STOCK_ENDPOINT;
  function stockQuote(ticker) {
    if (!STOCK_ENDPOINT || !ticker) return Promise.resolve(null);
    const symbol = String(ticker).split(':').pop();
    if (!quoteCache.has(symbol)) {
      quoteCache.set(symbol, fetch(STOCK_ENDPOINT.replace('{symbol}', encodeURIComponent(symbol)))
        .then(r => r.ok ? r.json() : null)
        .then(j => { const p = READ_QUOTE(j); return p == null ? null : { price: p, at: new Date() }; })
        .catch(() => null));
    }
    return quoteCache.get(symbol);
  }

  window.AV = { ROOT, esc, fmtM, json, HUES, layerColor, reducedMotion,
                LOGO_SOURCES, LOGO_MIN, probeLogo, mountLogos, ICON, linkedinSearch,
                wikiSummary, stockQuote, stockEnabled };

  // ------------------------------------------------------------- chrome
  // The header and footer used to be copy-pasted into all 22 pages, so changing a
  // nav label or the updated-on date meant editing 22 files and hoping none drifted.
  // They did drift: the home page footer had lost the byline, the link to /method/
  // and the date entirely. One definition here, rendered into the placeholders each
  // page carries, using ROOT so a page's depth stops mattering.
  //
  // The placeholders ship with a static wordmark and nav so the site still navigates
  // with JavaScript off; hydrating replaces that markup with the full chrome.
  const UPDATED = '25 July 2026';
  const CORRECTION = 'mailto:agyarek+avecosystemmap@gmail.com?subject=AV%20map%20correction';
  const NAV = [
    ['map', 'map/', 'Map'],
    ['companies', 'companies/', 'Companies'],
    ['operators', 'operators/', 'Passenger Autonomy'],
    ['partnerships', 'partnerships/', 'Partnerships'],
    ['funding', 'funding/', 'Funding'],
    ['regulation', 'regulation/', 'Rules'],
    ['beyond-roads', 'beyond-roads/', 'Beyond Roads'],
  ];

  const SUN = '<svg class="sun" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/></svg>';
  const MOON = '<svg class="moon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.5A5.8 5.8 0 0 1 6.5 2.5a5.8 5.8 0 1 0 7 7z"/></svg>';
  const TRADEMARK =
    'Third-party names and logos are reproduced nominatively to identify the ' +
    'organisations discussed in this editorial industry map. All trademarks remain ' +
    'the property of their owners; no endorsement is implied in either direction. ' +
    'To request a change to how your organisation appears, write to ' +
    '<a href="mailto:agyarek+avecosystemmap@gmail.com?subject=Trademark%20request">' +
    'agyarek+avecosystemmap@gmail.com</a>.';

  const headerHTML = current => `<div class="bar">
    <a class="wordmark" href="${ROOT || './'}"><span class="dash" aria-hidden="true"></span>AV&nbsp;ECOSYSTEM&nbsp;MAP</a>
    <nav class="primary" aria-label="Primary">
      ${NAV.map(([key, href, label]) =>
        `<a data-nav="${key}" href="${ROOT}${href}"${key === current ? ' aria-current="page"' : ''}>${label}</a>`
      ).join('\n      ')}
    </nav>
    <div class="chrome-tools">
      <div id="site-search" role="search">
        <input type="search" placeholder="SEARCH 561" autocomplete="off" spellcheck="false" aria-label="Search companies">
        <div id="search-results" role="listbox" aria-label="Search results"></div>
      </div>
      <button id="theme-toggle" aria-label="Toggle light and dark theme">${SUN}${MOON}</button>
    </div>
  </div>`;

  const footerHTML = el => {
    const opener = el.dataset.cta === 'chart'
      ? 'A company that should be on this chart, a partnership not yet mapped, a detail that is wrong?'
      : 'A company that should be listed, a partnership not yet mapped, a detail that is wrong?';
    return `<div class="container">
    <p class="cta">${opener}
      <a href="${CORRECTION}">Send a correction</a>:
      this map gets better through exactly those conversations.</p>
    <p class="fine">Autonomous Vehicle Ecosystem Map · compiled by <a href="${ROOT}method/">Kofi Agyare-Kwabi</a> from public filings, permits and announcements · updated ${UPDATED}</p>
    ${el.hasAttribute('data-trademark') ? `<p class="fine">${TRADEMARK}</p>` : ''}
  </div>`;
  };

  const currentPage = (document.body && document.body.dataset.page) || '';
  const head = document.querySelector('header.site');
  if (head) head.innerHTML = headerHTML(currentPage);
  const foot = document.querySelector('footer.site');
  if (foot) foot.innerHTML = footerHTML(foot);

  // ------------------------------------------------------------- theme
  const applyTheme = t => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('avTheme', t); } catch (e) { /* private mode */ }
  };
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // Nav state is set by headerHTML above, so there is one source of truth for it.
  const page = currentPage;

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
