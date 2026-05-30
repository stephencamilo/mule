// middleware/globals.js
export function globalViewData(req, res, next) {
  // Supported locales
  const supportedLocales = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    it: 'Italiano',
    pt: 'Português',
  };

  // Current locale (from query string or default)
  const locale = req.query.locale || req.acceptsLanguages('en') || 'en';

  // Build a query string that preserves all current params EXCEPT 'locale'
  const qs = { ...req.query };
  delete qs.locale;
  const queryString = new URLSearchParams(qs).toString();

  // Flag emojis per locale
  const flagEmoji = {
    en: '🇺🇸', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸',
    it: '🇮🇹', pt: '🇵🇹',
  };

  // Navigation links (customise to your entities)
  const links = [
    { name: 'Dashboard', url: '/admin' },
    { name: 'Content Types', url: '/admin/content_type' },
    { name: 'Field Configs', url: '/admin/field_configs' },
    { name: 'Content Data', url: '/admin/content_data' },
    {
      name: 'Field Values',
      children: [
        { name: 'Text', url: '/admin/field_value_text' },
        { name: 'Integer', url: '/admin/field_value_integer' },
        { name: 'Real', url: '/admin/field_value_real' },
        { name: 'Blob', url: '/admin/field_value_blob' },
      ],
    },
    { name: 'Content References', url: '/admin/content_reference' },
  ];

  // Attach everything to res.locals → automatically available in all views
  res.locals.locale = locale;
  res.locals.locales = supportedLocales;
  res.locals.currentLocale = locale;
  res.locals.flagEmoji = flagEmoji;
  res.locals.queryString = queryString;
  res.locals.links = links;

  // Optional flash message support (if you add connect-flash later)
  // res.locals.message = req.flash?.('success')?.[0] || '';
  // res.locals.error = req.flash?.('error')?.[0] || '';

  next();
}