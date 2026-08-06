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
        ? `<a class="co-link" href="${ROOT}map/#${esc(slugOf[name])}">${esc(name)}</a>`
        : `<strong>${esc(name)}</strong>`;
      const norm = k => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();

      // ---------------- density: relationships summed between the eleven layers
      const SHORT = {
        'AV Driver / Autonomy Software': 'driver', 'Sensing & Compute Hardware': 'sensing',
        'Data, Maps & Simulation': 'data', 'AV Middleware & Tooling': 'middleware',
        'Vehicle Platform & Manufacturing': 'vehicle', 'Demand & Commercial Platforms': 'demand',
        'Fleet Operations & Depot': 'fleet', 'Connectivity & Infrastructure': 'connectivity',
        'Capital, Insurance & Risk': 'capital', 'Governance: Regulators & Government': 'regulators',
        'Governance: Standards, Safety & Advocacy': 'standards'
      };
      const LAYERS = Object.keys(SHORT);
      const catOf = Object.fromEntries(slim.map(c => [c.n, c.c]));
      const idx = Object.fromEntries(LAYERS.map((l, i) => [l, i]));
      const grid = LAYERS.map(() => LAYERS.map(() => 0));
      let unplaced = 0;
      for (const e of enr.edges) {
        const ia = idx[catOf[e.a]], ib = idx[catOf[e.b]];
        if (ia == null || ib == null) { unplaced++; continue; }
        const [i, j] = ia <= ib ? [ia, ib] : [ib, ia];
        grid[i][j]++;
      }
      const gmax = Math.max(...grid.flat());
      document.getElementById('density-slot').innerHTML = `
        <table class="data density"><thead><tr><th></th>${LAYERS.map(l =>
          `<th style="font-size:10px;letter-spacing:.04em">${esc(SHORT[l]).toUpperCase()}</th>`).join('')}</tr></thead>
        <tbody>${LAYERS.map((row, i) => `<tr>
          <th scope="row" style="white-space:nowrap;font-family:var(--font-mono);font-size:10px;letter-spacing:.04em">${esc(SHORT[row]).toUpperCase()}</th>
          ${LAYERS.map((col, j) => {
            const n = i <= j ? grid[i][j] : grid[j][i];
            const pct = gmax ? Math.round(n / gmax * 85) : 0;
            return `<td style="text-align:center;font-family:var(--font-mono);font-size:11.5px;padding:7px 6px;background:color-mix(in oklab, var(--cyan) ${n ? 8 + pct : 0}%, transparent)"
              title="${esc(row)} × ${esc(col)}: ${n} mapped relationship${n === 1 ? '' : 's'}">${n || ''}</td>`;
          }).join('')}</tr>`).join('')}
        </tbody></table>
        ${unplaced ? `<p class="caption" style="margin-top:8px">${unplaced} relationships involve an organisation outside the eleven layers and are not in the grid.</p>` : ''}`;

      // ---------------- hubs: mapped relationships per organisation
      const deg = new Map();
      for (const e of enr.edges) {
        deg.set(e.a, (deg.get(e.a) || 0) + 1);
        deg.set(e.b, (deg.get(e.b) || 0) + 1);
      }
      const top = [...deg.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 15);
      const dmax = top.length ? top[0][1] : 1;
      document.getElementById('hubs-slot').innerHTML = top.map(([name, n]) =>
        `<div class="rank-row"><span class="rr-k">${link(name)}</span>
          <span class="num">${n}</span>
          <span class="rr-bar" style="--pct:${Math.round(n / dmax * 100)}%"></span></div>`).join('');

      // ---------------- matrix: passenger autonomy x functions
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
        return `<div class="pg" style="margin-top:14px"><h3>${esc(label)} · ${rows.length}</h3><ul>
          ${rows.map(e => `<li>${link(e.a)} <span class="caption">×</span> ${link(e.b)}
            ${e.n ? `<span class="caption">${esc(e.n)}</span>` : ''}</li>`).join('')}</ul></div>`;
      }).join('');
      const rest = enr.edges.filter(e => !used.has(e));
      document.getElementById('edges-slot').innerHTML =
        `<div class="partner-groups" style="margin-top:0">${sections}
        ${rest.length ? `<div class="pg"><h3>Other · ${rest.length}</h3><ul>${rest.map(e =>
          `<li>${link(e.a)} <span class="caption">×</span> ${link(e.b)}
           ${e.n ? `<span class="caption">${esc(e.n)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}</div>`;
    })
    .catch(() => {
      document.getElementById('edges-slot').innerHTML = '<p class="caption">The partnership data failed to load.</p>';
    });
})();
