/**
 * @file server/treasury/money-math.ts
 * @description Exact rate and basis-point arithmetic for the treasury / FX / fee
 * engines, built on the integer `Money` value (see ledger/money.ts). Everything
 * is BigInt integer math with explicit half-up rounding to the destination
 * currency's precision — there is no binary floating point in the money path.
 *
 * Rates are held at scale 8 (eight decimal places), matching the database's
 * `Decimal(20, 8)` FX-rate columns. Money is held at scale 4.
 */
import { Money, MONEY_SCALE, CURRENCY_EXPONENTS, MoneyError, assertCurrency } from '../ledger/money';

export const RATE_SCALE = 8;
const RATE_FACTOR = BigInt(10) ** BigInt(RATE_SCALE);
const TWO = BigInt(2);
const BPS_DENOM = BigInt(10_000);
const RATE_RE = /^\d{1,12}(\.\d{1,8})?$/;

/** Round n/d to the nearest integer, halves up. Defined for non-negative n, positive d. */
export function roundDivHalfUp(n: bigint, d: bigint): bigint {
  if (n < BigInt(0)) throw new MoneyError('roundDivHalfUp: negative numerator unsupported');
  return (n * TWO + d) / (d * TWO);
}

/** Parse a non-negative decimal rate string into scale-8 integer units. */
export function parseRate(rate: string): bigint {
  const text = rate.trim();
  if (!RATE_RE.test(text)) throw new MoneyError(`INVALID_RATE: ${rate}`);
  const [whole, frac = ''] = text.split('.');
  const fracPadded = (frac + '0'.repeat(RATE_SCALE)).slice(0, RATE_SCALE);
  return BigInt(whole) * RATE_FACTOR + BigInt(fracPadded);
}

/** Format scale-8 rate units back to a canonical decimal string ("1.23456789"). */
export function formatRate(units: bigint): string {
  const whole = units / RATE_FACTOR;
  const frac = (units % RATE_FACTOR).toString().padStart(RATE_SCALE, '0');
  return `${whole.toString()}.${frac}`;
}

/** Round scale-4 money units down to a currency's real precision (e.g. JPY → 0dp). */
export function roundUnitsToCurrency(units4: bigint, currency: string): bigint {
  const exponent = CURRENCY_EXPONENTS[assertCurrency(currency)];
  if (exponent >= MONEY_SCALE) return units4;
  const factor = BigInt(10) ** BigInt(MONEY_SCALE - exponent);
  return roundDivHalfUp(units4, factor) * factor;
}

/**
 * Convert a base amount to another currency at a given rate (quote units per
 * base unit). The result is rounded to the quote currency's precision; the
 * rounding remainder is the platform's (it surfaces in the FX clearing P&L).
 */
export function applyRate(base: Money, rate: string, toCurrency: string): Money {
  if (base.isNegative()) throw new MoneyError('applyRate: base amount must be non-negative');
  const rateUnits = parseRate(rate);
  const productScale4 = roundDivHalfUp(base.units * rateUnits, RATE_FACTOR);
  return Money.fromUnits(roundUnitsToCurrency(productScale4, toCurrency), assertCurrency(toCurrency));
}

/** Apply a basis-point rate to an amount (e.g. 25 bps of $1,000), rounded to currency. */
export function bpsOf(base: Money, basisPoints: number): Money {
  if (!Number.isInteger(basisPoints) || basisPoints < 0) {
    throw new MoneyError(`INVALID_BPS: ${basisPoints}`);
  }
  if (base.isNegative()) throw new MoneyError('bpsOf: base amount must be non-negative');
  const feeScale4 = roundDivHalfUp(base.units * BigInt(basisPoints), BPS_DENOM);
  return Money.fromUnits(roundUnitsToCurrency(feeScale4, base.currency), base.currency);
}
