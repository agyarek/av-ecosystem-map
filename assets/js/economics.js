/* economics.js :: the unit-economics calculator. The arithmetic lives in
   core.js as AV.avEconomics so this page and the side-by-side comparison on
   /funding/ cannot drift apart; the inputs ARE the editorial content and every
   default is visible. */
(function () {
  'use strict';
  const { ECON_INPUTS, avEconomics } = window.AV;
  const $ = id => document.getElementById(id);

  const wrap = $('calc-inputs');
  wrap.innerHTML = ECON_INPUTS.map(([k, label, v]) => `
    <div class="ci"><label for="in-${k}">${label}</label>
    <input id="in-${k}" inputmode="decimal" value="${v}"></div>`).join('');

  const money = n => '$' + (Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2));

  function compute() {
    const inputs = {};
    ECON_INPUTS.forEach(([k]) => {
      inputs[k] = String($('in-' + k).value).replace(/[^0-9.]/g, '');
    });
    const r = avEconomics(inputs);

    $('o-cpm').textContent = '$' + r.cpm.toFixed(2);
    $('o-profit').textContent =
      (r.profitDay < 0 ? '−$' + Math.abs(r.profitDay).toFixed(0) : '$' + r.profitDay.toFixed(0));
    $('o-payback').textContent = r.paybackMonths ? r.paybackMonths.toFixed(0) + ' mo' : 'never';
    $('o-breakeven').textContent = r.breakeven ? Math.ceil(r.breakeven) + ' mi' : 'none';
    $('o-verdict').textContent =
      r.cpm <= 1.0 ? 'At or under the $0.99 bull case. Check which assumption is doing the lifting.'
        : r.cpm <= 2.0 ? 'Between the bull case and the $1.98 estimate: roughly where 2026 lives.'
          : 'Above the published Waymo estimate. This is what early fleets look like.';

    $('o-split').innerHTML = r.split.map(([k, v]) =>
      `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0">
        <span>${k}</span><span class="num">${money(v)} · ${Math.round(v / r.costDay * 100)}%</span></div>`).join('');
  }

  wrap.addEventListener('input', compute);
  compute();
})();
