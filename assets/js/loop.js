/* loop.js :: the home circuit.

   Four station cards sit in the quadrants inside the track, and the car stops at
   each one in turn: Request (top left), Driver (top right), Vehicle (bottom
   right), Pitlane (bottom left) — clockwise, the order a ride happens in.

   Three rules this rewrite exists to enforce:
     1. Nothing moves faster because a pointer passed over it. The old build sped
        the car up on hover, which read as losing information you were reading.
     2. Nothing in a card navigates by surprise. The layer pills are the one
        deliberate exit — each links to the directory filtered to its layer,
        and says so in a tooltip before anyone clicks.
     3. The reader sets the pace: pause is always visible, the arrows step in
        either direction from anywhere in the loop, and a depleting ring on the
        active card says how long is left before the car moves on. */
(function () {
  'use strict';
  const { json, reducedMotion } = window.AV;

  // ---------------------------------------------------------- live counts
  // Stations carry a headline count; each layer chip carries its own, keyed by
  // the canonical layer name (the chip's visible label is a shortened form).
  json('data/derived-counts.json').then(d => {
    document.querySelectorAll('[data-count]').forEach(el => {
      const n = d.stations[el.dataset.count];
      if (n) el.textContent = `${n} orgs`;
    });
    document.querySelectorAll('[data-layer]').forEach(el => {
      const n = d.layers[el.dataset.layer];
      if (n) el.textContent = `${n} orgs`;
    });
  }).catch(() => { /* the markup ships with counts already in it */ });

  const path = document.getElementById('track-path');
  const token = document.getElementById('token');
  const wrap = document.getElementById('loop-wrap');
  const track = document.getElementById('track');
  if (!path || !token || !wrap) return;

  let TOTAL = 0;
  const DWELL_MS = 11000;     // long enough to read a whole card; the ring shows it
  const LEG_MS = 3600;        // travel time between neighbouring stations
  const TURN_MS = 1700;       // the three-point turn — unhurried, so it reads
                              // as a manoeuvre rather than a glitch

  // Clockwise, each stop on a straight run beside its own card, so the car is
  // always level when parked rather than frozen mid-corner.
  const stations = ['request', 'driver', 'vehicle', 'pitlane'];
  const GRID_ANCHOR = {
    request: [300, 70], driver: [800, 70], vehicle: [800, 710], pitlane: [300, 710]
  };
  const cards = Object.fromEntries(stations.map(s =>
    [s, wrap.querySelector(`[data-station="${s}"]`)]));

  // ------------------------------------------------------------ two layouts
  // Wide screens get the circuit as authored: the 1100x780 track with the four
  // cards in its quadrants. Narrow screens stack the cards in ride order and
  // the track becomes a tall ring around the whole column — the car drives
  // down the left side, stopping beside each card in turn, rounds the bottom
  // and returns up the right. Same machinery either way; only the path and
  // the anchors change.
  const colQ = matchMedia('(max-width: 680px), (orientation: landscape) and (max-height: 560px)');
  const GRID_VB = track ? track.getAttribute('viewBox') : '0 0 1100 780';
  const GRID_D = path.getAttribute('d');
  let colMode = false, tokenScale = 1, trackKey = '';
  const frac = {};

  function computeStops() {
    TOTAL = path.getTotalLength();
    const anchor = {};
    if (colMode) {
      const wb = wrap.getBoundingClientRect();
      for (const s of stations) {
        const r = cards[s].getBoundingClientRect();
        // every stop is on the right side of the ring — the down leg of a
        // clockwise lap — in ride order
        anchor[s] = [wb.width - 22, r.top - wb.top + r.height / 2];
      }
    } else Object.assign(anchor, GRID_ANCHOR);
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

  function layoutTrack() {
    if (!track) return;
    colMode = colQ.matches;
    const H = Math.max(300, Math.round(wrap.offsetHeight));
    const W = Math.max(200, Math.round(wrap.clientWidth));
    const key = colMode ? `col:${W}x${H}` : 'grid';
    if (key === trackKey) return;
    trackKey = key;
    if (colMode) {
      // ring the card column: the lanes run inside .loop-inner's padding, so
      // the road hugs the cards without ever running underneath them. The path
      // starts top-right and runs DOWN the right side — a clockwise lap, same
      // sense as the wide layout.
      const inner = wrap.querySelector('.loop-inner') || wrap;
      const y0 = Math.round(inner.offsetTop) + 12;
      const y1 = Math.round(inner.offsetTop + inner.offsetHeight) - 12;
      const x0 = 22, x1 = W - 22, r = 26;
      const d = `M ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} ` +
        `L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} ` +
        `Q ${x0} ${y0} ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} Z`;
      track.setAttribute('viewBox', `0 0 ${W} ${H}`);
      tokenScale = 0.42;
      ['track-shoulder', 'track-path', 'track-dash'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('d', d);
      });
    } else {
      track.setAttribute('viewBox', GRID_VB);
      tokenScale = 1;
      ['track-shoulder', 'track-path', 'track-dash'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('d', GRID_D);
      });
    }
    computeStops();
    // park at the current station rather than mid-manoeuvre on the old road
    turn = null; heading = 1;
    t = frac[stations[idx]];
    atStation = true;
    dwellStart = performance.now(); dwellDone = 0;
    paintActive();
    place(t, 0, 0, 0);
  }

  // ------------------------------------------------------------- state
  let idx = 0;              // the station we are at, or travelling toward
  let atStation = false;    // true while dwelling
  let heading = 1;          // +1 clockwise; -1 after a three-point turn
  let paused = false;
  let t = 0;                // set once layoutTrack has built the road
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
    token.setAttribute('transform',
      `translate(${x} ${y}) rotate(${base + (extraRot || 0)}) scale(${tokenScale})`);
  }

  function paintActive() {
    stations.forEach((s, i) =>
      cards[s].classList.toggle('active', i === idx && atStation));
  }
  function paintRing(pct) {
    // negative offsets drain the ring in the path's own direction — clockwise,
    // the same way the car and the clock run
    const ring = cards[stations[idx]].querySelector('.st-ring path');
    if (ring) ring.style.strokeDashoffset = String(-Math.min(100, 100 * pct));
  }
  function clearRings() {
    stations.forEach(s => {
      const r = cards[s].querySelector('.st-ring path');
      if (r) r.style.strokeDashoffset = '100';
    });
  }

  // The ring traces the card's real outline. Each card has one large outward
  // corner and three tight ones, so the path reads all four computed radii and
  // rounds each corner to match, rather than assuming a uniform rounded rect.
  // It starts at top centre and runs clockwise, which is where the drain begins.
  function sizeRings() {
    stations.forEach(s => {
      const card = cards[s], svg = card.querySelector('.st-ring');
      if (!svg) return;
      const box = card.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const cs = getComputedStyle(card);
      const inset = 1.5, w = box.width, h = box.height;
      const rad = side => Math.max(0,
        (parseFloat(cs[`border${side}Radius`]) || 0) - inset);
      const [tl, tr, br, bl] =
        [rad('TopLeft'), rad('TopRight'), rad('BottomRight'), rad('BottomLeft')];
      const arc = (r, x, y) => `A ${r} ${r} 0 0 1 ${x} ${y}`;
      const d = [
        `M ${w / 2} ${inset}`,
        `L ${w - inset - tr} ${inset}`, arc(tr, w - inset, inset + tr),
        `L ${w - inset} ${h - inset - br}`, arc(br, w - inset - br, h - inset),
        `L ${inset + bl} ${h - inset}`, arc(bl, inset, h - inset - bl),
        `L ${inset} ${inset + tl}`, arc(tl, inset + tl, inset),
        'Z'
      ].join(' ');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const ring = svg.querySelector('path');
      ring.setAttribute('d', d);
      ring.setAttribute('pathLength', 100);
    });
    positionControls();
    layoutTrack();     // card heights move the stops in the column layout
  }

  // The controls pill parks on the seam between the card rows. 50%/50% of the
  // wrap is not that seam: a card's text can run past its 1fr grid row, and the
  // pill would sit on it. So measure the real content bottom of the top pair
  // and the top of the bottom pair, and centre the pill between them.
  const controls = wrap.querySelector('.loop-controls');
  function positionControls() {
    if (!controls) return;
    // in the stacked column the pill sits in flow above the cards; only the
    // grid layout parks it on the seam
    if (getComputedStyle(controls).position !== 'absolute') { controls.style.top = ''; return; }
    const wb = wrap.getBoundingClientRect();
    const bottomOf = c => {
      const r = c.getBoundingClientRect();
      return Math.max(r.bottom, r.top + c.scrollHeight);
    };
    const lo = Math.max(bottomOf(cards.request), bottomOf(cards.driver));
    const hi = Math.min(cards.pitlane.getBoundingClientRect().top,
                        cards.vehicle.getBoundingClientRect().top);
    controls.style.top =
      (hi > lo ? (lo + hi) / 2 - wb.top : wb.height / 2) + 'px';
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
    // Larger sweeps than the original: the old amplitudes were tuned for the
    // desktop track and read as a jitter, not a manoeuvre. Each leg still
    // begins and ends at rest, so the three movements stay distinct.
    let rot, along, side;
    if (u < 1 / 3) {                            // pull out forward, nose swinging
      const k = ease(u * 3);
      rot = 80 * k; along = 14 * k; side = 9 * k;
      token.classList.remove('reversing');
    } else if (u < 2 / 3) {                     // reverse across the road
      const k = ease((u - 1 / 3) * 3);
      rot = 80 + 45 * k; along = 14 - 34 * k; side = 9 + 5 * k;
      token.classList.add('reversing');
    } else {                                    // straighten up, new heading
      const k = ease((u - 2 / 3) * 3);
      rot = 125 + 55 * k; along = -20 + 20 * k; side = 14 - 14 * k;
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
        // Reverse is a manoeuvre, not a standing direction: a back-step travels
        // one leg the wrong way, but once the dwell there ends the car turns
        // and resumes the clockwise ride.
        if (u >= 1) {
          if (heading === -1) startTurn(1, () => goTo(idx + 1, 1));
          else goTo(idx + 1, 1);
        }
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
  layoutTrack();
  colQ.addEventListener('change', layoutTrack);
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
