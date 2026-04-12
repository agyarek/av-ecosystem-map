require('dotenv').config();

const express = require('express');
const path = require('path');
const { createSessionMiddleware } = require('./auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for correct IP behind reverse proxy (used by rate limiter)
app.set('trust proxy', 1);

// View engine (used only for login page rendered directly)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Sessions
app.use(createSessionMiddleware());

// Static files (serves generated index.html and any future assets)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
