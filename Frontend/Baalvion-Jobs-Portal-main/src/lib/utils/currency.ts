
import { MOCK_CONVERSION_RATES, CURRENCY_SYMBOLS } from '@/config/currencies';

/**
 * Converts an amount from a source currency to a target currency using mock rates.
 * @param amount - The amount of money in the source currency.
 * @param fromCurrency - The currency code of the source amount (e.g., 'USD').
 * @param toCurrency - The currency code of the target currency (e.g., 'INR').
 * @returns The converted amount in the target currency.
 */
function convert(amount: number, fromCurrency: string, toCurrency: string): number {
  const fromRate = MOCK_CONVERSION_RATES[fromCurrency];
  const toRate = MOCK_CONVERSION_RATES[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`Missing conversion rate for ${fromCurrency} or ${toCurrency}`);
    return amount;
  }

  // Convert the source amount to the base currency (USD) first, then to the target currency.
  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
}

/**
 * Converts a given amount from USD to a local currency.
 * @param amountUSD - The amount in USD.
 * @param targetCurrency - The target local currency code.
 * @returns The amount in the target local currency.
 */
export function convertToLocal(amountUSD: number, targetCurrency: string): number {
  return convert(amountUSD, 'USD', targetCurrency);
}

/**
 * Converts an amount from a local currency back to USD.
 * @param amountLocal - The amount in the local currency.
 * @param sourceCurrency - The source local currency code.
 * @returns The amount in USD.
 */
export function convertToUSD(amountLocal: number, sourceCurrency: string): number {
  return convert(amountLocal, sourceCurrency, 'USD');
}

/**
 * Formats an amount with its appropriate currency symbol and formatting.
 * @param amount - The numerical amount.
 * @param currency - The currency code.
 * @param locale - Optional locale for formatting conventions (e.g., 'en-US', 'de-DE').
 * @returns A formatted currency string (e.g., "$180,000", "₹28,00,000").
 */
// Salaries are quoted in whole units and grouped the way the currency's own market
// writes them: ₹28,00,000 in India, $180,000 in the US. Formatting an annual salary as
// "₹2,800,000.00" is both wrong for the reader and two characters of noise per figure.
const LOCALE_FOR_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  GBP: 'en-GB',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  PLN: 'pl-PL',
  AUD: 'en-AU',
  CAD: 'en-CA',
  VND: 'vi-VN',
  PHP: 'en-PH',
  UAH: 'uk-UA',
  NGN: 'en-NG',
};

export function formatCurrency(amount: number, currency: string, locale?: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const resolved = locale ?? LOCALE_FOR_CURRENCY[currency] ?? 'en-US';

  try {
    return new Intl.NumberFormat(resolved, {
      style: 'currency',
      currency,
      // Whole units: nobody negotiates a salary to the paisa.
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for unsupported currency codes in Intl
    return `${symbol}${Math.round(amount).toLocaleString(resolved)}`;
  }
}
