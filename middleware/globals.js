export function globalViewData(req, res, next) {
  const supportedLocales = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    it: 'Italiano',
    pt: 'Português',
  };

  const locale = req.query.locale || req.acceptsLanguages('en') || 'en';
  const qs = { ...req.query };
  delete qs.locale;
  const queryString = new URLSearchParams(qs).toString();

  const flagEmoji = {
    en: '🇺🇸', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸',
    it: '🇮🇹', pt: '🇵🇹',
  };

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

  res.locals.locale = locale;
  res.locals.locales = supportedLocales;
  res.locals.currentLocale = locale;
  res.locals.flagEmoji = flagEmoji;
  res.locals.queryString = queryString;
  res.locals.links = links;

  next();
}
