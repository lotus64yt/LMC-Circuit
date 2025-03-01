/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
    debug: process.env.NODE_ENV === 'development',
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'fr'],
    },
    localePath:
      typeof window === 'undefined'
        ? require('path').resolve('./public/locales')
        : '/locales',
  
    reloadOnPrerender: process.env.NODE_ENV === 'development',
    // saveMissing: false,
    // strictMode: true,
    // serializeConfig: false,
    // react: { useSuspense: false }
  }