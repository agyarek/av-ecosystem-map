# kofiagyare.com

A personal website that displays a single-page grid of large, colored tiles. Each tile represents a content category (LinkedIn, writing/blog, resume, side projects, etc.) and links to a destination. Content is managed through a built-in admin interface — no code editing required.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

### 3. Generate your admin password

```bash
node scripts/set-password.js yourSecurePassword
```

Copy the output `ADMIN_PASSWORD_HASH=...` into your `.env` file.

### 4. Generate a session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `SESSION_SECRET=` in your `.env` file.

### 5. Start the server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The site will be available at `http://localhost:3000` and the admin panel at `http://localhost:3000/admin`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | `production` or `development` | No |
| `ADMIN_USERNAME` | Admin login username | Yes |
| `ADMIN_PASSWORD_HASH` | bcrypt hash from `set-password.js` | Yes |
| `SESSION_SECRET` | Random string for session encryption | Yes |
| `DATABASE_PATH` | Path to SQLite database (default: `./data/site.db`) | No |

## Architecture

- **Runtime:** Node.js + Express
- **Database:** SQLite via `better-sqlite3` — zero infrastructure, single file
- **Admin UI:** Server-rendered HTML with EJS templates
- **Public site:** Pre-rendered static HTML, regenerated on every content change
- **Icons:** Bundled inline SVGs — no external CDN dependencies

### How it works

1. You manage tiles (title, URL, color, icon, size) through the admin panel at `/admin`
2. Every time you create, edit, delete, or reorder a tile, the system regenerates a static `public/index.html`
3. The public page is served as a static file — zero database queries at page load
4. An optional `/api/tiles` JSON endpoint is available for client-side rendering

## Project Structure

```
kofiagyare.com/
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
├── README.md
├── scripts/
│   └── set-password.js       # CLI to generate bcrypt password hash
├── src/
│   ├── server.js             # Express entry point
│   ├── db.js                 # SQLite connection + schema migration
│   ├── auth.js               # Session config, login verification, rate limiting
│   ├── static-generator.js   # Reads DB, renders page.ejs → public/index.html
│   ├── icons.js              # Bundled SVG icon set (20 icons)
│   ├── routes/
│   │   ├── public.js         # GET / and GET /api/tiles
│   │   └── admin.js          # All /admin/* routes
│   ├── views/
│   │   ├── layouts/admin.ejs # Admin layout (nav, flash messages)
│   │   ├── admin/            # Dashboard, login, tile form, settings
│   │   └── public/page.ejs   # Template for static page generation
│   ├── fetchers/             # V2 content fetcher architecture (stubs)
│   │   ├── base.js
│   │   └── index.js
│   └── middleware/
│       └── require-auth.js
├── public/                   # Served statically (index.html is generated)
└── data/                     # SQLite database (created on first run)
```

## Deployment

### VPS (DigitalOcean, Linode, etc.)

1. Clone the repo and run `npm install --production`
2. Set up `.env` with production values
3. Run `npm start` behind a reverse proxy (nginx or Caddy) with HTTPS
4. Use `NODE_ENV=production` for secure cookies

### Platform (Railway, Render, etc.)

1. Connect the GitHub repo
2. Set environment variables in the platform dashboard
3. Set start command to `npm start`
4. The `PORT` env var is usually set automatically by the platform

## Backups

The entire site state lives in `data/site.db`. Back up this single file to preserve all tiles and settings. The generated `public/index.html` is not committed — it's regenerated from the database on each content change.

## V2 Content System

The architecture supports progressive enhancement. Each tile has `content_type` and `content_config` fields ready for rich content (LinkedIn embeds, GitHub activity, RSS feeds, etc.). The `src/fetchers/` directory contains the base class and registry. To add a new content type:

1. Create a fetcher in `src/fetchers/` that extends `BaseFetcher`
2. Register it in `src/fetchers/index.js`
3. The background refresh job (`refreshContent`) handles caching automatically
