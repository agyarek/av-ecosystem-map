const express = require('express');
const { tileQueries, settingQueries, reorderTiles } = require('../db');
const { iconNames, getIconSvg } = require('../icons');
const { contentTypes } = require('../fetchers');
const requireAuth = require('../middleware/require-auth');
const { verifyCredentials, isRateLimited, recordFailedAttempt, clearAttempts } = require('../auth');
const { regenerateStaticPage, getSettings } = require('../static-generator');

const router = express.Router();

// Helper: render an admin view inside the admin layout
function renderAdmin(res, view, locals = {}) {
  const ejs = require('ejs');
  const fs = require('fs');
  const path = require('path');

  const flash = locals._flash || null;
  const viewPath = path.join(__dirname, '..', 'views', 'admin', view + '.ejs');
  const layoutPath = path.join(__dirname, '..', 'views', 'layouts', 'admin.ejs');

  const viewHtml = ejs.render(fs.readFileSync(viewPath, 'utf-8'), { ...locals, flash });
  const html = ejs.render(fs.readFileSync(layoutPath, 'utf-8'), {
    ...locals,
    body: viewHtml,
    flash,
    pageTitle: locals.pageTitle || 'Admin',
  });

  res.send(html);
}

// --- Authentication routes (no auth required) ---

router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render(require('path').join(__dirname, '..', 'views', 'admin', 'login.ejs'), { error: null });
});

router.post('/login', (req, res) => {
  const ip = req.ip;

  if (isRateLimited(ip)) {
    return res.render(require('path').join(__dirname, '..', 'views', 'admin', 'login.ejs'), {
      error: 'Too many failed attempts. Please wait 60 seconds.',
    });
  }

  const { username, password } = req.body;

  if (verifyCredentials(username, password)) {
    clearAttempts(ip);
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  recordFailedAttempt(ip);
  res.render(require('path').join(__dirname, '..', 'views', 'admin', 'login.ejs'), {
    error: 'Invalid username or password.',
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// --- All routes below require authentication ---
router.use(requireAuth);

// --- Dashboard ---

router.get('/', (req, res) => {
  const tiles = tileQueries.getAll.all().map((tile) => ({
    ...tile,
    icon_svg: tile.icon ? getIconSvg(tile.icon) : '',
  }));
  renderAdmin(res, 'dashboard', {
    pageTitle: 'Tiles',
    tiles,
    _flash: req.session._flash || null,
  });
  delete req.session._flash;
});

// --- Tile CRUD ---

router.get('/tiles/new', (req, res) => {
  renderAdmin(res, 'tile-form', {
    pageTitle: 'New Tile',
    isNew: true,
    tile: {},
    iconNames,
    contentTypes,
  });
});

router.post('/tiles', (req, res) => {
  const { title, url, color, text_color, icon, size, content_type, content_config } = req.body;
  const is_visible = req.body.is_visible ? 1 : 0;
  const maxOrder = tileQueries.getMaxOrder.get().max_order;

  tileQueries.insert.run(
    title,
    url,
    color || '#2563EB',
    text_color || '#FFFFFF',
    icon || null,
    maxOrder + 1,
    is_visible,
    content_type || 'link',
    content_config || null,
    size || 'medium'
  );

  regenerateStaticPage();
  req.session._flash = { type: 'success', message: 'Tile created.' };
  res.redirect('/admin');
});

router.get('/tiles/:id/edit', (req, res) => {
  const tile = tileQueries.getById.get(req.params.id);
  if (!tile) {
    req.session._flash = { type: 'error', message: 'Tile not found.' };
    return res.redirect('/admin');
  }
  renderAdmin(res, 'tile-form', {
    pageTitle: 'Edit Tile',
    isNew: false,
    tile,
    iconNames,
    contentTypes,
  });
});

router.post('/tiles/:id', (req, res) => {
  const tile = tileQueries.getById.get(req.params.id);
  if (!tile) {
    req.session._flash = { type: 'error', message: 'Tile not found.' };
    return res.redirect('/admin');
  }

  const { title, url, color, text_color, icon, size, content_type, content_config } = req.body;
  const is_visible = req.body.is_visible ? 1 : 0;

  tileQueries.update.run(
    title,
    url,
    color || '#2563EB',
    text_color || '#FFFFFF',
    icon || null,
    is_visible,
    content_type || 'link',
    content_config || null,
    size || 'medium',
    req.params.id
  );

  regenerateStaticPage();
  req.session._flash = { type: 'success', message: 'Tile updated.' };
  res.redirect('/admin');
});

router.post('/tiles/:id/delete', (req, res) => {
  tileQueries.delete.run(req.params.id);
  regenerateStaticPage();
  req.session._flash = { type: 'success', message: 'Tile deleted.' };
  res.redirect('/admin');
});

router.post('/tiles/reorder', express.json(), (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of tile IDs' });
  }
  reorderTiles(order);
  regenerateStaticPage();
  res.json({ ok: true });
});

// --- Settings ---

router.get('/settings', (req, res) => {
  const settings = getSettings();
  renderAdmin(res, 'settings', {
    pageTitle: 'Settings',
    settings,
    _flash: req.session._flash || null,
  });
  delete req.session._flash;
});

router.post('/settings', (req, res) => {
  const fields = ['site_title', 'site_tagline', 'background_color', 'font_family', 'grid_gap'];
  for (const key of fields) {
    if (req.body[key] !== undefined) {
      settingQueries.upsert.run(key, req.body[key]);
    }
  }
  regenerateStaticPage();
  req.session._flash = { type: 'success', message: 'Settings saved.' };
  res.redirect('/admin/settings');
});

module.exports = router;
