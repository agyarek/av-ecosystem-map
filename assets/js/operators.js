/* operators.js :: fills partner sections and the citation trail on operator
   pages from the data, so partnership and source edits never require touching
   prose. A deep-dive page that states dated facts has to show its working. */
(function () {
  'use strict';
  const { esc, json, ROOT } = window.AV;

  // ---------------------------------------------------------- sources
  const srcSlot = document.querySelector('[data-sources]');
  if (srcSlot) {
    json('data/av-companies.json').then(cs => {
      const rec = cs.find(c => c.slug === srcSlot.dataset.sources);
      const sources = (rec && rec.sources) || [];
      if (!sources.length) {
        srcSlot.innerHTML = '<p class="caption">Claims on this page are drawn from the record in '
          + `<a href="${ROOT}companies/?open=${esc(srcSlot.dataset.sources)}">the ledger</a>, `
          + 'which carries no filed sources yet. If you can point me at one, my email is in the footer.</p>';
        return;
      }
      srcSlot.innerHTML = '<ul class="src-list">' + sources.map(s =>
        `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>
         <span class="caption">${esc(s.date)}</span></li>`).join('')
        + `</ul><p class="caption">Every other figure on this page is dated in place and traceable
           through <a href="${ROOT}companies/?open=${esc(srcSlot.dataset.sources)}">the full record</a>
           and <a href="${ROOT}method/">Method</a>.</p>`;
    }).catch(() => {
      srcSlot.innerHTML = '<p class="caption">The source list failed to load.</p>';
    });
  }

  // ---------------------------------------------------------- partners
  const slots = document.querySelectorAll('[data-partners]');
  if (!slots.length) return;
  json('data/partner-index.json').then(pidx => {
    slots.forEach(slot => {
      const rec = pidx.bySlug[slot.dataset.partners];
      if (!rec || !rec.partners.length) {
        slot.innerHTML = '<p class="caption">No partnerships mapped yet for this record. If you know of one, my email is in the footer.</p>';
        return;
      }
      const grouped = {};
      for (const p of rec.partners) (grouped[p.k] = grouped[p.k] || []).push(p);
      slot.innerHTML = Object.entries(grouped).map(([k, ps]) => `
        <div class="pg"><h4>${esc(k)}</h4><ul>
          ${ps.map(p => `<li>${p.slug
            ? `<a href="${ROOT}map/#${esc(p.slug)}">${esc(p.partner)}</a>`
            : `<strong>${esc(p.partner)}</strong>`}
            ${p.n ? `<span class="caption">${esc(p.n)}</span>` : ''}</li>`).join('')}
        </ul></div>`).join('');
      const cnt = document.querySelector(`[data-partner-count="${slot.dataset.partners}"]`);
      if (cnt) cnt.textContent = rec.count;
    });
  }).catch(() => {
    slots.forEach(slot => { slot.innerHTML = '<p class="caption">Partner data failed to load.</p>'; });
  });
})();
