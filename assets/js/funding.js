/* funding.js :: renders the $200M+ timeline with form and region filters,
   the three analytical cuts, and the knownGaps array as visible content. */
(function () {
  'use strict';
  const { esc, json, fmtM, ROOT } = window.AV;

  const FORM_BUCKETS = [
    ['SPAC', /spac/i],
    ['IPO & listings', /ipo|listing/i],
    ['Placements & follow-ons', /placement|follow-on/i],
    ['Venture & growth', /series|growth|tender|launch funding/i],
    ['Parent & strategic', /parent|strategic|infusion|commitment|investment|order/i],
  ];
  const bucketOf = form => (FORM_BUCKETS.find(([, re]) => re.test(form)) || ['Other'])[0];

  const state = { forms: new Set(), regions: new Set() };

  Promise.all([json('data/av-funding-timeline.json'), json('data/search-index.json')])
    .then(([F, slim]) => {
      const byName = Object.fromEntries(slim.map(c => [c.n.toLowerCase(), c]));
      const regionOf = company => {
        const lc = company.toLowerCase();
        if (byName[lc]) return byName[lc].r;
        const hit = slim.find(c => lc.startsWith(c.n.toLowerCase() + ' ') || lc.includes(c.n.toLowerCase()));
        return hit ? hit.r : 'Other';
      };
      const events = F.events.map(e => ({
        ...e, bucket: bucketOf(e.form), region: regionOf(e.company),
        slug: (byName[e.company.toLowerCase()] || {}).s || null
      })).sort((a, b) => b.date.localeCompare(a.date));

      // -------- filters
      const forms = [...new Set(events.map(e => e.bucket))];
      const regions = [...new Set(events.map(e => e.region))];
      const fWrap = document.getElementById('fund-filters');
      fWrap.innerHTML = forms.map(f => `<button class="chip" data-form="${esc(f)}" aria-pressed="false">${esc(f)}</button>`).join('')
        + '<span style="flex-basis:100%"></span>'
        + regions.map(r => `<button class="chip" data-region="${esc(r)}" aria-pressed="false">${esc(r)}</button>`).join('');
      fWrap.addEventListener('click', e => {
        const b = e.target.closest('button.chip'); if (!b) return;
        const tog = (set, v) => set.has(v) ? set.delete(v) : set.add(v);
        if (b.dataset.form) tog(state.forms, b.dataset.form);
        if (b.dataset.region) tog(state.regions, b.dataset.region);
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
        render();
      });

      const tl = document.getElementById('timeline');
      function render() {
        let shown = 0;
        tl.innerHTML = events.map(e => {
          const ok = (!state.forms.size || state.forms.has(e.bucket))
            && (!state.regions.size || state.regions.has(e.region));
          if (ok) shown++;
          return `<div class="tl-event${ok ? '' : ' dim'}">
            <span class="d">${esc(e.date)}</span>
            <span class="amt">${fmtM(e.amountUSDm)}</span>
            <span class="co">${e.slug ? `<a href="${ROOT}map/#${esc(e.slug)}" style="text-decoration:none;color:inherit">${esc(e.company)}</a>` : esc(e.company)}</span>
            <span class="form">${esc(e.form.toUpperCase())}</span>
            <span class="note">${esc(e.note || '')}</span>
            <span class="inv">${esc((e.investors || []).slice(0, 5).join(', '))}</span>
          </div>`;
        }).join('');
        document.getElementById('fund-state').textContent =
          (state.forms.size || state.regions.size)
            ? `${shown} of ${events.length} events match; the rest stay dimmed in place.` : '';
      }
      render();

      // -------- cuts
      const sum = {};
      events.forEach(e => { sum[e.company] = (sum[e.company] || 0) + e.amountUSDm; });
      document.getElementById('cut-raised').innerHTML = Object.entries(sum)
        .sort((a, b) => b[1] - a[1]).slice(0, 7)
        .map(([c, v]) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0"><span>${esc(c)}</span><span class="num">${fmtM(v)}</span></div>`).join('');

      const inv = {};
      events.forEach(e => (e.investors || []).forEach(i => {
        if (/public market|pipe/i.test(i)) return;
        inv[i] = (inv[i] || 0) + 1;
      }));
      document.getElementById('cut-investors').innerHTML = Object.entries(inv)
        .filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([i, n]) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0"><span>${esc(i)}</span><span class="num">${n} events</span></div>`).join('');

      const SEG = e => {
        const c = e.company.toLowerCase();
        if (/aurora|waabi|kodiak|einride|stack|torc|inceptio|trucking|plus\b/.test(c)) return 'Freight autonomy';
        if (/hesai|robosense|horizon|black sesame|innoviz|lidar|chip|applied intuition|momenta/.test(c)) return 'Suppliers & enablers';
        return 'Passenger autonomy';
      };
      const seg = {};
      events.forEach(e => { seg[SEG(e)] = (seg[SEG(e)] || 0) + e.amountUSDm; });
      const total = Object.values(seg).reduce((a, b) => a + b, 0);
      document.getElementById('cut-split').innerHTML = Object.entries(seg)
        .sort((a, b) => b[1] - a[1])
        .map(([s, v]) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0"><span>${esc(s)}</span><span class="num">${fmtM(v)} · ${Math.round(v / total * 100)}%</span></div>`).join('');

      // -------- known gaps
      document.getElementById('gaps-slot').innerHTML =
        (F.meta.knownGaps || []).map(g => `<div class="note" style="margin-top:10px">${esc(g)}</div>`).join('')
        || '<p class="caption">No known gaps recorded.</p>';
    })
    .catch(() => {
      document.getElementById('timeline').innerHTML = '<p class="caption">The funding data failed to load.</p>';
    });
})();
