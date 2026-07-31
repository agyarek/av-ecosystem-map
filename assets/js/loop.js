/* loop.js :: the home circuit and its live counts.
   Motion earns its place here and nowhere else; reduced-motion renders the
   same information with none of the travel. */
(function () {
  'use strict';
  const { json, esc, reducedMotion } = window.AV;

  // ---------------------------------------------------------- live counts
  json('data/derived-counts.json').then(d => {
    document.querySelectorAll('[data-count]').forEach(el => {
      const n = d.stations[el.dataset.count];
      if (n) el.textContent = `${n} orgs`;
    });
  }).catch(() => { /* the markup ships with counts already in it */ });

  // ---------------------------------------------------------- the circuit
  const path = document.getElementById('track-path');
  const token = document.getElementById('token');
  const wrap = document.getElementById('loop-wrap');
  if (!path || !token || !wrap) return;

  const TOTAL = path.getTotalLength();
  // A lap past four stations every 18 seconds gave each one about four seconds,
  // which is not long enough to read a name in passing. The car now takes half
  // again as long and, like the explicit ride, actually stops at each station
  // instead of sailing through.
  const AMBIENT_LAP_S = 34;
  const AMBIENT_DWELL_MS = 2600;
  const stations = ['request', 'driver', 'vehicle', 'pitlane'];
  const stationEls = Object.fromEntries(stations.map(s =>
    [s, wrap.querySelector(`[data-station="${s}"]`)]));
  const anchor = { request: [90, 310], driver: [550, 70], vehicle: [1010, 310], pitlane: [550, 550] };

  // locate each station's position along the path once
  const frac = {};
  {
    const N = 900;
    for (const s of stations) {
      let best = 0, bd = 1e9;
      for (let i = 0; i < N; i++) {
        const p = path.getPointAtLength(TOTAL * i / N);
        const d2 = (p.x - anchor[s][0]) ** 2 + (p.y - anchor[s][1]) ** 2;
        if (d2 < bd) { bd = d2; best = i / N; }
      }
      frac[s] = best;
    }
  }

  const CAPTIONS = {
    request: 'A rider taps a button. A marketplace prices the trip, picks a car from the fleet, and the nearest available vehicle accepts the job before the app finishes its animation.',
    driver: 'Software drives the pickup and the trip. Cameras, lidar and radar feed a model that predicts what everyone nearby will do next, on roads rehearsed millions of times in simulation.',
    vehicle: 'The machine itself is a production car re-engineered around redundancy. Steering, braking and power all carry backups, because there is no human backup left aboard.',
    pitlane: 'At the depot the car charges, gets cleaned and inspected, then rejoins the queue. The faster that handoff, the better the arithmetic of every ride that follows.'
  };

  let t = 0;                       // position along path, 0..1
  let mode = 'ambient';            // ambient | parked | ride
  let parkTarget = null;
  let last = performance.now();
  let rideStep = -1, rideUntil = 0, rideMoveFrom = 0, rideMoveStart = 0;
  let paused = false, dwellUntil = 0, dwelt = null;

  const lcDefault = document.getElementById('lc-default');
  const lcStation = document.getElementById('lc-station');
  const lcCaption = document.getElementById('lc-caption');
  const runBtn = document.getElementById('run-ride');

  // The old version of this had a pause and the rewrite lost it. Motion you
  // cannot stop is motion imposed on the reader.
  const pauseBtn = document.getElementById('loop-pause');
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', paused);
    pauseBtn.textContent = paused ? 'Resume the loop' : 'Pause the loop';
    if (!paused) last = performance.now();   // do not bank the paused seconds
  });

  function place(u) {
    const p = path.getPointAtLength(((u % 1) + 1) % 1 * TOTAL);
    const q = path.getPointAtLength((((u % 1) + 1) % 1 * TOTAL + 2) % TOTAL);
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    token.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
  }
  function lightNearest() {
    for (const s of stations) {
      const d = Math.min(Math.abs(t - frac[s]), 1 - Math.abs(t - frac[s]));
      stationEls[s].classList.toggle('active', d < 0.035);
    }
  }
  function lightOnly(name) {
    for (const s of stations) stationEls[s].classList.toggle('active', s === name);
  }
  function lightAll(on) {
    for (const s of stations) stationEls[s].classList.toggle('active', on);
  }
  const fwdDist = (from, to) => ((to - from) % 1 + 1) % 1;
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (paused) { requestAnimationFrame(frame); return; }
    if (mode === 'ambient') {
      if (dwellUntil) {
        if (now >= dwellUntil) { dwellUntil = 0; showDefault(); }
      } else {
        const step = dt / AMBIENT_LAP_S;
        // stop the moment the car reaches a station rather than gliding past it
        const hit = stations.find(s =>
          s !== dwelt && fwdDist(t, frac[s]) > 0 && fwdDist(t, frac[s]) <= step);
        if (hit) {
          t = frac[hit]; dwelt = hit;
          dwellUntil = now + AMBIENT_DWELL_MS;
          lightOnly(hit); showStation(hit);
        } else {
          t = (t + step) % 1;
        }
      }
      lightNearest();
    } else if (mode === 'parked' && parkTarget != null) {
      const d = fwdDist(t, parkTarget);
      if (d > 0.002) t = (t + Math.min(d, dt * 0.22)) % 1;
    } else if (mode === 'ride') {
      rideFrame(now);
    }
    place(t);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------- station panels
  function showStation(name) {
    const src = document.querySelector(`#loop-list li[data-station="${name}"]`);
    if (!src) return;
    lcStation.innerHTML = `
      <h3>${esc(src.querySelector('h3').firstChild.textContent.trim())}
        <span class="num caption"> ${esc(src.querySelector('[data-count]').textContent)}</span></h3>
      <p class="desc">${src.querySelector('.desc').innerHTML}</p>
      <div class="layers">${src.querySelector('.layers').innerHTML}</div>
      <p class="ex">${src.querySelector('.ex').innerHTML}</p>`;
    lcDefault.hidden = true; lcCaption.hidden = true; lcStation.hidden = false;
  }
  function showDefault() {
    lcStation.hidden = true; lcCaption.hidden = true; lcDefault.hidden = false;
  }

  for (const s of stations) {
    const el = stationEls[s];
    el.addEventListener('mouseenter', () => { if (mode === 'ride') return; mode = 'parked'; parkTarget = frac[s]; lightOnly(s); showStation(s); });
    el.addEventListener('focus', () => { if (mode === 'ride') return; mode = 'parked'; parkTarget = frac[s]; lightOnly(s); showStation(s); });
    el.addEventListener('mouseleave', endPark);
    el.addEventListener('blur', endPark);
  }
  function endPark() {
    if (mode !== 'parked') return;
    mode = 'ambient'; parkTarget = null; showDefault();
  }

  // ---------------------------------------------------------- run one ride
  function caption(name) {
    lcCaption.innerHTML = `<p class="lc-kicker">${esc(name.toUpperCase())} · ${esc(stationEls[name].querySelector('.st-count').textContent)}</p>
      <p class="cap-text">${esc(CAPTIONS[name])}</p>`;
    lcDefault.hidden = true; lcStation.hidden = true; lcCaption.hidden = false;
  }
  function startRide() {
    if (mode === 'ride') { stopRide(); return; }
    mode = 'ride';
    runBtn.textContent = 'STOP THE RIDE';
    if (reducedMotion()) {
      // same words, no travel: step the captions, light stations in order
      let i = 0;
      caption(stations[0]); lightOnly(stations[0]);
      rideTimer = setInterval(() => {
        i++;
        if (i >= stations.length) { stopRide(); return; }
        caption(stations[i]); lightOnly(stations[i]);
      }, 5200);
      return;
    }
    rideStep = -1; rideUntil = 0;
    advanceRide(performance.now());
  }
  let rideTimer = null;
  function advanceRide(now) {
    rideStep++;
    if (rideStep >= stations.length) { stopRide(); return; }
    rideMoveFrom = t; rideMoveStart = now;
    rideUntil = 0; // moving phase
  }
  function rideFrame(now) {
    const s = stations[rideStep];
    if (!s) return;
    if (!rideUntil) {                       // travelling to the station
      const D = 2400;
      const u = Math.min(1, (now - rideMoveStart) / D);
      t = (rideMoveFrom + fwdDist(rideMoveFrom, frac[s]) * ease(u)) % 1;
      lightNearest();
      if (u >= 1) { rideUntil = now + 3400; caption(s); lightOnly(s); }
    } else if (now >= rideUntil) {
      advanceRide(now);
    }
  }
  function stopRide() {
    mode = 'ambient';
    if (rideTimer) { clearInterval(rideTimer); rideTimer = null; }
    runBtn.textContent = 'RUN ONE RIDE';
    showDefault();
  }
  runBtn.addEventListener('click', startRide);
  addEventListener('keydown', e => { if (e.key === 'Escape' && mode === 'ride') stopRide(); });

  // ---------------------------------------------------------- start
  if (reducedMotion()) {
    // token parked at the request, every station lit, information identical
    t = frac.request;
    place(t);
    lightAll(true);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', ev => {
      if (!ev.matches) { last = performance.now(); requestAnimationFrame(frame); }
    });
  } else {
    requestAnimationFrame(frame);
  }
})();
