'use client';

import en from '@/i18n/en.json';
import es from '@/i18n/es.json';
import fr from '@/i18n/fr.json';

export type Locale = 'en' | 'es' | 'fr';

const dictionaries = { en, es, fr };

/**
 * Institutional Translation Helper
 * Supports nested keys (e.g. "dashboard.metrics.net_irr")
 */
export function t(key: string, locale: Locale = 'en'): string {
  const parts = key.split('.');
  let result: any = dictionaries[locale];
  
  for (const part of parts) {
    if (result && result[part]) {
      result = result[part];
    } else {
      // Fallback to English if translation is missing
      return t(key, 'en');
    }
  }
  
  return typeof result === 'string' ? result : key;
}

/**
 * Localized Currency Formatter
 */
export function formatCurrency(val: number, locale: Locale = 'en', currency: string = 'USD'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Localized Percent Formatter
 */
export function formatPercent(val: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(val);
}

/**
 * Localized Number Formatter (TVPI/DPI)
 */
export function formatDecimal(val: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}
