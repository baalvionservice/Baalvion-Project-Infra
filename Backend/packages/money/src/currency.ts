/**
 * ISO 4217 minor-unit exponents.
 *
 * This table is a fail-closed allowlist, not a lookup with a fallback. Defaulting an unknown
 * code to two decimals is how a JPY charge becomes a 100x overcharge and a KWD charge becomes
 * a 1000x undercharge — so an unrecognised code throws instead. Adding a currency is a
 * deliberate one-line change reviewed like any other money change.
 */
import { MoneyError } from './errors';

export type CurrencyCode = string & { readonly __brand?: 'CurrencyCode' };

/** code -> number of digits after the decimal point. */
const EXPONENTS: Readonly<Record<string, number>> = Object.freeze({
  // --- no minor unit (a "cent" does not exist; sending amount*100 overcharges 100x) ---
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,

  // --- three decimals (1000 minor units, not 100) ---
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,

  // --- two decimals ---
  AED: 2, ARS: 2, AUD: 2, BDT: 2, BGN: 2, BRL: 2, CAD: 2, CHF: 2, CNY: 2,
  COP: 2, CZK: 2, DKK: 2, EGP: 2, EUR: 2, GBP: 2, GHS: 2, HKD: 2, HRK: 2,
  HUF: 2, IDR: 2, ILS: 2, INR: 2, KES: 2, LKR: 2, MAD: 2, MUR: 2, MXN: 2,
  MYR: 2, NGN: 2, NOK: 2, NPR: 2, NZD: 2, PEN: 2, PHP: 2, PKR: 2, PLN: 2,
  QAR: 2, RON: 2, RSD: 2, RUB: 2, SAR: 2, SEK: 2, SGD: 2, THB: 2, TRY: 2,
  TWD: 2, TZS: 2, UAH: 2, USD: 2, UYU: 2, VES: 2, ZAR: 2,
});

/** 10^exponent, precomputed as BigInt — the scale factor between major and minor units. */
const SCALES: Readonly<Record<number, bigint>> = Object.freeze({
  0: 1n,
  2: 100n,
  3: 1000n,
});

export function isSupportedCurrency(code: string): boolean {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(EXPONENTS, code.toUpperCase());
}

/** Normalise and validate a currency code. Throws on anything not in the table. */
export function assertCurrency(code: string): CurrencyCode {
  if (typeof code !== 'string' || code.length !== 3) {
    throw new MoneyError('UNKNOWN_CURRENCY', `Currency must be a 3-letter ISO 4217 code, got ${JSON.stringify(code)}`, { code });
  }
  const upper = code.toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(EXPONENTS, upper)) {
    throw new MoneyError(
      'UNKNOWN_CURRENCY',
      `Unsupported currency "${upper}". Add it to the ISO 4217 table in @baalvion/money with its correct exponent — never assume 2.`,
      { code: upper },
    );
  }
  return upper as CurrencyCode;
}

/** Digits after the decimal point for this currency. */
export function exponentOf(code: string): number {
  const upper = assertCurrency(code);
  return EXPONENTS[upper as string]!;
}

/** Minor units per major unit: 100 for INR/USD, 1 for JPY, 1000 for KWD. */
export function scaleOf(code: string): bigint {
  const scale = SCALES[exponentOf(code)];
  if (scale === undefined) {
    throw new MoneyError('UNKNOWN_CURRENCY', `No scale defined for exponent of ${code}`, { code });
  }
  return scale;
}

/** Every currency this build understands — useful for config validation at boot. */
export function supportedCurrencies(): readonly string[] {
  return Object.freeze(Object.keys(EXPONENTS).sort());
}
