/* regulation.js :: region tabs with URL-hash persistence. */
(function () {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const show = id => {
    tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === id));
    document.querySelectorAll('.region-panel').forEach(p => { p.hidden = p.id !== 'panel-' + id; });
  };
  tabs.forEach(t => t.addEventListener('click', () => {
    show(t.dataset.tab);
    history.replaceState(null, '', '#' + t.dataset.tab);
  }));
  const initial = location.hash.slice(1);
  if (tabs.some(t => t.dataset.tab === initial)) show(initial);
  else if (initial === 'speed') document.getElementById('speed').scrollIntoView();
})();
