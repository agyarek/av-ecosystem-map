/* operators.js :: fills partner sections on operator pages from
   data/partner-index.json, so partnership edits never require touching prose. */
(function () {
  'use strict';
  const { esc, json, ROOT } = window.AV;
  const slots = document.querySelectorAll('[data-partners]');
  if (!slots.length) return;
  json('data/partner-index.json').then(pidx => {
    slots.forEach(slot => {
      const rec = pidx.bySlug[slot.dataset.partners];
      if (!rec || !rec.partners.length) {
        slot.innerHTML = '<p class="caption">No partnerships mapped yet for this record. Corrections reach a human via the footer.</p>';
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
