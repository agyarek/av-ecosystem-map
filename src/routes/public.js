const express = require('express');
const path = require('path');
const fs = require('fs');
const { tileQueries } = require('../db');
const { getIconSvg } = require('../icons');
const { regenerateStaticPage } = require('../static-generator');

const router = express.Router();

const staticPath = path.join(__dirname, '..', '..', 'public', 'index.html');

// GET / — serve the static page; generate it on first request if missing
router.get('/', (req, res) => {
  if (!fs.existsSync(staticPath)) {
    regenerateStaticPage();
  }
  res.sendFile(staticPath);
});

// GET /api/tiles — JSON endpoint for visible tiles
router.get('/api/tiles', (req, res) => {
  const tiles = tileQueries.getVisible.all().map((tile) => ({
    id: tile.id,
    title: tile.title,
    url: tile.url,
    color: tile.color,
    text_color: tile.text_color,
    icon: tile.icon,
    icon_svg: tile.icon ? getIconSvg(tile.icon) : null,
    size: tile.size,
    content_type: tile.content_type,
    cached_content: tile.cached_content,
  }));
  res.json(tiles);
});

module.exports = router;
