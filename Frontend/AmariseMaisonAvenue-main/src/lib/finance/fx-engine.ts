/**
 * @fileOverview Institutional FX & Currency Engine
 * Orchestrates multi-market pricing conversion, rounding, and display formatting.
 * Designed for high-fidelity luxury commerce ($100M+ Scale).
 */

import { FXRate, CountryCode } from '../types';

export class FXEngine {
  /**
   * Localizes a numeric value to its jurisdictional currency format.
   */
  static formatLocalizedCurrency(amount: number, countryCode: CountryCode, rates: FXRate[]): string {
    const rateObj = rates.find(r => r.currencyCode === this.getCurrencyForCountry(countryCode));
    const rate = rateObj ? rateObj.rate * (1 + rateObj.spread) : 1;
    
    const converted = amount * rate;
    const rounded = this.applyRoundingRules(converted, countryCode);

    return new Intl.NumberFormat(this.getLocaleForCountry(countryCode), {
      style: 'currency',
      currency: this.getCurrencyForCountry(countryCode),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rounded);
  }

  /**
   * Converts a base USD price to a jurisdictional hub price.
   */
  static convertToBase(amount: number, fromCountry: CountryCode, rates: FXRate[]): number {
    const rateObj = rates.find(r => r.currencyCode === this.getCurrencyForCountry(fromCountry));
    if (!rateObj) return amount;
    return amount / (rateObj.rate * (1 + rateObj.spread));
  }

  /**
   * Maison Rounding Protocol
   * Ensures psychological pricing thresholds are maintained per hub.
   */
  private static applyRoundingRules(amount: number, countryCode: CountryCode): number {
    switch (countryCode) {
      case 'in':
        // Round to nearest 100 for Indian market prestige
        return Math.round(amount / 100) * 100;
      case 'ae':
        // Round to nearest 10 for UAE market aesthetics
        return Math.round(amount / 10) * 10;
      default:
        // Precise rounding for US/UK/SG markets
        return Math.round(amount);
    }
  }

  private static getCurrencyForCountry(code: CountryCode): string {
    const map: Record<CountryCode, string> = {
      us: 'USD',
      uk: 'GBP',
      ae: 'AED',
      in: 'INR',
      sg: 'SGD'
    };
    return map[code] || 'USD';
  }

  private static getLocaleForCountry(code: CountryCode): string {
    const map: Record<CountryCode, string> = {
      us: 'en-US',
      uk: 'en-GB',
      ae: 'ar-AE',
      in: 'en-IN',
      sg: 'en-SG'
    };
    return map[code] || 'en-US';
  }
}
