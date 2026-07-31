/* loop.js :: the home circuit.

   Four station cards sit in the quadrants inside the track, and the car stops at
   each one in turn: Request (top left), Driver (top right), Vehicle (bottom
   right), Pitlane (bottom left) — clockwise, the order a ride happens in.

   Three rules this rewrite exists to enforce:
     1. Nothing moves faster because a pointer passed over it. The old build sped
        the car up on hover, which read as losing information you were reading.
     2. Nothing in a card is a link. Cards used to navigate away mid-read.
     3. The reader sets the pace: pause is always visible, the arrows step in
        either direction from anywhere in the loop, and a depleting ring on the
        active card says how long is left before the car moves on. */
(function () {
  'use strict';
  const { json, reducedMotion } = window.AV;

  // ---------------------------------------------------------- live counts
  json('data/derived-counts.json').then(d => {
    document.querySelectorAll('[data-count]').forEach(el => {
      const n = d.stations[el.dataset.count];
      if (n) el.textContent = `${n} orgs`;
    });
  }).catch(() => { /* the markup ships with counts already in it */ });

  const path = document.getElementById('track-path');
  const token = document.getElementById('token');
  const wrap = document.getElementById('loop-wrap');
  if (!path || !token || !wrap) return;

  const TOTAL = path.getTotalLength();
  const DWELL_MS = 7000;      // long enough to read a card; the ring shows it
  const LEG_MS = 3600;        // travel time between neighbouring stations
  const TURN_MS = 1150;       // the three-point turn

  // Clockwise, each stop on a straight run beside its own card, so the car is
  // always level when parked rather than frozen mid-corner.
  const stations = ['request', 'driver', 'vehicle', 'pitlane'];
  const anchor = {
    request: [300, 70], driver: [800, 70], vehicle: [800, 710], pitlane: [300, 710]
  };
  const cards = Object.fromEntries(stations.map(s =>
    [s, wrap.querySelector(`[data-station="${s}"]`)]));

  // locate each station along the path once
  const frac = {};
  {
    const N = 1200;
    for (const s of stations) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < N; i++) {
        const p = path.getPointAtLength(TOTAL * i / N);
        const d2 = (p.x - anchor[s][0]) ** 2 + (p.y - anchor[s][1]) ** 2;
        if (d2 < bd) { bd = d2; best = i / N; }
      }
      frac[s] = best;
    }
  }

  // ------------------------------------------------------------- state
  let idx = 0;              // the station we are at, or travelling toward
  let atStation = false;    // true while dwelling
  let heading = 1;          // +1 clockwise; -1 after a three-point turn
  let paused = false;
  let t = frac[stations[0]];
  let dwellStart = 0, dwellDone = 0;           // dwellDone banks time across pauses
  let legStart = 0, legFrom = 0, legDone = 0;  // legDone banks travel across pauses
  let turn = null;                              // {start, dir, then}

  const wrapIdx = i => (i % stations.length + stations.length) % stations.length;
  const fwd = (from, to) => ((to - from) % 1 + 1) % 1;
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  // ------------------------------------------------------------- painting
  function place(u, extraRot, offAlong, offSide) {
    const at = ((u % 1) + 1) % 1 * TOTAL;
    const p = path.getPointAtLength(at);
    const q = path.getPointAtLength((at + 2) % TOTAL);
    const ang = Math.atan2(q.y - p.y, q.x - p.x);
    const base = ang * 180 / Math.PI + (heading === 1 ? 0 : 180);
    // offsets are in the car's own frame, so the turn reads as a manoeuvre
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const x = p.x + ca * (offAlong || 0) - sa * (offSide || 0);
    const y = p.y + sa * (offAlong || 0) + ca * (offSide || 0);
    token.setAttribute('transform', `translate(${x} ${y}) rotate(${base + (extraRot || 0)})`);
  }

  function paintActive() {
    stations.forEach((s, i) =>
      cards[s].classList.toggle('active', i === idx && atStation));
  }
  function paintRing(pct) {
    const rect = cards[stations[idx]].querySelector('.st-ring rect');
    if (rect) rect.style.strokeDashoffset = String(Math.min(100, 100 * pct));
  }
  function clearRings() {
    stations.forEach(s => {
      const r = cards[s].querySelector('.st-ring rect');
      if (r) r.style.strokeDashoffset = '100';
    });
  }

  // The ring is a real rounded rect stroked around the card, so its radius has
  // to track the card's measured box rather than being guessed.
  function sizeRings() {
    stations.forEach(s => {
      const card = cards[s], svg = card.querySelector('.st-ring');
      if (!svg) return;
      const r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const rx = parseFloat(getComputedStyle(card).borderBottomRightRadius) || 18;
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      const rect = svg.querySelector('rect');
      rect.setAttribute('x', 1.5); rect.setAttribute('y', 1.5);
      rect.setAttribute('width', Math.max(0, r.width - 3));
      rect.setAttribute('height', Math.max(0, r.height - 3));
      rect.setAttribute('rx', Math.max(0, rx - 1.5));
      rect.setAttribute('pathLength', 100);
    });
  }
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(sizeRings);
    stations.forEach(s => ro.observe(cards[s]));
  }
  addEventListener('resize', sizeRings);

  // ------------------------------------------------------------- movement
  function goTo(i, dir) {
    idx = wrapIdx(i);
    atStation = false;
    heading = dir;
    legFrom = t; legStart = performance.now(); legDone = 0;
    paintActive();
    clearRings();
  }
  function arrive(now) {
    t = frac[stations[idx]];
    atStation = true;
    dwellStart = now; dwellDone = 0;
    paintActive();
    sizeRings();
  }

  // A tight three-point turn: nose out, back across, straighten up facing the
  // other way. Net 180 degrees, ending where it started.
  function startTurn(dir, then) {
    if (reducedMotion()) { heading = dir; then(); return; }
    turn = { start: performance.now(), dir, then };
  }
  function frameTurn(now) {
    const u = Math.min(1, (now - turn.start) / TURN_MS);
    const sign = turn.dir === 1 ? -1 : 1;
    let rot, along, side;
    if (u < 1 / 3) {                            // pull out forward
      const k = ease(u * 3);
      rot = 70 * k; along = 7 * k; side = 5 * k;
      token.classList.remove('reversing');
    } else if (u < 2 / 3) {                     // reverse across the road
      const k = ease((u - 1 / 3) * 3);
      rot = 70 + 40 * k; along = 7 - 17 * k; side = 5 + 3 * k;
      token.classList.add('reversing');
    } else {                                    // straighten up, new heading
      const k = ease((u - 2 / 3) * 3);
      rot = 110 + 70 * k; along = -10 + 10 * k; side = 8 - 8 * k;
      token.classList.remove('reversing');
    }
    place(t, sign * rot, along, sign * side);
    if (u >= 1) {
      token.classList.remove('reversing');
      const done = turn.then; heading = turn.dir; turn = null; done();
    }
  }

  function frame(now) {
    if (turn) { frameTurn(now); requestAnimationFrame(frame); return; }

    if (atStation) {
      if (paused) {
        dwellStart = now - dwellDone;           // hold the ring where it is
      } else {
        dwellDone = now - dwellStart;
        const u = dwellDone / DWELL_MS;
        paintRing(u);
        if (u >= 1) goTo(idx + heading, heading);
      }
    } else if (paused) {
      legStart = now - legDone;                 // hold position on the road
    } else {
      legDone = now - legStart;
      const target = frac[stations[idx]];
      const span = heading === 1 ? fwd(legFrom, target) : fwd(target, legFrom);
      const u = Math.min(1, legDone / LEG_MS);
      t = ((heading === 1 ? legFrom + span * ease(u) : legFrom - span * ease(u)) % 1 + 1) % 1;
      if (u >= 1) arrive(now);
    }
    place(t, 0, 0, 0);
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------- controls
  const playBtn = document.getElementById('loop-play');
  const backBtn = document.getElementById('loop-back');
  const fwdBtn = document.getElementById('loop-fwd');
  if (!playBtn) return;

  function setPaused(v) {
    paused = v;
    playBtn.setAttribute('aria-pressed', String(v));
    playBtn.setAttribute('aria-label', v ? 'Play the loop' : 'Pause the loop');
    playBtn.querySelector('.lp-label').textContent = v ? 'PLAY' : 'PAUSE';
    playBtn.classList.toggle('is-paused', v);
  }
  playBtn.addEventListener('click', () => setPaused(!paused));

  // Forward and back work from anywhere in the loop, mid-leg included. Stepping
  // against the current heading turns the car around first.
  function step(dir) {
    if (turn) return;                            // let the manoeuvre finish
    if (paused) setPaused(false);
    const next = atStation ? idx + dir : (dir === heading ? idx : idx - dir);
    if (dir === heading) goTo(next, dir);
    else startTurn(dir, () => goTo(next, dir));
  }
  fwdBtn.addEventListener('click', () => step(1));
  backBtn.addEventListener('click', () => step(-1));

  // ------------------------------------------------------------- start
  sizeRings();
  atStation = true;
  dwellStart = performance.now(); dwellDone = 0;
  paintActive();
  place(t, 0, 0, 0);

  if (reducedMotion()) {
    // no travel: every card readable at once, the car parked at the first stop
    stations.forEach(s => cards[s].classList.add('active'));
    setPaused(true);
    // honour a later change of preference
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', ev => {
      if (!ev.matches) {
        stations.forEach((s, i) => cards[s].classList.toggle('active', i === idx));
        setPaused(false);
        requestAnimationFrame(frame);
      }
    });
  } else {
    requestAnimationFrame(frame);
  }
})();
