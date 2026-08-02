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
  // One date format for the whole site. There were four: raw ISO on the funding
  // timeline, "Jan 2026" and "31 Mar 2026" side by side in the same safety list,
  // and "25 July 2026" in the footer.
  //
  // Precision is respected rather than invented: an event known only to a month
  // prints as a month. Formatting happens at render, never on the value used for
  // sorting, because "8th July" does not sort and "2026-07-08" does.
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];
  const ordinal = d => {
    if (d % 100 >= 11 && d % 100 <= 13) return d + 'th';
    return d + ({ 1: 'st', 2: 'nd', 3: 'rd' }[d % 10] || 'th');
  };
  const fmtDate = iso => {
    const m = String(iso || '').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
    if (!m) return String(iso || '');
    const [, y, mo, d] = m;
    if (!mo) return y;
    const month = MONTHS[+mo - 1] || '';
    return d ? `${ordinal(+d)} ${month} ${y}` : `${month} ${y}`;
  };

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
  // The fallback when a person has no verified profile in the dataset: a LinkedIn
  // people search scoped by their company. It is a lookup, not a claimed profile
  // URL. Where av-companies.json does hold a checked profile the renderers use
  // that instead; where two people share a name and employer, or the evidence is
  // thin, the search stays, because a wrong profile is worse than a search.
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

  // ------------------------------------------------- unit economics model
  // One implementation of the robotaxi arithmetic, shared by the calculator on
  // /economics/ and the side-by-side comparison on /funding/. Keeping it here is
  // the point: two pages publishing different numbers from the same inputs would
  // discredit both. Pure function, no DOM, no rounding — callers format.
  const ECON_INPUTS = [
    ['vcap', 'Vehicle capex, $', 45000],
    ['kcap', 'Autonomy kit capex, $', 40000],
    ['life', 'Vehicle life, miles', 300000],
    ['days', 'Operating days per year', 350],
    ['paid', 'Paid miles per day', 120],
    ['dead', 'Deadhead share, %', 30],
    ['kwh', 'Energy, kWh per mile', 0.30],
    ['elec', 'Electricity, $ per kWh', 0.25],
    ['ratio', 'Vehicles per remote operator', 15],
    ['ophr', 'Remote operator cost, $ per hour', 28],
    ['hours', 'Service hours per day', 20],
    ['maint', 'Maintenance, $ per mile', 0.06],
    ['ins', 'Insurance, $ per mile', 0.10],
    ['fare', 'Fare, $ per paid mile', 2.00],
  ];

  function avEconomics(i) {
    const n = k => { const v = parseFloat(i[k]); return isFinite(v) ? v : 0; };
    const paid = Math.max(1, n('paid'));
    const deadShare = Math.min(0.9, n('dead') / 100);
    const total = paid / (1 - deadShare);
    const capex = n('vcap') + n('kcap');

    const perMile = {
      'Depreciation': capex / Math.max(1, n('life')),
      'Energy': n('kwh') * n('elec'),
      'Maintenance': n('maint'),
      'Insurance': n('ins'),
    };
    const remoteDay = n('ophr') * n('hours') / Math.max(1, n('ratio'));
    const varPerTotalMile = Object.values(perMile).reduce((a, b) => a + b, 0);

    const costDay = varPerTotalMile * total + remoteDay;
    const revDay = paid * n('fare');
    const profitDay = revDay - costDay;

    // payback uses cash contribution: profit before the depreciation charge
    const cashDay = profitDay + perMile['Depreciation'] * total;
    // breakeven paid miles: fare*P = varPerTotalMile*P/(1-d) + remoteDay
    const margin = n('fare') - varPerTotalMile / (1 - deadShare);

    return {
      capex, totalMiles: total, costDay, revDay, profitDay,
      cpm: costDay / paid,
      revPerMile: n('fare'),
      profitYear: profitDay * n('days'),
      paybackMonths: cashDay > 0 ? capex / cashDay / 30.4 : null,
      breakeven: margin > 0 ? remoteDay / margin : null,
      split: Object.entries(perMile).map(([k, v]) => [k, v * total])
        .concat([['Remote operations', remoteDay]])
        .sort((a, b) => b[1] - a[1]),
    };
  }

  // ------------------------------------------------------------- charts
  // Categorical series colours, validated for the two page surfaces rather than
  // derived from the eleven-layer wheel: that wheel runs at chroma 0.075, which
  // is right for tags on paper and far too low for adjacent chart fills to stay
  // separable under deuteranopia. Fixed order, never cycled.
  const CHART_LIGHT = ['#426bce', '#db6c00', '#0077a9', '#a78a00', '#ea5da9', '#207029'];
  const CHART_DARK = ['#5680e6', '#da720d', '#0089b8', '#ad9000', '#db509c', '#1f812d'];
  const chartColors = () =>
    document.documentElement.dataset.theme === 'dark' ? CHART_DARK : CHART_LIGHT;
  const OTHER_SERIES = 'Other';

  window.AV = { ROOT, esc, fmtM, fmtDate, json, HUES, layerColor, reducedMotion,
                LOGO_SOURCES, LOGO_MIN, probeLogo, mountLogos, ICON, linkedinSearch,
                wikiSummary, stockQuote, stockEnabled,
                ECON_INPUTS, avEconomics, chartColors, OTHER_SERIES };

  // ------------------------------------------------------------- chrome
  // The header and footer used to be copy-pasted into all 22 pages, so changing a
  // nav label or the updated-on date meant editing 22 files and hoping none drifted.
  // They did drift: the home page footer had lost the byline, the link to /method/
  // and the date entirely. One definition here, rendered into the placeholders each
  // page carries, using ROOT so a page's depth stops mattering.
  //
  // The placeholders ship with a static wordmark and nav so the site still navigates
  // with JavaScript off; hydrating replaces that markup with the full chrome.
  // ------------------------------------------------------------- chapters
  // The site is eleven pages with no stated order, so a reader finishing one had
  // no idea what came next or how much was left. These are the chapters, in
  // reading order; the top nav stays flat, and this is what makes economics/ and
  // safety/ reachable from anywhere.
  const CHAPTERS = [
    ['Overview', [['overview', 'overview/', 'The industry in plain terms'],
                  ['beyond-roads', 'beyond-roads/', 'Autonomy off the road'],
                  ['owning-one', 'owning-one/', 'Buying one yourself']]],
    ['Map', [['map', 'map/', 'The ecosystem map']]],
    ['Directory', [['companies', 'companies/', 'Every organisation, every field'],
                   ['operators', 'companies/passenger-autonomy/', 'Passenger autonomy'],
                   ['partnerships', 'partnerships/', 'Who works with whom']]],
    ['Economics', [['economics', 'economics/', 'Funding: who raised what'],
                   ['economics-unit', 'economics/#unit-economics', 'Unit economics'],
                   ['economics-compare', 'economics/#comparing-the-operators', 'Comparing the operators']]],
    ['Regulatory', [['regulation', 'regulation/', 'Who decides, and every incident'],
                    ['safety', 'safety/', 'The safety evidence']]],
    ['Media', [['media', 'media/', 'Who to read, listen to, and meet']]],
  ];
  const pad2 = n => String(n).padStart(2, '0');

  const UPDATED = fmtDate('2026-07-31');
  // fallback until derived-counts.json answers; every rendered count reads this
  let companyCount = 562;
  const CORRECTION = 'mailto:hello@kofiagyare.com?subject=AV%20map%20correction';
  window.AV.CORRECTION = CORRECTION;   // the one mailto, shared with the map card and ledger

  const SUN = '<svg class="sun" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/></svg>';
  const MOON = '<svg class="moon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.5A5.8 5.8 0 0 1 6.5 2.5a5.8 5.8 0 1 0 7 7z"/></svg>';
  const TRADEMARK =
    'Third-party names and logos are reproduced nominatively to identify the ' +
    'organisations discussed in this editorial industry map. All trademarks remain ' +
    'the property of their owners; no endorsement is implied in either direction. ' +
    'To request a change to how your organisation appears, write to ' +
    '<a href="mailto:hello@kofiagyare.com?subject=Trademark%20request">' +
    'hello@kofiagyare.com</a>.';

  // Menus for the single-page chapters, so every item in the bar carries the
  // same caret and opens something useful. Kept out of CHAPTERS so the foot
  // navigator's page lists stay page lists.
  const SOLO_MENUS = {
    map: [['map/', 'The whole chart'],
          ['map/#passenger', 'Passenger autonomy at the centre']],
    media: [['media/#pubs-sec', 'Publications and newsletters'],
            ['media/#pods-sec', 'Podcasts'],
            ['media/#events-sec', 'Events and conferences']],
  };
  const CARET = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.4 6 8 10.6 12.6 6"/></svg>';

  const headerHTML = current => `<div class="bar">
    <a class="wordmark" href="${ROOT || './'}"><span class="dash" aria-hidden="true"></span>AV&nbsp;ECOSYSTEM&nbsp;MAP</a>
    <nav class="primary" id="site-nav" aria-label="Primary">
      ${CHAPTERS.map(([name, pages]) => {
        const here = pages.some(([key]) => key === current);
        const items = pages.length > 1
          ? pages.map(([key, href, label]) => [href, label, key === current])
          : (SOLO_MENUS[pages[0][0]] || [[pages[0][1], pages[0][2]]]).map(([href, label]) => [href, label, false]);
        return `<span class="np${here ? ' is-here' : ''}">
          <a data-nav="${pages[0][0]}" href="${ROOT}${pages[0][1]}"${here ? ' aria-current="page"' : ''}>${esc(name)}</a>
          <button class="np-more" aria-expanded="false" aria-label="Show the pages in ${esc(name)}">${CARET}</button>
          <ul class="np-sub">
            ${items.map(([href, label, cur]) =>
              `<li><a href="${ROOT}${href}"${cur ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}
          </ul>
        </span>`;
      }).join('')}
    </nav>
    <div class="chrome-tools">
      <div id="site-search" role="search">
        <input type="search" placeholder="SEARCH ${companyCount}" autocomplete="off" spellcheck="false" aria-label="Search companies"
          role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list">
        <div id="search-results" role="listbox" aria-label="Search results"></div>
      </div>
      <button id="theme-toggle" aria-label="Toggle light and dark theme">${SUN}${MOON}</button>
      <button id="nav-toggle" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open the chapter menu">
        <svg class="ic-menu" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M2.2 4.2h11.6M2.2 8h11.6M2.2 11.8h11.6"/></svg>
        <svg class="ic-close" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6"/></svg>
      </button>
    </div>
  </div>`;

  // Every page ends on a person, not a dataset: the bio renders in every
  // footer, followed by one line of provenance.
  const LINKEDIN = 'https://www.linkedin.com/in/kofiagyare';
  const BIO = `<div class="bio">
    <p class="bio-name">ABOUT THIS WEBSITE</p>
    <p class="bio-text">Hi! <a class="li" href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">${ICON.linkedin}Kofi Agyare-Kwabi</a> here:
      former Uber Country Manager and Wharton MBA with over a decade of go-to-market and
      partnerships work. I'm passionate about the autonomous vehicle industry.</p>
    <p class="bio-text">This website is a living, breathing public repository of what I'm
      discovering about the industry through my research, conversations with experts in my
      network, and reviews of publicly available information. In case you're curious,
      <a href="{ROOT}method/">here's my process</a>.</p>
    <p class="bio-text">If you'd like to chat — you'd like some information updated, want to
      issue a correction, or you simply want to talk autonomy — simply reach out. I'd love
      to hear from you.</p>
    <p class="bio-cta"><a class="btn" href="mailto:hello@kofiagyare.com?subject=AV%20ecosystem%20map">EMAIL ME</a></p>
  </div>`;

  const footerHTML = el => `<div class="container">
    ${BIO.replace('{ROOT}', ROOT)}
    <p class="fine">Autonomous Vehicle Ecosystem Map · built by <a href="${LINKEDIN}" target="_blank" rel="noopener noreferrer">Kofi Agyare-Kwabi</a> · updated <span data-updated>${UPDATED}</span></p>
    ${el.hasAttribute('data-trademark') ? `<p class="fine">${TRADEMARK}</p>` : ''}
  </div>`;

  // The chapter menus in the bar. A real button with aria-expanded for tap and
  // keyboard, plus hover-open on pointer devices: resting the cursor on the
  // chapter's name is enough, and the caret and name light cyan together.
  function bindNavMenus(root) {
    const shut = except => root.querySelectorAll('.np.open').forEach(np => {
      if (np === except) return;
      np.classList.remove('open');
      np.querySelector('.np-more').setAttribute('aria-expanded', 'false');
    });
    const show = np => {
      shut(np);
      np.classList.add('open');
      np.querySelector('.np-more').setAttribute('aria-expanded', 'true');
      // The menu is viewport-fixed so the scrolling nav strip cannot clip it;
      // place it under its chapter and keep it on screen.
      const sub = np.querySelector('.np-sub');
      const r = np.getBoundingClientRect();
      sub.style.top = `${r.bottom + 4}px`;
      sub.style.left = `${Math.max(8, Math.min(r.left, innerWidth - sub.offsetWidth - 8))}px`;
    };
    const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;
    root.querySelectorAll('.np').forEach(np => {
      const btn = np.querySelector('.np-more');
      btn.addEventListener('click', e => {
        e.preventDefault();
        np.classList.contains('open') ? shut(null) : show(np);
      });
      if (!hoverable) return;
      // The menu is fixed a few pixels below the item, so leaving must forgive
      // the gap: a short grace timer, cancelled the moment the pointer arrives
      // in the menu (a DOM child of .np, so mouseenter re-fires here).
      let grace = 0;
      np.addEventListener('mouseenter', () => { clearTimeout(grace); show(np); });
      np.addEventListener('mouseleave', () => {
        grace = setTimeout(() => { if (np.classList.contains('open')) shut(null); }, 220);
      });
    });
    document.addEventListener('click', e => { if (!e.target.closest('.np')) shut(null); });
    addEventListener('scroll', () => shut(null), { passive: true });
    addEventListener('resize', () => shut(null));
    const strip = root.querySelector('nav.primary');
    if (strip) strip.addEventListener('scroll', () => shut(null), { passive: true });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = root.querySelector('.np.open .np-more');
      if (open) { shut(null); open.focus(); }
    });

    // On a phone the whole nav folds behind one button; opening it shows every
    // chapter with all of its pages at once, so any page is one tap away.
    // Search and the theme toggle stay on the bar at all times.
    const toggle = root.querySelector('#nav-toggle');
    if (toggle) {
      const setOpen = open => {
        root.classList.toggle('nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close the chapter menu' : 'Open the chapter menu');
      };
      toggle.addEventListener('click', () => setOpen(!root.classList.contains('nav-open')));
      root.querySelectorAll('nav.primary a').forEach(a =>
        a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('click', e => {
        if (root.classList.contains('nav-open') && !e.target.closest('header.site')) setOpen(false);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && root.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
      });
    }
  }

  const currentPage = (document.body && document.body.dataset.page) || '';
  const head = document.querySelector('header.site');
  if (head) { head.innerHTML = headerHTML(currentPage); bindNavMenus(head); }
  const foot = document.querySelector('footer.site');
  if (foot) foot.innerHTML = footerHTML(foot);
  // One fetch feeds everything that must track the data rather than the markup:
  // the "updated ..." date in the footer and the company count in the search
  // box. The hardcoded values are only the no-fetch fallbacks.
  json('data/derived-counts.json').then(d => {
    const g = d.meta && d.meta.generatedAt;
    if (g && foot) foot.querySelectorAll('[data-updated]').forEach(el => { el.textContent = fmtDate(g); });
    const n = d.meta && d.meta.companyCount;
    if (n) {
      companyCount = n;
      const box = document.querySelector('#site-search input');
      if (box) box.placeholder = `SEARCH ${n}`;
    }
  }).catch(() => { /* fallbacks stand */ });

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


  function chaptersHTML() {
    return `<nav class="chapters" aria-label="Chapters">
      <p class="eyebrow">CHAPTERS</p>
      <ol class="ch-list">
        ${CHAPTERS.map(([name, pages], i) => {
          const here = pages.some(([key]) => key === page);
          return `<li class="ch${here ? ' is-here' : ''}">
            <a class="ch-head" href="${ROOT}${pages[0][1]}"${here ? ' aria-current="step"' : ''}>
              <span class="ch-n">${pad2(i + 1)}</span><span class="ch-name">${esc(name)}</span>
            </a>
            <ul class="ch-pages">
              ${pages.map(([key, href, label]) =>
                `<li><a href="${ROOT}${href}"${key === page ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`
              ).join('')}
            </ul>
          </li>`;
        }).join('')}
      </ol>
    </nav>`;
  }

  // ------------------------------------------------- sections on this page
  // A floating list of the page's own sections, so a long read can be entered
  // part-way. It collapses to a button, and on a phone it opens as a sheet from
  // the bottom edge rather than covering the column.
  function sectionNavHTML(heads) {
    return `<button class="sn-toggle" id="sn-toggle" aria-expanded="false" aria-controls="sn-body">
        <span class="sn-label">On this page</span><span class="sn-caret" aria-hidden="true">▸</span>
      </button>
      <ol class="sn-body" id="sn-body">
        ${heads.map((h, i) => `<li><a href="#${h.id}" data-sn="${h.id}">
          <span class="sn-n">${h.mark || pad2(i + 1)}</span>${esc(h.text)}</a></li>`).join('')}
      </ol>`;
  }

  function buildPageNav() {
    const main = document.querySelector('main');
    if (!main) return;

    // chapters go after the content, which is where a reader who has finished
    // actually looks for what is next
    if (CHAPTERS.some(([, pages]) => pages.some(([key]) => key === page))) {
      const wrap = document.createElement('div');
      wrap.className = 'container chapters-wrap';
      wrap.innerHTML = chaptersHTML();
      main.appendChild(wrap);
    }

    const heads = [...document.querySelectorAll('.article h2.sec[id]')].map(h => ({
      id: h.id,
      mark: h.classList.contains('sec-mark') ? h.dataset.mark : '',
      text: h.textContent.trim(),
      el: h,
    }));
    if (heads.length < 2) return;

    const aside = document.createElement('aside');
    aside.className = 'secnav';
    aside.setAttribute('aria-label', 'Sections on this page');
    aside.innerHTML = sectionNavHTML(heads);
    document.body.appendChild(aside);

    const toggle = aside.querySelector('#sn-toggle');
    toggle.addEventListener('click', () => {
      const open = aside.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    // Only start open where there is a margin wide enough to hold it. Anywhere
    // narrower it would sit on top of the column it indexes, so it waits to be
    // asked.
    if (matchMedia('(min-width: 1800px)').matches) {
      aside.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    aside.querySelectorAll('a[data-sn]').forEach(a => a.addEventListener('click', () => {
      if (!matchMedia('(min-width: 1800px)').matches) {
        aside.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }));

    // Highlight whichever section the reader is actually in. The band is the top
    // third of the viewport so the mark moves when a heading reaches reading
    // position, not when it first peeks in at the bottom.
    if (!('IntersectionObserver' in window)) return;
    const links = new Map([...aside.querySelectorAll('a[data-sn]')].map(a => [a.dataset.sn, a]));
    let seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id));
      const first = heads.find(h => seen.has(h.id));
      links.forEach(a => a.removeAttribute('aria-current'));
      if (first && links.get(first.id)) links.get(first.id).setAttribute('aria-current', 'true');
    }, { rootMargin: '0px 0px -67% 0px' });
    heads.forEach(h => io.observe(h.el));
  }
  buildPageNav();

  // Pages with their own renderer call mountLogos themselves; the static ones
  // (the operator deep dives, for one) have nobody to do it for them.
  mountLogos(document);

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
    if (page === 'map' && window.AVposter) { window.AVposter.select(c.s); return; }
    if (page === 'companies' && window.AVledger) { window.AVledger.open(c.s); return; }
    location.href = page === 'map'
      ? ROOT + 'map/#' + c.s
      : ROOT + 'companies/?open=' + encodeURIComponent(c.s);
  };
  const render = () => {
    drop.innerHTML = hits.map((c, i) =>
      `<button class="hit${i === active ? ' active' : ''}" id="search-opt-${i}" role="option" aria-selected="${i === active}">
        <span class="hn">${esc(c.n)}${c.x ? ' <s class="caption">exited</s>' : ''}</span>
        <span class="hc">${esc((c.c || '').replace('Governance: ', ''))}</span>
      </button>`).join('') || `<div class="hit"><span class="caption">No matches in ${companyCount} organisations</span></div>`;
    drop.classList.toggle('open', true);
    input.setAttribute('aria-expanded', 'true');
    if (active >= 0) input.setAttribute('aria-activedescendant', 'search-opt-' + active);
    else input.removeAttribute('aria-activedescendant');
    [...drop.querySelectorAll('button.hit')].forEach((b, i) =>
      b.addEventListener('click', () => go(hits[i])));
  };
  const close = () => {
    drop.classList.remove('open'); active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

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
