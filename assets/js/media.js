/* media.js :: the media page. Renders publications, podcasts and events from
   data/av-media.json, and runs the subscribe dialog.

   Subscriber figures follow one rule, stated in the data file: a number appears
   only when the outlet publishes one; nothing is estimated. Outlets with a
   stated figure sort first, largest first. */
(function () {
  'use strict';
  const { json, esc, mountLogos, fmtDate } = window.AV;

  // Buttondown username for the subscribe form. Until it is set, the dialog
  // offers the mailto fallback instead of a dead form.
  const BUTTONDOWN = '';
  const RECOMMEND = 'mailto:agyarek+avecosystemmap@gmail.com';

  const countNum = m => {
    if (!m || !m.subscribers) return -1;
    const n = parseInt(String(m.subscribers.label).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  const tile = m => `
    <a class="md-tile" href="${esc(m.url)}" target="_blank" rel="noopener">
      <span class="mono-tile md-logo" aria-hidden="true">${esc(m.name.slice(0, 2).toUpperCase())}${m.domain ? `<img alt="" data-logo-domain="${esc(m.domain)}" decoding="async">` : ''}</span>
      <span class="md-body">
        <span class="md-name">${esc(m.name)}${m.pick ? '<span class="md-pick"><span class="gold-dot" aria-hidden="true"></span> LISTENED TO — RECOMMENDED</span>' : ''}</span>
        <span class="md-who">${esc(m.who || m.where || '')}</span>
        <span class="md-blurb">${esc(m.blurb)}</span>
        ${m.subscribers ? `<span class="md-count"><span class="num">${esc(m.subscribers.label)}</span> · ${esc(m.subscribers.source)}, ${esc(fmtDate(m.subscribers.asOf))}</span>` : ''}
        ${m.next ? `<span class="md-count">Next: ${esc(m.next)}</span>` : ''}
      </span>
    </a>`;

  json('data/av-media.json').then(d => {
    const pubs = [...d.publications].sort((a, b) => countNum(b) - countNum(a));
    const el = id => document.getElementById(id);
    el('md-publications').innerHTML = pubs.map(tile).join('');
    el('md-podcasts').innerHTML = d.podcasts.map(tile).join('');
    const events = [...d.events].sort((a, b) => (b.autonomyFirst === true) - (a.autonomyFirst === true));
    el('md-events').innerHTML = events.map(tile).join('');
    mountLogos(document.getElementById('content'));
  }).catch(e => console.error(e));

  // ------------------------------------------------------------- subscribe
  const dlg = document.getElementById('subscribe-dialog');
  const openBtn = document.getElementById('subscribe-open');
  if (dlg && openBtn) {
    const form = dlg.querySelector('form');
    if (BUTTONDOWN) {
      form.action = `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN}`;
    } else {
      // No list yet: keep the promise honest and route the email to me instead.
      form.hidden = true;
      dlg.querySelector('.sub-fallback').hidden = false;
    }
    openBtn.addEventListener('click', () => dlg.showModal());
    dlg.querySelector('.sub-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
})();
