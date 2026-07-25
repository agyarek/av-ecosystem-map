/* partnerships.js :: renders the function-grouped edge list and the
   operators-by-function matrix from data/av-enrichment.json. */
(function () {
  'use strict';
  const { esc, json, ROOT } = window.AV;

  // edge kinds -> displayed function groups, in editorial order
  const GROUPS = [
    ['Vehicle platform', ['Vehicle platform', 'Manufacturing']],
    ['Sensing supply', ['Sensing supply']],
    ['Compute', ['Compute']],
    ['Mapping & simulation', ['Mapping', 'Simulation']],
    ['Fleet operations & charging', ['Fleet ops', 'Charging']],
    ['Demand', ['Demand', 'Delivery', 'Freight']],
    ['Capital & acquisitions', ['Investment', 'Acquisition']],
    ['Software & safety', ['Software', 'Safety research', 'Regulatory']],
    ['Same family', ['Same family']],
  ];
  const MATRIX_COLS = [
    ['Vehicle', ['Vehicle platform', 'Manufacturing']],
    ['Sensing', ['Sensing supply']],
    ['Compute', ['Compute']],
    ['Maps/Sim', ['Mapping', 'Simulation']],
    ['Fleet ops', ['Fleet ops', 'Charging']],
    ['Demand', ['Demand']],
    ['Capital', ['Investment']],
  ];

  Promise.all([json('data/av-enrichment.json'), json('data/search-index.json')])
    .then(([enr, slim]) => {
      const slugOf = Object.fromEntries(slim.map(c => [c.n, c.s]));
      const link = name => slugOf[name]
        ? `<a href="${ROOT}map/#${esc(slugOf[name])}">${esc(name)}</a>`
        : `<strong>${esc(name)}</strong>`;
      const norm = k => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

      // ---------------- matrix: the ten operators x functions
      const ops = enr.operators;
      const cell = (op, kinds) => {
        const names = new Set();
        for (const e of enr.edges) {
          if (!kinds.some(k => norm(e.k) === norm(k))) continue;
          if (e.a === op) names.add(e.b);
          else if (e.b === op) names.add(e.a);
        }
        return [...names].map(link).join(' · ');
      };
      document.getElementById('matrix-slot').innerHTML = `
        <table class="data"><thead><tr><th>Operator</th>${MATRIX_COLS.map(([l]) => `<th>${l}</th>`).join('')}</tr></thead>
        <tbody>${ops.map(op => `<tr><th scope="row" style="white-space:nowrap;font-family:var(--font-display);text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">${link(op)}</th>
          ${MATRIX_COLS.map(([, kinds]) => `<td style="font-size:12.5px">${cell(op, kinds) || ''}</td>`).join('')}</tr>`).join('')}
        </tbody></table>`;

      // ---------------- full edge list by function
      const used = new Set();
      const sections = GROUPS.map(([label, kinds]) => {
        const rows = enr.edges.filter(e => kinds.some(k => norm(e.k) === norm(k)));
        rows.forEach(e => used.add(e));
        if (!rows.length) return '';
        return `<div class="pg" style="margin-top:14px"><h4>${esc(label)} · ${rows.length}</h4><ul>
          ${rows.map(e => `<li>${link(e.a)} <span class="caption">×</span> ${link(e.b)}
            ${e.n ? `<span class="caption">${esc(e.n)}</span>` : ''}</li>`).join('')}</ul></div>`;
      }).join('');
      const rest = enr.edges.filter(e => !used.has(e));
      document.getElementById('edges-slot').innerHTML =
        `<div class="partner-groups" style="margin-top:0">${sections}
        ${rest.length ? `<div class="pg"><h4>Other · ${rest.length}</h4><ul>${rest.map(e =>
          `<li>${link(e.a)} <span class="caption">×</span> ${link(e.b)}
           ${e.n ? `<span class="caption">${esc(e.n)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}</div>`;
    })
    .catch(() => {
      document.getElementById('edges-slot').innerHTML = '<p class="caption">The partnership data failed to load.</p>';
    });
})();
