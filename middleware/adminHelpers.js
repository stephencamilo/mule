// middleware/adminHelpers.js
export function adminMiddleware(req, res, next) {
  // Locale – from query, header, or default
  req.getLocale = () => req.query.lang || req.headers['accept-language']?.split(',')[0] || 'en';

  // Auth check (placeholder)
  req.checkAuth = () => true; // Replace with real authentication

  // Flash / redirect with input – requires session and connect-flash
  req.redirectBack = () => {
    // Save form data to flash (requires express-session + connect-flash)
    // req.flash('old', req.body);
    res.redirect('back');
  };

  // Expose to views
  res.locals.locale = req.getLocale();
  next();
}