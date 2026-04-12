const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './data/site.db';
const resolvedPath = path.resolve(dbPath);

// Ensure data directory exists
const fs = require('fs');
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tiles (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    title         TEXT NOT NULL,
    url           TEXT NOT NULL,
    color         TEXT NOT NULL DEFAULT '#2563EB',
    text_color    TEXT NOT NULL DEFAULT '#FFFFFF',
    icon          TEXT,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    is_visible    INTEGER NOT NULL DEFAULT 1,
    content_type  TEXT DEFAULT 'link',
    content_config TEXT,
    cached_content TEXT,
    cache_expires  DATETIME,
    size          TEXT NOT NULL DEFAULT 'medium',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (settingsCount.count === 0) {
  const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const seedSettings = db.transaction((defaults) => {
    for (const [key, value] of defaults) {
      insert.run(key, value);
    }
  });
  seedSettings([
    ['site_title', 'Kofi Agyare'],
    ['site_tagline', ''],
    ['grid_gap', '16'],
    ['background_color', '#F9FAFB'],
    ['font_family', 'Inter, system-ui, sans-serif'],
  ]);
}

console.log(`Database initialized at ${resolvedPath}`);

// Prepared statements for tiles
const tileQueries = {
  getAll: db.prepare('SELECT * FROM tiles ORDER BY sort_order ASC, created_at ASC'),
  getVisible: db.prepare('SELECT * FROM tiles WHERE is_visible = 1 ORDER BY sort_order ASC, created_at ASC'),
  getById: db.prepare('SELECT * FROM tiles WHERE id = ?'),
  insert: db.prepare(`
    INSERT INTO tiles (id, title, url, color, text_color, icon, sort_order, is_visible, content_type, content_config, size)
    VALUES (lower(hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE tiles SET title = ?, url = ?, color = ?, text_color = ?, icon = ?, is_visible = ?,
    content_type = ?, content_config = ?, size = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM tiles WHERE id = ?'),
  updateOrder: db.prepare('UPDATE tiles SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  getMaxOrder: db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM tiles'),
  getStaleContent: db.prepare(`
    SELECT * FROM tiles
    WHERE content_type != 'link'
    AND (cache_expires IS NULL OR cache_expires < datetime('now'))
  `),
  updateCachedContent: db.prepare(`
    UPDATE tiles SET cached_content = ?, cache_expires = datetime('now', '+' || ? || ' minutes'), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
};

// Prepared statements for settings
const settingQueries = {
  getAll: db.prepare('SELECT * FROM settings ORDER BY key'),
  get: db.prepare('SELECT value FROM settings WHERE key = ?'),
  upsert: db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'),
};

// Reorder tiles in a transaction
const reorderTiles = db.transaction((orderedIds) => {
  for (let i = 0; i < orderedIds.length; i++) {
    tileQueries.updateOrder.run(i, orderedIds[i]);
  }
});

module.exports = { db, tileQueries, settingQueries, reorderTiles };
