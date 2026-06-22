/**
 * @file server/ledger/money.ts
 * @description Exact money arithmetic for the settlement ledger. Money is held as
 * a signed bigint of minor-of-minor units at a fixed internal scale of 4 (i.e.
 * ten-thousandths of a major unit), which lines up exactly with the database's
 * `Decimal(20, 4)` columns. All arithmetic is integer arithmetic — there is no
 * binary floating point anywhere in the value path, so postings are penny-exact
 * and the double-entry invariant can be checked with `===`.
 *
 * This module has ZERO dependencies (no Prisma, no decimal.js) so it can be
 * exhaustively unit-tested in isolation and reused on either side of the wire.
 */

/** Fixed internal scale: amounts are stored as value × 10^SCALE. */
export const MONEY_SCALE = 4;
const ZERO = BigInt(0);
const SCALE_FACTOR = BigInt(10) ** BigInt(MONEY_SCALE);

/**
 * ISO-4217 currencies the platform settles in, with their real-world minor-unit
 * exponent. Input precision is validated against this so a caller cannot smuggle
 * sub-cent dust into a USD posting. Extensible: add a row to onboard a currency.
 */
export const CURRENCY_EXPONENTS: Readonly<Record<string, number>> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  AED: 2,
  AUD: 2,
  CAD: 2,
  SGD: 2,
  CHF: 2,
  JPY: 0,
};

export function isSupportedCurrency(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(CURRENCY_EXPONENTS, code);
}

/** Normalise/validate a currency code, throwing on anything unsupported. */
export function assertCurrency(code: string): string {
  const upper = code.toUpperCase();
  if (!isSupportedCurrency(upper)) {
    throw new MoneyError(`UNSUPPORTED_CURRENCY: ${code}`);
  }
  return upper;
}

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

const AMOUNT_RE = /^-?\d{1,16}(\.\d{1,8})?$/;

/**
 * An immutable money value. Always paired with its currency so cross-currency
 * mistakes fail loudly rather than silently producing a wrong number.
 */
export class Money {
  /** Signed amount in scale-4 minor units (e.g. $100.50 → 1_005_000n). */
  readonly units: bigint;
  readonly currency: string;

  private constructor(units: bigint, currency: string) {
    this.units = units;
    this.currency = currency;
  }

  /** Construct from a decimal string ("100.50") or integer, validating precision. */
  static of(amount: string | number | bigint, currency: string): Money {
    const cur = assertCurrency(currency);
    const text = typeof amount === 'bigint' ? amount.toString() : String(amount).trim();
    if (!AMOUNT_RE.test(text)) {
      throw new MoneyError(`INVALID_AMOUNT: ${String(amount)}`);
    }
    const negative = text.startsWith('-');
    const unsigned = negative ? text.slice(1) : text;
    const [whole, frac = ''] = unsigned.split('.');

    const allowedExponent = CURRENCY_EXPONENTS[cur];
    if (frac.replace(/0+$/, '').length > allowedExponent) {
      throw new MoneyError(`PRECISION_EXCEEDED: ${cur} allows ${allowedExponent} decimal place(s)`);
    }
    if (frac.length > MONEY_SCALE) {
      throw new MoneyError(`PRECISION_EXCEEDED: max ${MONEY_SCALE} internal decimal places`);
    }

    const fracPadded = (frac + '0'.repeat(MONEY_SCALE)).slice(0, MONEY_SCALE);
    const units = BigInt(whole) * SCALE_FACTOR + BigInt(fracPadded);
    return new Money(negative ? -units : units, cur);
  }

  /** Zero in the given currency. */
  static zero(currency: string): Money {
    return new Money(ZERO, assertCurrency(currency));
  }

  /** Reconstruct directly from already-scaled units (DB round-trip, trusted). */
  static fromUnits(units: bigint, currency: string): Money {
    return new Money(units, assertCurrency(currency));
  }

  private sameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new MoneyError(`CURRENCY_MISMATCH: ${this.currency} vs ${other.currency}`);
    }
  }

  add(other: Money): Money {
    this.sameCurrency(other);
    return new Money(this.units + other.units, this.currency);
  }

  subtract(other: Money): Money {
    this.sameCurrency(other);
    return new Money(this.units - other.units, this.currency);
  }

  negate(): Money {
    return new Money(-this.units, this.currency);
  }

  abs(): Money {
    return new Money(this.units < ZERO ? -this.units : this.units, this.currency);
  }

  isZero(): boolean {
    return this.units === ZERO;
  }

  isPositive(): boolean {
    return this.units > ZERO;
  }

  isNegative(): boolean {
    return this.units < ZERO;
  }

  /** -1, 0 or 1. Throws on currency mismatch. */
  compare(other: Money): -1 | 0 | 1 {
    this.sameCurrency(other);
    if (this.units < other.units) return -1;
    if (this.units > other.units) return 1;
    return 0;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.units === other.units;
  }

  gt(other: Money): boolean {
    return this.compare(other) === 1;
  }

  gte(other: Money): boolean {
    return this.compare(other) >= 0;
  }

  lt(other: Money): boolean {
    return this.compare(other) === -1;
  }

  lte(other: Money): boolean {
    return this.compare(other) <= 0;
  }

  /** Canonical fixed-scale decimal string ("100.5000") for Decimal(20,4) columns. */
  toDecimalString(): string {
    const negative = this.units < ZERO;
    const abs = negative ? -this.units : this.units;
    const whole = abs / SCALE_FACTOR;
    const frac = (abs % SCALE_FACTOR).toString().padStart(MONEY_SCALE, '0');
    return `${negative ? '-' : ''}${whole.toString()}.${frac}`;
  }

  toString(): string {
    return `${this.toDecimalString()} ${this.currency}`;
  }
}
