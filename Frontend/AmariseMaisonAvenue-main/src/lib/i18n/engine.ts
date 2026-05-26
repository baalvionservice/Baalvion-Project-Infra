/**
 * @fileOverview Institutional Localization Engine
 * Provides architectural foundations for multi-market narrative delivery.
 */

import { I18N_CONFIG, SupportedLanguage } from './config';
import { CountryCode } from '../types';

export class LocalizationEngine {
  private static instance: LocalizationEngine;
  private currentLang: SupportedLanguage = 'en';

  private constructor() {}

  public static getInstance(): LocalizationEngine {
    if (!LocalizationEngine.instance) {
      LocalizationEngine.instance = new LocalizationEngine();
    }
    return LocalizationEngine.instance;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang;
    // Persist to local storage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('maison_lang', lang);
      document.documentElement.dir = this.getDirection();
      document.documentElement.lang = lang;
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  public getDirection(): 'ltr' | 'rtl' {
    return this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Translates a key with architectural fallback logic.
   */
  public t(key: string): string {
    const dict = I18N_CONFIG.translations[this.currentLang];
    const fallback = I18N_CONFIG.translations[I18N_CONFIG.fallbackLanguage];
    
    return dict[key] || fallback[key] || key;
  }

  /**
   * Localized Currency Formatter
   */
  public formatCurrency(amount: number, countryCode: CountryCode): string {
    const hubLocales: Record<CountryCode, string> = {
      us: 'en-US',
      uk: 'en-GB',
      ae: 'ar-AE',
      in: 'en-IN',
      sg: 'en-SG'
    };

    const hubCurrencies: Record<CountryCode, string> = {
      us: 'USD',
      uk: 'GBP',
      ae: 'AED',
      in: 'INR',
      sg: 'SGD'
    };

    return new Intl.NumberFormat(hubLocales[countryCode], {
      style: 'currency',
      currency: hubCurrencies[countryCode],
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Localized Date Formatter
   */
  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(this.currentLang === 'ar' ? 'ar-AE' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}

export const i18n = LocalizationEngine.getInstance();
