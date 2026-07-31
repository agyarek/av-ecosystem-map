/* export-png.js :: turns a built comparison into a single downloadable PNG.

   Drawn onto a canvas by hand rather than serialised through an SVG
   foreignObject: that route taints the canvas in several browsers, which is
   exactly the case where the download silently fails. Hand-drawing costs a
   measuring pass and buys a file that always saves.

   Every export carries the site and the byline, because these tables travel
   without their page. */
(function () {
  'use strict';

  const SITE = 'agyarek.github.io/av-ecosystem-map';
  const AUTHOR = 'Compiled by Kofi Agyare-Kwabi · linkedin.com/in/kofiagyare';

  const SCALE = 2;              // retina; the canvas is drawn in CSS px and scaled
  const PAD = 28;
  const CELL_X = 14;
  const CELL_Y = 11;
  const LINE = 17;
  const MAX_COL = 260;          // wrap width for a body column, CSS px
  const MAX_LABEL = 230;

  const theme = () => document.documentElement.dataset.theme === 'dark';
  const palette = () => theme()
    ? { bg: '#14150F', panel: '#1C1E17', ink: '#F2F2EC', ink2: '#C4C7BB', muted: '#8B8F82', rule: '#2E3128', accent: '#00A5B8' }
    : { bg: '#FFFFFF', panel: '#FAFAF7', ink: '#12130F', ink2: '#3B3E36', muted: '#6E7268', rule: '#DEDFD8', accent: '#00A5B8' };

  const FONT = (w, s, mono) =>
    `${w} ${s}px ${mono ? "'IBM Plex Mono', ui-monospace, monospace" : "'Archivo', system-ui, sans-serif"}`;

  // Greedy wrap of one string into at most `maxLines` lines of `width` px.
  function wrap(ctx, text, width, maxLines) {
    const words = String(text ?? '').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const next = line + ' ' + words[i];
      if (ctx.measureText(next).width <= width) { line = next; }
      else { lines.push(line); line = words[i]; }
    }
    lines.push(line);
    if (lines.length <= maxLines) return lines;
    const cut = lines.slice(0, maxLines);
    let last = cut[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > width) last = last.slice(0, -1);
    cut[maxLines - 1] = last + '…';
    return cut;
  }

  /* spec = {
       title, subtitle,
       columns: [{ label, sub }],            // company columns, no label column
       rows:    [{ label, sub, cells: [{ text, sub, mono }] }],
       note                                   // optional caveat line under the table
     } */
  function exportTablePNG(spec) {
    const P = palette();
    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');

    // ---- measure
    ctx.font = FONT(600, 13);
    const labelW = Math.min(MAX_LABEL, Math.max(120, ...spec.rows.map(r =>
      ctx.measureText(r.label).width + CELL_X * 2)));

    const colW = spec.columns.map((c, i) => {
      ctx.font = FONT(800, 14);
      let w = ctx.measureText(c.label).width;
      ctx.font = FONT(500, 13, true);
      spec.rows.forEach(r => {
        const cell = r.cells[i] || {};
        w = Math.max(w, ctx.measureText(String(cell.text ?? '')).width);
      });
      return Math.min(MAX_COL, Math.max(110, w + CELL_X * 2));
    });

    // row heights depend on wrapped line counts, so measure before sizing
    ctx.font = FONT(500, 13, true);
    const rowLines = spec.rows.map((r, ri) => {
      let n = 1;
      spec.columns.forEach((c, i) => {
        const cell = r.cells[i] || {};
        ctx.font = FONT(500, 13, cell.mono !== false);
        n = Math.max(n, wrap(ctx, cell.text, colW[i] - CELL_X * 2, 3).length + (cell.sub ? 1 : 0));
      });
      ctx.font = FONT(600, 13);
      n = Math.max(n, wrap(ctx, r.label, labelW - CELL_X * 2, 3).length + (r.sub ? 1 : 0));
      return n;
    });

    const headH = 52;
    const rowH = rowLines.map(n => n * LINE + CELL_Y * 2);
    const tableW = labelW + colW.reduce((a, b) => a + b, 0);

    ctx.font = FONT(800, 24);
    const titleW = ctx.measureText(spec.title).width;
    const W = Math.max(tableW, titleW, 560) + PAD * 2;

    ctx.font = FONT(400, 12);
    const subLines = spec.subtitle ? wrap(ctx, spec.subtitle, W - PAD * 2, 3) : [];
    const noteLines = spec.note ? wrap(ctx, spec.note, W - PAD * 2, 4) : [];

    const topH = PAD + 30 + subLines.length * 16 + 16;
    const bodyH = headH + rowH.reduce((a, b) => a + b, 0);
    const footH = 18 + noteLines.length * 16 + 44 + PAD;
    const H = topH + bodyH + footH;

    cvs.width = W * SCALE;
    cvs.height = H * SCALE;
    ctx.scale(SCALE, SCALE);

    // ---- paint
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top';

    ctx.fillStyle = P.ink;
    ctx.font = FONT(800, 24);
    ctx.fillText(spec.title, PAD, PAD);
    ctx.fillStyle = P.muted;
    ctx.font = FONT(400, 12);
    subLines.forEach((l, i) => ctx.fillText(l, PAD, PAD + 32 + i * 16));

    let y = topH;

    // header band
    ctx.fillStyle = P.panel;
    ctx.fillRect(PAD, y, tableW, headH);
    let x = PAD + labelW;
    spec.columns.forEach((c, i) => {
      ctx.fillStyle = P.ink;
      ctx.font = FONT(800, 14);
      ctx.fillText(c.label, x + CELL_X, y + 10);
      if (c.sub) {
        ctx.fillStyle = P.muted;
        ctx.font = FONT(400, 11);
        ctx.fillText(c.sub, x + CELL_X, y + 29);
      }
      x += colW[i];
    });
    ctx.strokeStyle = P.rule;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, y + headH - .5); ctx.lineTo(PAD + tableW, y + headH - .5); ctx.stroke();
    y += headH;

    spec.rows.forEach((r, ri) => {
      const h = rowH[ri];
      if (ri % 2) { ctx.fillStyle = P.panel; ctx.fillRect(PAD, y, tableW, h); }

      ctx.fillStyle = P.ink2;
      ctx.font = FONT(600, 13);
      wrap(ctx, r.label, labelW - CELL_X * 2, 3)
        .forEach((l, i) => ctx.fillText(l, PAD + CELL_X, y + CELL_Y + i * LINE));
      if (r.sub) {
        ctx.fillStyle = P.muted;
        ctx.font = FONT(400, 11);
        ctx.fillText(r.sub, PAD + CELL_X, y + h - CELL_Y - 12);
      }

      x = PAD + labelW;
      spec.columns.forEach((c, i) => {
        const cell = r.cells[i] || {};
        ctx.fillStyle = P.ink;
        ctx.font = FONT(500, 13, cell.mono !== false);
        const lines = wrap(ctx, cell.text, colW[i] - CELL_X * 2, 3);
        lines.forEach((l, li) => ctx.fillText(l, x + CELL_X, y + CELL_Y + li * LINE));
        if (cell.sub) {
          ctx.fillStyle = P.muted;
          ctx.font = FONT(400, 11);
          ctx.fillText(cell.sub, x + CELL_X, y + CELL_Y + lines.length * LINE);
        }
        x += colW[i];
      });

      ctx.strokeStyle = P.rule;
      ctx.beginPath(); ctx.moveTo(PAD, y + h - .5); ctx.lineTo(PAD + tableW, y + h - .5); ctx.stroke();
      y += h;
    });

    y += 18;
    if (noteLines.length) {
      ctx.fillStyle = P.muted;
      ctx.font = FONT(400, 11);
      noteLines.forEach((l, i) => ctx.fillText(l, PAD, y + i * 16));
      y += noteLines.length * 16 + 10;
    }

    ctx.strokeStyle = P.rule;
    ctx.beginPath(); ctx.moveTo(PAD, y + .5); ctx.lineTo(W - PAD, y + .5); ctx.stroke();
    ctx.fillStyle = P.accent;
    ctx.font = FONT(700, 12);
    ctx.fillText(SITE, PAD, y + 12);
    ctx.fillStyle = P.muted;
    ctx.font = FONT(400, 12);
    ctx.fillText(AUTHOR, PAD, y + 28);

    // ---- save
    const name = (spec.filename || 'av-comparison').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const done = blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (cvs.toBlob) cvs.toBlob(done, 'image/png');
    else done(null);
  }

  window.AV.exportTablePNG = exportTablePNG;
})();
