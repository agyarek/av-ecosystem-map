/* funding.js :: the longitudinal explorer, plus the timeline and cuts it now
   sits above.

   The explorer answers when capital arrived and at what cadence, rather than
   what happened on a given day — that job stays with the timeline. Charts are
   hand-drawn SVG: no library, no build step, and the same data a screen reader
   can be handed as a table.

   Two rules worth stating because they shaped the code. There is no second
   y-axis anywhere: capital and deal count are different measures, so they get
   two stacked charts sharing one x-axis instead of one chart with two scales.
   And every quarter the dataset does not claim to cover completely is shaded,
   because a thin bar in 2022 means "not yet catalogued", not "no money moved". */
(function () {
  'use strict';
  const { esc, json, fmtM, fmtDate, ROOT, chartColors, OTHER_SERIES } = window.AV;

  const FORM_BUCKETS = [
    ['SPAC', /spac/i],
    ['IPO & listings', /ipo|listing/i],
    ['Placements & follow-ons', /placement|follow-on|pipe/i],
    ['Venture & growth', /series|growth|tender|launch funding/i],
    ['Parent & strategic', /parent|strategic|infusion|commitment|investment|order/i],
  ];
  const bucketOf = form => (FORM_BUCKETS.find(([, re]) => re.test(form)) || ['Other'])[0];

  const SEG = company => {
    const c = company.toLowerCase();
    if (/aurora|waabi|kodiak|einride|stack|torc|inceptio|trucking|plus\b/.test(c)) return 'Freight autonomy';
    if (/hesai|robosense|horizon|black sesame|innoviz|lidar|chip|applied intuition|momenta|qcraft/.test(c)) return 'Suppliers & enablers';
    return 'Passenger autonomy';
  };

  // ---------------------------------------------------------------- quarters
  const qOf = date => ({ y: +date.slice(0, 4), q: Math.floor((+date.slice(5, 7) - 1) / 3) + 1 });
  const qKey = d => { const { y, q } = qOf(d); return y * 4 + (q - 1); };
  const qLabel = k => `${Math.floor(k / 4)} Q${(k % 4) + 1}`;
  const qShort = k => `Q${(k % 4) + 1}`;
  const YEARS = { '1y': 1, '3y': 3, '5y': 5 };

  const state = {
    range: '3y', mode: 'quarter', breakdown: 'segment', companies: new Set(),
  };

  const $ = id => document.getElementById(id);
  let events = [], coverageFrom = 0, maxKey = 0;

  // ---------------------------------------------------------------- URL state
  function readURL() {
    const p = new URLSearchParams(location.search);
    if (YEARS[p.get('range')]) state.range = p.get('range');
    if (['quarter', 'cumulative', 'season'].includes(p.get('mode'))) state.mode = p.get('mode');
    if (['segment', 'region', 'stage', 'none'].includes(p.get('by'))) state.breakdown = p.get('by');
    (p.get('co') || '').split(',').filter(Boolean).forEach(c => state.companies.add(c));
  }
  function writeURL() {
    const p = new URLSearchParams(location.search);
    const set = (k, v, dflt) => (v && v !== dflt) ? p.set(k, v) : p.delete(k);
    set('range', state.range, '3y');
    set('mode', state.mode, 'quarter');
    set('by', state.breakdown, 'segment');
    set('co', [...state.companies].join(','), '');
    history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
  }

  // ---------------------------------------------------------------- filtering
  const selected = () => events.filter(e =>
    qKey(e.date) > maxKey - YEARS[state.range] * 4
    && (!state.companies.size || state.companies.has(e.company)));

  const seriesKeyOf = e => state.companies.size ? e.company
    : state.breakdown === 'segment' ? e.segment
      : state.breakdown === 'region' ? e.region
        : state.breakdown === 'stage' ? e.bucket
          : 'All capital';

  // Returns { keys, series:[{name, values}], counts, byQuarter }.
  function aggregate(evs, byQuarter) {
    const buckets = new Map(), names = new Map();
    evs.forEach(e => {
      const k = byQuarter ? qKey(e.date) : qOf(e.date).q - 1;
      const s = seriesKeyOf(e);
      if (!buckets.has(k)) buckets.set(k, new Map());
      const b = buckets.get(k);
      b.set(s, (b.get(s) || 0) + e.amountUSDm);
      names.set(s, (names.get(s) || 0) + e.amountUSDm);
    });

    let keys = [];
    if (byQuarter) {
      for (let k = maxKey - YEARS[state.range] * 4 + 1; k <= maxKey; k++) keys.push(k);
    } else {
      keys = [0, 1, 2, 3];
    }

    // fixed order by size, folded past six so hues are never cycled
    let order = [...names.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
    if (order.length > 6) {
      const keep = order.slice(0, 5);
      order = keep.concat([OTHER_SERIES]);
      buckets.forEach(b => {
        let other = 0;
        [...b.keys()].forEach(n => { if (!keep.includes(n)) { other += b.get(n); b.delete(n); } });
        if (other) b.set(OTHER_SERIES, other);
      });
    }

    return {
      keys, byQuarter,
      series: order.map(name => ({
        name, values: keys.map(k => (buckets.get(k) || new Map()).get(name) || 0),
      })),
      counts: keys.map(k => evs.filter(e =>
        (byQuarter ? qKey(e.date) : qOf(e.date).q - 1) === k).length),
    };
  }

  // ---------------------------------------------------------------- svg
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, attrs, text) => {
    const node = document.createElementNS(NS, n);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  };
  const niceMax = v => {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag * 2) / 2 * mag;
  };

  // The pinned popup a bar click opens: which companies were funded in that
  // quarter and how much each raised. The hover tooltip stays for totals; this
  // is the drill-down that stays put while you read it.
  let tip, pin, pinKey = null;
  const hidePin = () => { if (pin) { pin.hidden = true; pinKey = null; } };
  function showPin(label, total, evList, anchor) {
    const rows = evList.slice().sort((a, b) => b.amountUSDm - a.amountUSDm);
    pin.innerHTML = `<b>${esc(label)} · ${fmtM(total)}</b>` +
      `<div class="pin-rows">` + rows.map(ev =>
        `<span class="pr"><span class="pr-co">${esc(ev.company)}</span><span class="num">${fmtM(ev.amountUSDm)}</span></span>`).join('') + `</div>` +
      `<p class="caption">${rows.length} event${rows.length === 1 ? '' : 's'} · Esc or click away to close</p>`;
    pin.hidden = false;
    const r = anchor.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    pin.style.left = Math.max(8, Math.min(innerWidth - pr.width - 8, r.left + r.width / 2 - pr.width / 2)) + 'px';
    pin.style.top = Math.max(8, r.top - pr.height - 10) + 'px';
  }

  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2)) + 'px';
    tip.style.top = Math.max(8, y - r.height - 12) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  function bindTip(g, html) {
    g.addEventListener('pointerenter', e => showTip(html, e.clientX, e.clientY));
    g.addEventListener('pointermove', e => showTip(html, e.clientX, e.clientY));
    g.addEventListener('focus', () => {
      const r = g.getBoundingClientRect();
      showTip(html, r.left + r.width / 2, r.top);
    });
    g.addEventListener('pointerleave', hideTip);
    g.addEventListener('blur', hideTip);
  }

  function drawChart(host, agg, opts) {
    const W = Math.max(host.clientWidth || 720, 300);
    const H = opts.height;
    const M = { t: 10, r: 8, b: opts.counts ? 18 : 30, l: 46 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const colors = chartColors();

    const totals = agg.keys.map((_, i) => agg.series.reduce((a, s) => a + s.values[i], 0));
    const cumulative = totals.reduce((acc, v) =>
      (acc.push((acc[acc.length - 1] || 0) + v), acc), []);
    const plotted = opts.cumulative ? cumulative : totals;
    const max = niceMax(Math.max(...(opts.counts ? agg.counts : plotted), 0));

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`, width: '100%', height: H,
      role: 'img', 'aria-label': opts.aria,
    });
    const y = v => M.t + ih - (v / max) * ih;
    const bw = iw / agg.keys.length;

    for (let i = 0; i <= (opts.counts ? 2 : 4); i++) {
      const v = max * i / (opts.counts ? 2 : 4);
      svg.appendChild(el('line', {
        x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), stroke: 'var(--rule)', 'stroke-width': 1,
      }));
      svg.appendChild(el('text', {
        x: M.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'ch-axis',
      }, opts.fmtAxis(v)));
    }

    if (agg.byQuarter) {
      const cut = agg.keys.findIndex(k => k >= coverageFrom);
      if (cut > 0) {
        svg.appendChild(el('rect', {
          x: M.l, y: M.t, width: bw * cut, height: ih, fill: 'var(--rule)', opacity: .34,
        }));
        if (!opts.counts) {
          svg.appendChild(el('text', { x: M.l + 6, y: M.t + 13, class: 'ch-axis' },
            'partial coverage'));
        }
      }
    }

    agg.keys.forEach((k, i) => {
      const x = M.l + i * bw;
      const label = agg.byQuarter ? qLabel(k) : `Q${k + 1}`;
      const bx = x + bw * .18, bwid = Math.max(2, bw * .64);

      if (opts.counts) {
        const v = agg.counts[i];
        const g = el('g', { tabindex: '0', 'aria-label': `${label}: ${v} events` });
        if (v) g.appendChild(el('rect', {
          x: bx, y: y(v), width: bwid, height: Math.max(2, M.t + ih - y(v)), rx: 3, fill: 'var(--muted)',
        }));
        g.appendChild(el('rect', { x, y: M.t, width: bw, height: ih, fill: 'transparent' }));
        bindTip(g, `<b>${esc(label)}</b><br>${v} event${v === 1 ? '' : 's'}`);
        svg.appendChild(g);
        return;
      }

      const rows = agg.series
        .map((s, si) => ({ name: s.name, v: s.values[i], c: colors[si % colors.length] }))
        .filter(r => r.v > 0);
      const total = plotted[i];
      const detail = (opts.cumulative || !rows.length) ? ''
        : rows.map(r => `${r.name} ${fmtM(r.v)}`).join(', ');

      const g = el('g', {
        tabindex: '0',
        'aria-label': `${label}: ${fmtM(total)}${opts.cumulative ? ' cumulative' : ''}` +
          (detail ? ', ' + detail : ''),
      });

      if (opts.cumulative) {
        if (total) g.appendChild(el('rect', {
          x: bx, y: y(total), width: bwid, height: Math.max(2, M.t + ih - y(total)),
          rx: 4, fill: colors[0],
        }));
      } else {
        let acc = 0;
        rows.forEach((r, ri) => {
          const y0 = y(acc), y1 = y(acc + r.v);
          g.appendChild(el('rect', {
            x: bx, y: y1, width: bwid,
            height: Math.max(1, y0 - y1 - (ri < rows.length - 1 ? 2 : 0)),
            rx: ri === rows.length - 1 ? 4 : 0, fill: r.c,
          }));
          acc += r.v;
        });
      }
      g.appendChild(el('rect', { x, y: M.t, width: bw, height: ih, fill: 'transparent' }));
      bindTip(g, `<b>${esc(label)}</b><br>${fmtM(total)}${opts.cumulative ? ' cumulative' : ''}` +
        (detail ? '<br>' + rows.map(r => `${esc(r.name)} ${fmtM(r.v)}`).join('<br>') : ''));
      const evList = (opts.events && opts.events.get(k)) || [];
      if (evList.length) {
        g.style.cursor = 'pointer';
        const open = () => {
          if (pinKey === label) { hidePin(); return; }
          pinKey = label;
          hideTip();
          showPin(label, total, evList, g);
        };
        g.addEventListener('click', e => { e.stopPropagation(); open(); });
        g.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      }
      svg.appendChild(g);
    });

    if (!opts.counts) {
      const step = bw < 30 ? 2 : 1;
      agg.keys.forEach((k, i) => {
        if (i % step) return;
        svg.appendChild(el('text', {
          x: M.l + i * bw + bw / 2, y: H - 10, 'text-anchor': 'middle', class: 'ch-axis',
        }, agg.byQuarter ? (bw < 64 ? qShort(k) : qLabel(k)) : `Q${k + 1}`));
      });
      if (agg.byQuarter && bw < 64) {
        agg.keys.forEach((k, i) => {
          if (k % 4) return;
          svg.appendChild(el('text', {
            x: M.l + i * bw + bw / 2, y: H - 22, 'text-anchor': 'middle', class: 'ch-axis ch-year',
          }, String(Math.floor(k / 4))));
        });
      }
    }

    host.innerHTML = '';
    host.appendChild(svg);
  }

  // ---------------------------------------------------------------- render
  function render() {
    const evs = selected();
    const byQuarter = state.mode !== 'season';
    const agg = aggregate(evs, byQuarter);
    const colors = chartColors();
    hidePin();

    // raw events per bar, so a click can answer "who, exactly, and how much"
    const eventsByKey = new Map();
    evs.forEach(e => {
      const k = byQuarter ? qKey(e.date) : qOf(e.date).q - 1;
      if (!eventsByKey.has(k)) eventsByKey.set(k, []);
      eventsByKey.get(k).push(e);
    });

    drawChart($('ch-capital'), agg, {
      height: 250, cumulative: state.mode === 'cumulative',
      events: state.mode === 'cumulative' ? null : eventsByKey,
      fmtAxis: v => v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'B' : Math.round(v) + 'M',
      aria: state.mode === 'season'
        ? 'Capital raised by calendar quarter, all years combined'
        : state.mode === 'cumulative' ? 'Cumulative capital raised' : 'Capital raised per quarter',
    });
    drawChart($('ch-count'), agg, {
      height: 92, counts: true, fmtAxis: v => String(Math.round(v)),
      aria: 'Number of funding events per quarter',
    });

    $('ch-legend').innerHTML = (state.breakdown === 'none' && !state.companies.size)
      || state.mode === 'cumulative' ? ''
      : agg.series.map((s, i) =>
        `<span class="ch-key"><span class="sw" style="background:${colors[i % colors.length]}"></span>${esc(s.name)}</span>`).join('');

    $('ch-table').innerHTML = `<table class="data"><caption>Capital and event count by quarter</caption>
      <thead><tr><th scope="col">${byQuarter ? 'Quarter' : 'Calendar quarter'}</th>` +
      agg.series.map(s => `<th scope="col">${esc(s.name)}</th>`).join('') +
      `<th scope="col">Events</th></tr></thead><tbody>` +
      agg.keys.map((k, i) => `<tr><th scope="row">${byQuarter ? qLabel(k) : 'Q' + (k + 1)}</th>` +
        agg.series.map(s => `<td>${s.values[i] ? fmtM(s.values[i]) : '—'}</td>`).join('') +
        `<td>${agg.counts[i]}</td></tr>`).join('') + '</tbody></table>';

    const total = evs.reduce((a, e) => a + e.amountUSDm, 0);
    const span = { '1y': 'past year', '3y': 'past three years', '5y': 'past five years' }[state.range];
    $('ch-state').textContent =
      `${fmtM(total)} across ${evs.length} event${evs.length === 1 ? '' : 's'} in the ${span}, ` +
      (state.companies.size ? [...state.companies].join(', ') + ' only.' : 'all companies.');

    writeURL();
  }

  // ---------------------------------------------------------------- controls
  function buildControls() {
    const seg = (id, opts, key) => {
      const wrap = $(id);
      wrap.innerHTML = opts.map(([v, label]) =>
        `<button class="chip" data-v="${esc(v)}" aria-pressed="${state[key] === v}">${esc(label)}</button>`).join('');
      wrap.addEventListener('click', e => {
        const b = e.target.closest('button.chip'); if (!b) return;
        state[key] = b.dataset.v;
        [...wrap.querySelectorAll('.chip')].forEach(c => c.setAttribute('aria-pressed', c === b));
        if (key === 'mode') $('ch-by-row').hidden = state.mode === 'cumulative';
        render();
      });
    };
    seg('ch-range', [['1y', 'Past year'], ['3y', 'Past 3 years'], ['5y', 'Past 5 years']], 'range');
    seg('ch-mode', [['quarter', 'By quarter'], ['cumulative', 'Cumulative'], ['season', 'Seasonality']], 'mode');
    seg('ch-by', [['segment', 'Segment'], ['region', 'Region'], ['stage', 'Stage'], ['none', 'No split']], 'breakdown');
    $('ch-by-row').hidden = state.mode === 'cumulative';

    const totals = {};
    events.forEach(e => { totals[e.company] = (totals[e.company] || 0) + e.amountUSDm; });
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([c]) => c);
    const cw = $('ch-companies');
    cw.innerHTML = top.map(c =>
      `<button class="chip" data-co="${esc(c)}" aria-pressed="${state.companies.has(c)}">${esc(c)}</button>`).join('')
      + '<button class="chip" data-clear="1">Clear</button>';
    cw.addEventListener('click', e => {
      const b = e.target.closest('button.chip'); if (!b) return;
      if (b.dataset.clear) {
        state.companies.clear();
        [...cw.querySelectorAll('[data-co]')].forEach(c => c.setAttribute('aria-pressed', 'false'));
      } else {
        const c = b.dataset.co;
        state.companies.has(c) ? state.companies.delete(c) : state.companies.add(c);
        b.setAttribute('aria-pressed', state.companies.has(c));
      }
      render();
    });
  }

  // ---------------------------------------------------------------- the cuts
  // Three ranked lists over every catalogued event, each row a disclosure that
  // opens the raises behind the number. The event list this section used to
  // carry separately lives inside these rows now.
  function buildCuts() {
    const evs = [...events].sort((a, b) => b.date.localeCompare(a.date));

    // Ranked rows carried the size only as a number, so "who raised the most"
    // took reading rather than looking. The bar is the same proportion the number
    // states; every bar in a cut starts at the same left edge and is measured
    // against the largest in that cut, so the shapes are comparable down a column.
    const row = (k, v, pct, detail) => `<details class="cut">
      <summary class="rank-row"><span class="rr-caret" aria-hidden="true"></span>` +
      `<span class="rr-k">${esc(k)}</span><span class="num">${v}</span>` +
      (pct == null ? '' : `<span class="rr-bar" style="--pct:${Math.max(1, Math.round(pct))}%"></span>`) +
      `</summary><div class="cut-detail">${detail}</div></details>`;

    const monthYear = e => fmtDate(e.date.slice(0, 7));
    const cite = e => e.url
      ? ` <a class="cite" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">source</a>` : '';
    const backers = e => (e.investors || []).length
      ? ` Backed by ${esc(e.investors.slice(0, 6).join(', '))}${e.investors.length > 6 ? ' and others' : ''}.` : '';
    const period = t => /[.!?]$/.test(t) ? t : t + '.';

    // one paragraph per event: what, when, who — headed by the raise itself
    const companyPara = e =>
      `<p><strong>${fmtM(e.amountUSDm)} · ${esc(e.form)} · ${esc(monthYear(e))}.</strong> ` +
      `${e.note ? esc(period(e.note)) : ''}${backers(e)}${cite(e)}</p>`;
    const investorPara = e =>
      `<p><strong>${esc(e.company)} — ${fmtM(e.amountUSDm)} (${esc(monthYear(e))}).</strong> ` +
      `${e.note ? esc(period(e.note)) : ''}${cite(e)}</p>`;

    const sum = {};
    evs.forEach(e => { sum[e.company] = (sum[e.company] || 0) + e.amountUSDm; });
    const raised = Object.entries(sum).sort((a, b) => b[1] - a[1]);
    const maxRaised = raised.length ? raised[0][1] : 1;
    $('cut-raised').innerHTML = raised.map(([c, v]) =>
      row(c, fmtM(v), v / maxRaised * 100,
        evs.filter(e => e.company === c).map(companyPara).join(''))).join('');

    const inv = {};
    evs.forEach(e => (e.investors || []).forEach(i => {
      if (/public market|pipe/i.test(i)) return;
      inv[i] = (inv[i] || 0) + 1;
    }));
    const repeat = Object.entries(inv).filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const maxInv = repeat.length ? repeat[0][1] : 1;
    $('cut-investors').innerHTML = repeat.map(([i, n]) =>
      row(i, n + ' events', n / maxInv * 100,
        evs.filter(e => (e.investors || []).includes(i)).map(investorPara).join(''))).join('');

    const segSum = {};
    evs.forEach(e => { segSum[e.segment] = (segSum[e.segment] || 0) + e.amountUSDm; });
    const total = Object.values(segSum).reduce((a, b) => a + b, 0);
    $('cut-split').innerHTML = Object.entries(segSum).sort((a, b) => b[1] - a[1])
      .map(([sg, v]) => row(sg, `${fmtM(v)} · ${Math.round(v / total * 100)}%`, v / total * 100,
        evs.filter(e => e.segment === sg).map(investorPara).join(''))).join('');
  }

  // ---------------------------------------------------------------- boot
  tip = document.createElement('div');
  tip.className = 'ch-tip';
  tip.hidden = true;
  document.body.appendChild(tip);
  pin = document.createElement('div');
  pin.className = 'ch-tip ch-pin';
  pin.hidden = true;
  document.body.appendChild(pin);
  // dismissal listens to click, not pointerdown: the bar handler stops
  // propagation, so a click on a bar toggles while a click anywhere else closes
  document.addEventListener('click', e => {
    if (!pin.hidden && !pin.contains(e.target)) hidePin();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePin(); });
  addEventListener('scroll', hidePin, { passive: true });

  // The disclosed-funding note used to be typed into the page, and had drifted from
  // the records it summarises: it claimed 49 plus 511 of 561 (562 now), and a
  // total $0.2B below what the records actually add up to. It is derived now.
  json('data/derived-counts.json').then(d => {
    const el = document.getElementById('disclosed-note');
    if (!el) return;
    const g = d.gaps, rest = g.companies - g.withDisclosedFunding;
    // fmtM drops the decimal above $10B, which is right on a chart axis and wrong
    // on a headline total, so this one keeps a digit.
    const total = `$${(g.disclosedFundingUSDm / 1000).toFixed(1)}B`;
    el.textContent = `Separately: ${g.withDisclosedFunding} of the ${g.companies} company records ` +
      `carry disclosed lifetime funding, totalling ${total}. The other ${rest} ` +
      `either raised privately without disclosure, are funded by parents, or are public bodies. ` +
      `Blank is honest.`;
  }).catch(() => {});

  Promise.all([
    json('data/av-funding-events.json'),
    json('data/search-index.json'),
  ]).then(([E, slim]) => {
    const byName = Object.fromEntries(slim.map(c => [c.n.toLowerCase(), c]));
    const regionOf = company => {
      const lc = company.toLowerCase();
      if (byName[lc]) return byName[lc].r;
      const hit = slim.find(c => lc.startsWith(c.n.toLowerCase() + ' ') || lc.includes(c.n.toLowerCase()));
      return hit ? hit.r : 'Other';
    };

    events = E.events.map(e => ({
      ...e, bucket: bucketOf(e.form), region: regionOf(e.company), segment: SEG(e.company),
    }));
    maxKey = Math.max(...events.map(e => qKey(e.date)));
    coverageFrom = qKey(E.meta.coverage.completeFrom);

    readURL();
    buildControls();
    render();
    $('ch-coverage').textContent = E.meta.coverage.partialNote;

    buildCuts();

    // Themed groups, bold names, one-line reasons: a list a reader can scan
    // for a company they care about, rather than seven paragraphs to re-read.
    $('gaps-slot').innerHTML =
      (E.meta.knownGaps || []).map(g => `<div class="gap-group">
        <h3 class="gap-theme">${esc(g.theme)}</h3>
        ${g.note ? `<p class="caption">${esc(g.note)}</p>` : ''}
        <ul class="gap-list">${(g.items || []).map(it =>
          `<li><strong>${esc(it.company)}</strong> — ${esc(it.reason)}.</li>`).join('')}</ul>
      </div>`).join('')
      || '<p class="caption">No known gaps recorded.</p>';

    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 150); });
    const themeBtn = $('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => setTimeout(render, 0));
  }).catch(() => {
    ['ch-capital', 'cut-raised'].forEach(id => {
      const h = $(id);
      if (h) h.innerHTML = '<p class="caption">The funding data failed to load.</p>';
    });
  });
})();
