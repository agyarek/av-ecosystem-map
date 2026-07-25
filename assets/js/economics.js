/* economics.js — the unit-economics calculator. Pure arithmetic, no data
   fetch: the inputs ARE the editorial content and every default is visible. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  const INPUTS = [
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

  const wrap = $('calc-inputs');
  wrap.innerHTML = INPUTS.map(([k, label, v]) => `
    <div class="ci"><label for="in-${k}">${label}</label>
    <input id="in-${k}" inputmode="decimal" value="${v}"></div>`).join('');

  const val = k => {
    const n = parseFloat(String($('in-' + k).value).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : 0;
  };
  const money = n => '$' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2));

  function compute() {
    const paid = Math.max(1, val('paid'));
    const deadShare = Math.min(0.9, val('dead') / 100);
    const total = paid / (1 - deadShare);
    const capex = val('vcap') + val('kcap');

    const perMile = {
      'Depreciation': capex / Math.max(1, val('life')),
      'Energy': val('kwh') * val('elec'),
      'Maintenance': val('maint'),
      'Insurance': val('ins'),
    };
    const remoteDay = val('ophr') * val('hours') / Math.max(1, val('ratio'));
    const varPerTotalMile = Object.values(perMile).reduce((a, b) => a + b, 0);

    const costDay = varPerTotalMile * total + remoteDay;
    const revDay = paid * val('fare');
    const profitDay = revDay - costDay;
    const cpm = costDay / paid;

    // payback uses cash contribution: profit before the depreciation charge
    const cashDay = profitDay + perMile['Depreciation'] * total;
    const paybackMonths = cashDay > 0 ? capex / cashDay / 30.4 : null;

    // breakeven paid miles: fare*P = varPerTotalMile*P/(1-d) + remoteDay
    const margin = val('fare') - varPerTotalMile / (1 - deadShare);
    const breakeven = margin > 0 ? remoteDay / margin : null;

    $('o-cpm').textContent = '$' + cpm.toFixed(2);
    $('o-profit').textContent = (profitDay < 0 ? '−$' + Math.abs(profitDay).toFixed(0) : '$' + profitDay.toFixed(0));
    $('o-payback').textContent = paybackMonths ? paybackMonths.toFixed(0) + ' mo' : 'never';
    $('o-breakeven').textContent = breakeven ? Math.ceil(breakeven) + ' mi' : 'none';
    $('o-verdict').textContent =
      cpm <= 1.0 ? 'At or under the $0.99 bull case. Check which assumption is doing the lifting.'
        : cpm <= 2.0 ? 'Between the bull case and the $1.98 estimate: roughly where 2026 lives.'
          : 'Above the published Waymo estimate. This is what early fleets look like.';

    const rows = Object.entries(perMile).map(([k, v]) => [k, v * total])
      .concat([['Remote operations', remoteDay]])
      .sort((a, b) => b[1] - a[1]);
    $('o-split').innerHTML = rows.map(([k, v]) =>
      `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0">
        <span>${k}</span><span class="num">${money(v)} · ${Math.round(v / costDay * 100)}%</span></div>`).join('');
  }

  wrap.addEventListener('input', compute);
  compute();
})();
