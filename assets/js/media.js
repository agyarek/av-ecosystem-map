/* media.js :: the media page. Renders publications, podcasts and events from
   data/av-media.json.

   No reader counts render: a tile earns its place editorially, not by
   audience size. Each tile carries a small mark for what kind of thing it is
   — pen for the written word, mic for audio, calendar for a room. */
(function () {
  'use strict';
  const { json, esc, mountLogos } = window.AV;
  // must match tools/fetch-logos.py media_key()
  const logoKey = d => 'media-' + d.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const KIND_ICON = {
    read: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.2 2.2 13.8 4.8 5.6 13 2.2 13.8 3 10.4 Z"/></svg>',
    listen: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="1.5" width="4" height="8" rx="2"/><path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"/></svg>',
    meet: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/></svg>',
  };
  const KIND_LABEL = { read: 'newsletter', listen: 'podcast', meet: 'event' };

  const tile = (m, kind) => `
    <a class="md-tile" href="${esc(m.url)}" target="_blank" rel="noopener">
      <span class="mono-tile md-logo" aria-hidden="true">${esc(m.name.slice(0, 2).toUpperCase())}${m.domain ? `<img alt="${esc(m.name)}" data-logo="${esc(logoKey(m.domain))}" width="256" height="256" decoding="async">` : ''}</span>
      <span class="md-body">
        <span class="md-name">${esc(m.name)}<span class="md-kind" title="${esc(KIND_LABEL[kind] || '')}">${KIND_ICON[kind] || ''}<span>${esc(KIND_LABEL[kind] || '')}</span></span>${m.pick ? '<span class="md-pick"><span class="gold-dot" aria-hidden="true"></span> LISTENED TO — RECOMMENDED</span>' : ''}</span>
        <span class="md-who">${esc(m.who || m.where || '')}</span>
        <span class="md-blurb">${esc(m.blurb)}</span>
        ${m.next ? `<span class="md-count">Next: ${esc(m.next)}</span>` : ''}
      </span>
    </a>`;

  json('data/av-media.json').then(d => {
    const el = id => document.getElementById(id);
    el('md-publications').innerHTML = d.publications.map(m => tile(m, 'read')).join('');
    el('md-podcasts').innerHTML = d.podcasts.map(m => tile(m, 'listen')).join('');
    const events = [...d.events].sort((a, b) => (b.autonomyFirst === true) - (a.autonomyFirst === true));
    el('md-events').innerHTML = events.map(m => tile(m, 'meet')).join('');
    mountLogos(document.getElementById('content'));
  }).catch(e => console.error(e));

})();
