/**
 * Middleware that requires a valid admin session.
 * Redirects to /admin/login if not authenticated.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

module.exports = requireAuth;
