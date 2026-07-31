/* coverage.js :: where a driver you can actually meet is carrying passengers.

   Renders data/av-service-coverage.json, which is a dated snapshot rather than
   a live feed. Coverage moves monthly, so the date is rendered as prominently
   as the cities and no city appears without the terms it runs on. */
(function () {
  'use strict';
  const { esc, json, ROOT, fmtDate } = window.AV;

  const slot = document.getElementById('coverage-slot');
  if (!slot) return;

  // Marks reuse the legend order of the source chart, so a reader holding both
  // can move between them without relearning the notation.
  const ORDER = ['safetyDriver', 'notDirectlyBookable', 'waitlist', 'free'];
  const MARK = { safetyDriver: 1, notDirectlyBookable: 2, waitlist: 3, free: 4 };

  json('data/av-service-coverage.json').then(d => {
    const ops = d.operators;
    const cities = ops.reduce((n, o) => n + o.cities.length, 0);
    const countries = new Set(ops.flatMap(o => o.cities.map(c => c.cc)));

    const href = o => o.inRoster ? `${ROOT}companies/${esc(o.slug)}/`
                                 : `${ROOT}map/#${esc(o.slug)}`;

    const cityRow = c => `<li class="cv-city">
        <span class="cv-cc">${esc(c.cc)}</span>
        <span class="cv-name">${esc(c.city)}</span>
        ${c.flags.map(f => `<span class="cv-mark" title="${esc(d.limitations[f] || f)}">${MARK[f]}</span>`).join('')}
      </li>`;

    slot.innerHTML = `
      <p class="cv-summary"><span class="num">${cities}</span> cities ·
        <span class="num">${countries.size}</span> countries ·
        <span class="num">${ops.length}</span> companies ·
        as of ${esc(fmtDate(d.meta.asOf))}</p>
      <div class="cv-grid">
        ${ops.map(o => `<div class="cv-op">
          <p class="cv-op-h"><a href="${href(o)}">${esc(o.name)}</a>
            <span class="cv-n">${o.cities.length}</span></p>
          <ul class="cv-list">${o.cities.map(cityRow).join('')}</ul>
        </div>`).join('')}
      </div>
      <ul class="cv-legend">
        ${ORDER.map(k => `<li><span class="cv-mark">${MARK[k]}</span> ${esc(d.limitations[k])}</li>`).join('')}
      </ul>
      <p class="caption cv-src">Snapshot compiled from ${esc(d.meta.source.credit)}.
        ${esc(d.meta.note)}</p>`;
  }).catch(() => {
    slot.innerHTML = '<p class="caption">The coverage data failed to load.</p>';
  });
})();
