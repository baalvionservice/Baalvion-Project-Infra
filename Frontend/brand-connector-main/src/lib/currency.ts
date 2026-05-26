/**
 * @fileOverview Baalvion Multi-Currency Utility Library
 * 
 * Provides exchange rate logic, conversion helpers, and localized formatting
 * for the global marketplace.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'DH', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
];

// Mock Exchange Rates (Base: 1 INR)
// These would typically be updated via an external API like fixer.io or openexchangerates
export const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  SGD: 0.016,
};

/**
 * Formats a numeric value into a localized currency string.
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Converts an amount from one currency to another using mock rates.
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  
  // Convert from source to INR (base)
  const amountInINR = amount / EXCHANGE_RATES[from];
  
  // Convert from INR to target
  return amountInINR * EXCHANGE_RATES[to];
}

/**
 * Helper to specifically convert platform base (INR) to any target
 */
export function fromBase(amountInINR: number, targetCurrency: string): number {
  return amountInINR * (EXCHANGE_RATES[targetCurrency] || 1);
}
