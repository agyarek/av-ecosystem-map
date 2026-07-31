/* funding-compare.js :: the two side-by-side comparisons.

   Both tables put companies in the columns and metrics in the rows, capped at
   four columns. That is the opposite of the ledger's orientation and it is
   deliberate: with at most four subjects and thirty-odd measures, the reading
   direction that matters is down a company, and a four-column table still fits
   a laptop screen without horizontal scroll.

   Row selection is the other half of the idea. A fixed table forces everyone
   through the same comparison; a checkbox rail lets a reader build the one they
   actually came for, and the PNG export hands them exactly that. */
(function () {
  'use strict';
  const { esc, json, fmtM, ROOT, ECON_INPUTS, avEconomics, exportTablePNG } = window.AV;

  const MAX = 4;
  const $ = id => document.getElementById(id);
  const NOW_YEAR = 2026;

  // Confidence vocabulary, rendered as a marker on any cell that carries one.
  const CONF = {
    disclosed: ['D', 'Stated by the company or in a filing'],
    reported: ['R', 'Carried by a major outlet, not company-confirmed'],
    estimated: ['E', 'Derived or modelled by me, not observed'],
    'not-disclosed': ['—', 'The company has never published this figure'],
    'parent-funded': ['P', 'Wholly owned; the figure does not exist separately'],
    unverified: ['?', 'Figures circulate but I could not source any of them'],
    carried: ['C', 'Carried from the site dataset'],
  };

  const SHORT_BLANK = {
    'not-disclosed': 'Not disclosed',
    'parent-funded': 'Parent-funded',
    unverified: 'Unverified',
    reported: 'Reported only',
  };

  const miles = v => v == null ? null : (v >= 1 ? v.toFixed(1).replace(/\.0$/, '') + 'M' : (v * 1000).toFixed(0) + 'k');

  /* ------------------------------------------------------------ metric set
     Each returns { text, sub, conf, src } or null for a typed blank. */
  const METRICS = [
    { k: 'funding', g: 'Capital', pin: 1, label: 'Total disclosed funding',
      get: c => c.co.fundingUSD ? { text: fmtM(c.co.fundingUSD), conf: 'carried' } : null,
      blank: 'No disclosed funding on record' },
    { k: 'valuation', g: 'Capital', pin: 1, label: 'Valuation or market cap',
      get: c => {
        const f = c.fin.valuationUSDm;
        if (f && f.v != null) return { text: fmtM(f.v), sub: f.asOf, conf: f.conf, src: f.src, note: f.note };
        if (f) return { conf: f.conf, note: f.note };
        return c.co.valuationUSD ? { text: fmtM(c.co.valuationUSD), conf: 'carried' } : null;
      },
      blank: 'Not disclosed' },
    { k: 'fleet', g: 'Operations', pin: 1, label: 'Fleet, vehicles',
      get: c => c.co.fleetSize ? { text: c.co.fleetSize.toLocaleString('en-US'), conf: 'carried' } : null,
      blank: 'Not disclosed' },
    { k: 'milesReal', g: 'Operations', pin: 1, label: 'Real-world miles',
      get: c => c.co.milesReal ? { text: miles(c.co.milesReal) + ' mi', conf: 'carried' } : null,
      blank: 'Not disclosed' },

    { k: 'lastRound', g: 'Capital', label: 'Last disclosed round',
      get: c => {
        const e = c.events[0];
        return e ? { text: fmtM(e.amountUSDm), sub: `${e.date} · ${e.form}`, conf: 'disclosed', src: e.url && { t: e.form, u: e.url } } : null;
      },
      blank: 'No round in the event dataset' },
    { k: 'rounds', g: 'Capital', label: 'Rounds in dataset',
      get: c => c.events.length ? { text: String(c.events.length), sub: '$50M+ since 2021', conf: 'carried' } : null,
      blank: 'None catalogued' },
    { k: 'investors', g: 'Capital', label: 'Lead and named investors',
      get: c => {
        const inv = [...new Set(c.events.flatMap(e => e.investors || []))].slice(0, 6);
        return inv.length ? { text: inv.join(', '), conf: 'disclosed', mono: false } : null;
      },
      blank: 'None catalogued' },
    { k: 'ownership', g: 'Capital', label: 'Ownership',
      get: c => {
        const o = c.fin.ownership;
        if (o && o.v) return { text: o.v, conf: o.conf, src: o.src, mono: false };
        return c.co.financing ? { text: c.co.financing, conf: 'carried', mono: false } : null;
      },
      blank: 'Unknown' },
    { k: 'ticker', g: 'Capital', label: 'Ticker',
      get: c => c.slim.t ? { text: c.slim.t, conf: 'carried' } : null,
      blank: 'Private' },
    { k: 'quote', g: 'Capital', label: 'Live quote',
      get: c => c.quote ? { text: '$' + c.quote.price.toFixed(2), sub: 'at page load', conf: 'disclosed' }
        : c.slim.t ? { conf: 'unverified', note: 'Listed, quote unavailable' } : null,
      blank: 'Private' },
    { k: 'acquiredBy', g: 'Capital', label: 'Parent or acquirer',
      get: c => c.co.acquiredBy ? { text: c.co.acquiredBy, conf: 'carried', mono: false } : null,
      blank: 'Independent' },

    { k: 'milesVirtual', g: 'Operations', label: 'Simulated miles',
      get: c => c.co.milesVirtual ? { text: miles(c.co.milesVirtual) + ' mi', conf: 'carried' } : null,
      blank: 'Not disclosed' },
    { k: 'maturity', g: 'Operations', label: 'Operating maturity',
      get: c => c.co.opMaturity ? { text: c.co.opMaturity, conf: 'carried', mono: false } : null },
    { k: 'deployment', g: 'Operations', label: 'Deployment',
      get: c => c.co.deployment ? { text: c.co.deployment, conf: 'carried', mono: false } : null },
    { k: 'segment', g: 'Operations', label: 'Segment',
      get: c => c.co.segment ? { text: c.co.segment, conf: 'carried', mono: false } : null },
    { k: 'founded', g: 'Operations', label: 'Founded',
      get: c => c.co.foundedYear ? { text: String(c.co.foundedYear), conf: 'carried' } : null },
    { k: 'hq', g: 'Operations', label: 'Headquarters',
      get: c => c.co.hq ? { text: c.co.hq, conf: 'carried', mono: false } : null },
    { k: 'partners', g: 'Operations', label: 'Mapped partners',
      get: c => c._pcount ? { text: String(c._pcount), conf: 'carried' } : null, blank: 'None mapped' },
    { k: 'signal', g: 'Operations', label: 'Latest signal',
      get: c => c.co.signal ? { text: c.co.signal, conf: 'carried', mono: false } : null },

    { k: 'perYear', g: 'Derived', label: 'Capital raised per year since founding',
      get: c => {
        const yrs = NOW_YEAR - (c.co.foundedYear || 0);
        return (c.co.fundingUSD && yrs > 0)
          ? { text: fmtM(c.co.fundingUSD / yrs), sub: `over ${yrs} years`, conf: 'estimated' } : null;
      } },
    { k: 'perVehicle', g: 'Derived', label: 'Capital raised per fleet vehicle',
      get: c => (c.co.fundingUSD && c.co.fleetSize)
        ? { text: '$' + Math.round(c.co.fundingUSD * 1e6 / c.co.fleetSize).toLocaleString('en-US'), conf: 'estimated' } : null },
    { k: 'perMile', g: 'Derived', label: 'Capital raised per real-world mile',
      get: c => (c.co.fundingUSD && c.co.milesReal)
        ? { text: '$' + (c.co.fundingUSD / c.co.milesReal).toFixed(2), conf: 'estimated' } : null },
    { k: 'multiple', g: 'Derived', label: 'Valuation ÷ capital raised',
      get: c => {
        const v = (c.fin.valuationUSDm && c.fin.valuationUSDm.v) || c.co.valuationUSD;
        return (v && c.co.fundingUSD) ? { text: (v / c.co.fundingUSD).toFixed(1) + '×', conf: 'estimated' } : null;
      } },
    { k: 'rank', g: 'Derived', label: 'Rank by disclosed funding',
      get: c => c.rank ? { text: `${c.rank} of ${c.cohort}`, sub: 'funded companies', conf: 'estimated' } : null },
  ];

  const GROUPS = ['Capital', 'Operations', 'Derived'];

  /* ---------------------------------------------------------------- shared UI */

  function confMark(conf) {
    if (!conf || !CONF[conf]) return '';
    const [ch, title] = CONF[conf];
    return `<abbr class="cmark c-${conf}" title="${esc(title)}">${esc(ch)}</abbr>`;
  }

  function cellHTML(cell, blank) {
    if (!cell) return `<span class="blank">${esc(blank || 'Not disclosed')}</span>`;
    if (cell.text == null) {
      return `<span class="blank">${esc(cell.note || (CONF[cell.conf] || [])[1] || 'Not disclosed')}</span>` + confMark(cell.conf);
    }
    const src = cell.src && cell.src.u
      ? ` <a class="cite" href="${esc(cell.src.u)}" target="_blank" rel="noopener noreferrer" title="${esc(cell.src.t || 'Source')}">source</a>` : '';
    return `<span class="${cell.mono === false ? 'v-text' : 'v-num'}">${esc(cell.text)}</span>` +
      confMark(cell.conf) + src +
      (cell.sub ? `<span class="v-sub">${esc(cell.sub)}</span>` : '') +
      (cell.note ? `<span class="v-sub">${esc(cell.note)}</span>` : '');
  }

  /* Column pickers: N slots, each a select. A select is keyboard- and
     screen-reader-native, which a bespoke chip search would have to re-earn. */
  function buildSlots(host, options, chosen, onChange) {
    function draw() {
      host.innerHTML = chosen.map((slug, i) => `
        <div class="slot">
          <label class="lbl" for="${host.id}-s${i}">Company ${i + 1}</label>
          <select id="${host.id}-s${i}" data-i="${i}">
            ${options.map(o => `<option value="${esc(o.slug)}"${o.slug === slug ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}
          </select>
          ${chosen.length > 2 ? `<button class="drop" data-drop="${i}" aria-label="Remove ${esc((options.find(o => o.slug === slug) || {}).name || '')}">×</button>` : ''}
        </div>`).join('')
        + (chosen.length < MAX
          ? `<button class="chip add" data-add="1">+ Add company</button>`
          : `<span class="caption cap-max">Four columns is the maximum.</span>`);
    }
    host.addEventListener('change', e => {
      const s = e.target.closest('select'); if (!s) return;
      chosen[+s.dataset.i] = s.value;
      onChange();
    });
    host.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      const drop = e.target.closest('[data-drop]');
      if (add) {
        const next = options.find(o => !chosen.includes(o.slug));
        if (next) chosen.push(next.slug);
      } else if (drop) {
        chosen.splice(+drop.dataset.drop, 1);
      } else return;
      draw();
      onChange();
    });
    draw();
    return draw;
  }

  function buildRail(host, rows, on, onChange) {
    host.innerHTML = GROUPS.map(g => {
      const inGroup = rows.filter(r => r.g === g);
      if (!inGroup.length) return '';
      return `<fieldset class="rail-group"><legend>${esc(g)}</legend>` +
        inGroup.map(r => `<label class="rail-row${r.pin ? ' pinned' : ''}">
          <input type="checkbox" value="${esc(r.k)}"${on.has(r.k) ? ' checked' : ''}${r.pin ? ' disabled' : ''}>
          <span>${esc(r.label)}</span>${r.pin ? '<span class="pin" title="Always shown">pinned</span>' : ''}
        </label>`).join('') + '</fieldset>';
    }).join('');
    host.addEventListener('change', e => {
      const cb = e.target.closest('input[type=checkbox]'); if (!cb) return;
      cb.checked ? on.add(cb.value) : on.delete(cb.value);
      onChange();
    });
  }

  /* ---------------------------------------------------------------- table 1 */
  function buildFinancials(ctx) {
    const { companies, fin, eventsBySlug, slimBySlug, pcount, rankOf, cohort } = ctx;

    const options = companies
      .filter(c => c.fundingUSD || c.fleetSize || fin[c.slug])
      .sort((a, b) => (b.fundingUSD || 0) - (a.fundingUSD || 0))
      .map(c => ({ slug: c.slug, name: c.name }));
    const bySlug = Object.fromEntries(companies.map(c => [c.slug, c]));

    const pick = ['waymo', 'pony-ai', 'weride'].filter(s => bySlug[s]);
    while (pick.length < 2) pick.push(options[pick.length].slug);

    const on = new Set(METRICS.filter(m => m.pin).map(m => m.k)
      .concat(['lastRound', 'rounds', 'investors', 'ownership', 'perVehicle', 'multiple']));

    const quotes = {};
    const ctxFor = slug => ({
      co: bySlug[slug], fin: fin[slug] || {}, slim: slimBySlug[slug] || {},
      events: (eventsBySlug[slug] || []),
      _pcount: pcount[slug] || 0, quote: quotes[slug],
      rank: rankOf(slug), cohort,
    });

    function render() {
      const cols = pick.map(ctxFor);
      const rows = METRICS.filter(m => on.has(m.k));

      $('cmp-table').innerHTML = `<table class="data cmp">
        <thead><tr><th scope="col" class="mlabel">Metric</th>
        ${cols.map(c => `<th scope="col">${esc(c.co.name)}<span class="th-sub">${esc(c.co.hq || '')}</span></th>`).join('')}
        </tr></thead><tbody>
        ${rows.map(m => `<tr><th scope="row" class="mlabel">${esc(m.label)}</th>` +
        cols.map(c => `<td>${cellHTML(m.get(c), m.blank)}</td>`).join('') + '</tr>').join('')}
        </tbody></table>`;
      writeState();
    }

    function writeState() {
      const p = new URLSearchParams(location.search);
      p.set('cmp', pick.join(','));
      history.replaceState(null, '', '?' + p);
    }

    const p0 = new URLSearchParams(location.search).get('cmp');
    if (p0) {
      const want = p0.split(',').filter(s => bySlug[s]).slice(0, MAX);
      if (want.length >= 2) pick.splice(0, pick.length, ...want);
    }

    buildSlots($('cmp-slots'), options, pick, render);
    buildRail($('cmp-rail'), METRICS, on, render);
    render();

    // live quotes, resolved after first paint so the table never waits on them
    pick.forEach(function load(slug) {
      const t = (slimBySlug[slug] || {}).t;
      if (!t || quotes[slug]) return;
      window.AV.stockQuote(t).then(q => { if (q) { quotes[slug] = q; render(); } });
    });

    $('cmp-export').addEventListener('click', () => {
      const cols = pick.map(ctxFor);
      const rows = METRICS.filter(m => on.has(m.k));
      exportTablePNG({
        title: cols.map(c => c.co.name).join('  ·  '),
        subtitle: 'Financial and operating comparison · AV Ecosystem Map · compiled 29 July 2026',
        columns: cols.map(c => ({ label: c.co.name, sub: c.co.hq })),
        rows: rows.map(m => ({
          label: m.label,
          cells: cols.map(c => {
            const cell = m.get(c);
            // a cell that is blank on purpose exports as the short reason, not the
            // full on-page explanation: a value column is not the place for prose
            if (!cell || cell.text == null) {
              return { text: SHORT_BLANK[cell && cell.conf] || m.blank || 'Not disclosed', mono: false };
            }
            return { text: cell.text, sub: cell.sub, mono: cell.mono !== false };
          }),
        })),
        note: 'Figures carry mixed provenance and vintage. Valuations are point-in-time marks, not market prices. See the source links on the page before quoting any number.',
        filename: 'av-compare-' + pick.join('-'),
      });
    });
  }

  /* ---------------------------------------------------------------- table 2 */
  const OUTPUTS = [
    ['cpm', 'Fully-loaded cost per revenue mile', r => '$' + r.cpm.toFixed(2)],
    ['revPerMile', 'Revenue per paid mile', r => '$' + r.revPerMile.toFixed(2)],
    ['profitDay', 'Contribution per vehicle per day', r =>
      (r.profitDay < 0 ? '−$' : '$') + Math.abs(r.profitDay).toFixed(0)],
    ['profitYear', 'Contribution per vehicle per year', r =>
      (r.profitYear < 0 ? '−$' : '$') + Math.abs(Math.round(r.profitYear)).toLocaleString('en-US')],
    ['paybackMonths', 'Payback on capex', r => r.paybackMonths ? r.paybackMonths.toFixed(0) + ' mo' : 'never'],
    ['breakeven', 'Breakeven paid miles per day', r => r.breakeven ? Math.ceil(r.breakeven) + ' mi' : 'none'],
    ['capex', 'Capex per vehicle', r => '$' + Math.round(r.capex).toLocaleString('en-US')],
    ['totalMiles', 'Total miles driven per day', r => r.totalMiles.toFixed(0) + ' mi'],
  ];
  const PINNED_IN = ['vcap', 'kcap', 'paid', 'fare'];

  function buildEconomics(ec, companies) {
    const bySlug = Object.fromEntries(companies.map(c => [c.slug, c]));
    const options = Object.keys(ec.companies).map(s => ({ slug: s, name: ec.companies[s].name }));
    const pick = ['waymo', 'zoox', 'baidu-apollo-go'].filter(s => ec.companies[s]).slice(0, 3);
    while (pick.length < 2) pick.push(options[pick.length].slug);

    // live, per-column input values; reset when a column changes company
    const live = {};
    const inputsFor = slug => {
      if (!live[slug]) live[slug] = { ...ec.companies[slug].inputs };
      return live[slug];
    };

    const ROWS = ECON_INPUTS.map(([k, label]) => ({ k, g: 'Assumptions', label, pin: PINNED_IN.includes(k) ? 1 : 0 }))
      .concat(OUTPUTS.map(([k, label]) => ({ k, g: 'Outputs', label, pin: k === 'cpm' ? 1 : 0 })));
    const on = new Set(ROWS.filter(r => r.pin).map(r => r.k)
      .concat(['life', 'days', 'dead', 'ratio', 'ophr', 'profitDay', 'paybackMonths', 'breakeven']));

    function render() {
      const cols = pick.map(s => ({
        slug: s, meta: ec.companies[s], co: bySlug[s],
        inputs: inputsFor(s), out: avEconomics(inputsFor(s)),
      }));
      const inRows = ECON_INPUTS.filter(([k]) => on.has(k));
      const outRows = OUTPUTS.filter(([k]) => on.has(k));

      const fleetRow = `<tr><th scope="row" class="mlabel">Fleet, vehicles<span class="v-sub">from the ledger, not an assumption</span></th>` +
        cols.map(c => `<td>${c.co && c.co.fleetSize
          ? `<span class="v-num">${c.co.fleetSize.toLocaleString('en-US')}</span>`
          : '<span class="blank">Not disclosed</span>'}</td>`).join('') + '</tr>';

      $('eco-table').innerHTML = `<table class="data cmp eco">
        <thead><tr><th scope="col" class="mlabel">Metric</th>
        ${cols.map(c => `<th scope="col">${esc(c.meta.name)}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${fleetRow}
          ${inRows.map(([k, label]) => `<tr><th scope="row" class="mlabel">${esc(label)}</th>` +
        cols.map((c, ci) => `<td><input class="eco-in" inputmode="decimal"
             data-col="${ci}" data-k="${esc(k)}" value="${esc(c.inputs[k])}"
             aria-label="${esc(label)} for ${esc(c.meta.name)}"></td>`).join('') + '</tr>').join('')}
        </tbody>
        <tbody class="out">
          ${outRows.map(([k, label, fmt]) => `<tr><th scope="row" class="mlabel">${esc(label)}</th>` +
          cols.map(c => `<td><span class="v-num strong">${esc(fmt(c.out))}</span></td>`).join('') + '</tr>').join('')}
        </tbody>
        <tfoot><tr><th scope="row" class="mlabel">Basis</th>
          ${cols.map(c => `<td><span class="v-sub basis">${esc(c.meta.note)}</span></td>`).join('')}
        </tr></tfoot>
      </table>`;
    }

    $('eco-table').addEventListener('input', e => {
      const inp = e.target.closest('input.eco-in'); if (!inp) return;
      const slug = pick[+inp.dataset.col];
      inputsFor(slug)[inp.dataset.k] = String(inp.value).replace(/[^0-9.]/g, '');
      // repaint outputs only, so the caret stays where the reader put it
      const cols = pick.map(s => avEconomics(inputsFor(s)));
      const outRows = OUTPUTS.filter(([k]) => on.has(k));
      [...$('eco-table').querySelectorAll('tbody.out tr')].forEach((tr, ri) => {
        const fmt = outRows[ri][2];
        [...tr.querySelectorAll('td span')].forEach((sp, ci) => { sp.textContent = fmt(cols[ci]); });
      });
    });

    buildSlots($('eco-slots'), options, pick, () => { render(); });
    const rail = $('eco-rail');
    rail.innerHTML = ['Assumptions', 'Outputs'].map(g => {
      const inGroup = ROWS.filter(r => r.g === g);
      return `<fieldset class="rail-group"><legend>${esc(g)}</legend>` +
        inGroup.map(r => `<label class="rail-row${r.pin ? ' pinned' : ''}">
          <input type="checkbox" value="${esc(r.k)}"${on.has(r.k) ? ' checked' : ''}${r.pin ? ' disabled' : ''}>
          <span>${esc(r.label)}</span>${r.pin ? '<span class="pin">pinned</span>' : ''}</label>`).join('') +
        '</fieldset>';
    }).join('');
    rail.addEventListener('change', e => {
      const cb = e.target.closest('input[type=checkbox]'); if (!cb) return;
      cb.checked ? on.add(cb.value) : on.delete(cb.value);
      render();
    });

    $('eco-warning').textContent = ec.meta.warning;
    render();

    $('eco-export').addEventListener('click', () => {
      const cols = pick.map(s => ({
        meta: ec.companies[s], co: bySlug[s], inputs: inputsFor(s), out: avEconomics(inputsFor(s)),
      }));
      const rows = [{
        label: 'Fleet, vehicles',
        cells: cols.map(c => ({ text: c.co && c.co.fleetSize ? c.co.fleetSize.toLocaleString('en-US') : 'Not disclosed' })),
      }].concat(
        ECON_INPUTS.filter(([k]) => on.has(k)).map(([k, label]) => ({
          label, cells: cols.map(c => ({ text: String(c.inputs[k]) })),
        })),
        OUTPUTS.filter(([k]) => on.has(k)).map(([k, label, fmt]) => ({
          label, cells: cols.map(c => ({ text: fmt(c.out) })),
        })));
      exportTablePNG({
        title: cols.map(c => c.meta.name).join('  ·  '),
        subtitle: 'Unit economics, modelled · AV Ecosystem Map · compiled 29 July 2026',
        columns: cols.map(c => ({ label: c.meta.name })),
        rows,
        note: 'Modelled, not reported. No operator publishes fully-loaded cost per mile; every assumption above is an estimate I assembled, and it is meant to be argued with.',
        filename: 'av-economics-' + pick.join('-'),
      });
    });
  }

  /* ---------------------------------------------------------------- boot */
  Promise.all([
    json('data/av-companies.json'),
    json('data/av-financials.json'),
    json('data/av-funding-events.json'),
    json('data/av-economics-defaults.json'),
    json('data/search-index.json'),
    json('data/partner-index.json').catch(() => null),
  ]).then(([companies, financials, E, ec, slim, partners]) => {
    const slimBySlug = Object.fromEntries(slim.map(c => [c.s, c]));
    const nameToSlug = Object.fromEntries(slim.map(c => [c.n.toLowerCase(), c.s]));

    const eventsBySlug = {};
    E.events.forEach(e => {
      const s = nameToSlug[e.company.toLowerCase()];
      if (!s) return;
      (eventsBySlug[s] = eventsBySlug[s] || []).push(e);
    });
    Object.values(eventsBySlug).forEach(a => a.sort((x, y) => y.date.localeCompare(x.date)));

    const pIdx = (partners && partners.bySlug) || {};
    const pcount = {};
    Object.keys(pIdx).forEach(k => { pcount[k] = pIdx[k].count || 0; });

    const funded = companies.filter(c => c.fundingUSD).sort((a, b) => b.fundingUSD - a.fundingUSD);
    const rankIndex = Object.fromEntries(funded.map((c, i) => [c.slug, i + 1]));

    buildFinancials({
      companies, fin: financials.companies, eventsBySlug, slimBySlug, pcount,
      rankOf: s => rankIndex[s], cohort: funded.length,
    });
    buildEconomics(ec, companies);
  }).catch(() => {
    ['cmp-table', 'eco-table'].forEach(id => {
      const h = $(id);
      if (h) h.innerHTML = '<p class="caption">The comparison data failed to load.</p>';
    });
  });
})();
