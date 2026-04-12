const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { tileQueries, settingQueries } = require('./db');
const { getIconSvg } = require('./icons');

const templatePath = path.join(__dirname, 'views', 'public', 'page.ejs');
const outputPath = path.join(__dirname, '..', 'public', 'index.html');

/**
 * Read all settings into a plain object.
 */
function getSettings() {
  const rows = settingQueries.getAll.all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

/**
 * Regenerate the static public index.html from the database.
 * Called after any tile or setting change in the admin.
 */
function regenerateStaticPage() {
  const settings = getSettings();
  const tiles = tileQueries.getVisible.all().map((tile) => ({
    ...tile,
    icon_svg: tile.icon ? getIconSvg(tile.icon) : '',
  }));

  const template = fs.readFileSync(templatePath, 'utf-8');
  const html = ejs.render(template, { settings, tiles });

  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log('Static page regenerated.');
}

module.exports = { regenerateStaticPage, getSettings };
