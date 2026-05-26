/**
 * @fileOverview Client-side i18n configuration for the Imperialpedia platform.
 */

export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr', 'de', 'zh'],
  defaultNS: 'common',
};

export function getOptions(lng = i18nConfig.defaultLocale, ns = i18nConfig.defaultNS) {
  return {
    supportedLngs: i18nConfig.locales,
    fallbackLng: i18nConfig.defaultLocale,
    lng,
    fallbackNS: i18nConfig.defaultNS,
    defaultNS: ns,
    ns,
  };
}
