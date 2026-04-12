const session = require('express-session');
const BetterSqlite3Store = require('better-sqlite3-session-store')(session);
const bcrypt = require('bcrypt');
const { db } = require('./db');

// Rate limiting for login attempts: track failed attempts in memory
const loginAttempts = new Map(); // key: IP, value: { count, firstAttempt }

const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const COOLDOWN = 60 * 1000; // 60 seconds

function isRateLimited(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return false;

  const elapsed = Date.now() - record.firstAttempt;

  // If the window has expired, reset
  if (elapsed > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip);
    return false;
  }

  // If they've hit the limit and cooldown hasn't passed since last attempt
  if (record.count >= MAX_ATTEMPTS) {
    const sinceLast = Date.now() - record.lastAttempt;
    if (sinceLast < COOLDOWN) return true;
    // Cooldown passed — allow another attempt but keep tracking
    record.count = MAX_ATTEMPTS - 1;
    return false;
  }

  return false;
}

function recordFailedAttempt(ip) {
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: Date.now(), lastAttempt: Date.now() });
  } else {
    record.count++;
    record.lastAttempt = Date.now();
  }
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Verify login credentials against environment variables.
 */
function verifyCredentials(username, password) {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set in .env');
    return false;
  }

  if (username !== adminUser) return false;
  return bcrypt.compareSync(password, adminHash);
}

/**
 * Create session middleware configured with SQLite store.
 */
function createSessionMiddleware() {
  return session({
    store: new BetterSqlite3Store({
      client: db,
      expired: { clear: true, intervalMs: 15 * 60 * 1000 },
    }),
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
}

module.exports = {
  createSessionMiddleware,
  verifyCredentials,
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
};
