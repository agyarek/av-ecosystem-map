/* regulation.js :: region tabs with URL-hash persistence. */
(function () {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const show = id => {
    tabs.forEach(t => {
      const sel = t.dataset.tab === id;
      t.setAttribute('aria-selected', sel);
      t.tabIndex = sel ? 0 : -1;
    });
    document.querySelectorAll('.region-panel').forEach(p => { p.hidden = p.id !== 'panel-' + id; });
  };
  const select = t => {
    show(t.dataset.tab);
    history.replaceState(null, '', '#' + t.dataset.tab);
  };
  tabs.forEach(t => t.addEventListener('click', () => select(t)));
  // APG tablist keyboard contract: a vertical list moves on Up/Down, Home/End
  // jump, and focus follows selection (roving tabindex).
  const list = document.querySelector('[role="tablist"]');
  if (list) list.addEventListener('keydown', e => {
    const i = tabs.indexOf(e.target.closest('[role="tab"]'));
    if (i < 0) return;
    let to = -1;
    if (e.key === 'ArrowDown') to = (i + 1) % tabs.length;
    else if (e.key === 'ArrowUp') to = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = tabs.length - 1;
    if (to < 0) return;
    e.preventDefault();
    select(tabs[to]);
    tabs[to].focus();
  });
  const initial = location.hash.slice(1);
  if (tabs.some(t => t.dataset.tab === initial)) show(initial);
  else if (initial === 'speed') document.getElementById('speed').scrollIntoView();
})();
