/**
 * Money — an exact amount in a single currency, held as an integer count of minor units.
 *
 * The whole point of this type is that a monetary value never becomes an IEEE-754 double.
 * `Number(order.totalAmount)` is how a DECIMAL(14,2) column read back as a string by the pg
 * driver turns into a float, and floats are why reconciliation grows epsilon tolerances like
 * `Math.abs(a - b) > 0.01`. With integers those comparisons are exact and the tolerances go away.
 *
 * Invariants:
 *   - immutable; every operation returns a new Money
 *   - arithmetic across two currencies throws (no implicit FX, ever)
 *   - any operation that could lose a fraction of a minor unit demands an explicit RoundingMode
 */
import { MoneyError, CurrencyMismatchError } from './errors';
import { assertCurrency, exponentOf, type CurrencyCode } from './currency';
import { divideRound, type RoundingMode } from './rounding';

/** Wire form. The amount stays a string so JSON round-trips cannot silently truncate it. */
export interface MoneyJSON {
  amount: string;
  currency: string;
  exponent: number;
}

export interface DecimalParseOptions {
  /**
   * What to do when the input carries more fraction digits than the currency has
   * (e.g. "10.005" in INR). Default 'throw' — silently dropping a digit is how
   * per-unit prices and FX rates leak value at scale.
   */
  onExtraPrecision?: 'throw' | RoundingMode;
}

const DECIMAL_RE = /^([+-]?)(\d*)(?:\.(\d*))?$/;

function parseDecimalToMinor(input: string, exponent: number, options: DecimalParseOptions = {}): bigint {
  const raw = typeof input === 'string' ? input.trim() : String(input);
  if (raw === '') throw new MoneyError('INVALID_AMOUNT', 'Empty amount');

  const match = DECIMAL_RE.exec(raw);
  if (!match) {
    throw new MoneyError('INVALID_AMOUNT', `Not a plain decimal amount: ${JSON.stringify(input)}. Scientific notation, grouping separators and currency symbols are rejected.`, { input });
  }
  const [, sign, intPart = '', fracPart = ''] = match;
  if (intPart === '' && fracPart === '') {
    throw new MoneyError('INVALID_AMOUNT', `Amount has no digits: ${JSON.stringify(input)}`, { input });
  }

  const negative = sign === '-';
  const digits = `${intPart || '0'}${fracPart}`;
  const fracLen = fracPart.length;

  let minor: bigint;
  if (fracLen === exponent) {
    minor = BigInt(digits);
  } else if (fracLen < exponent) {
    minor = BigInt(digits) * 10n ** BigInt(exponent - fracLen);
  } else {
    const mode = options.onExtraPrecision ?? 'throw';
    if (mode === 'throw') {
      throw new MoneyError(
        'PRECISION_LOSS',
        `"${raw}" has ${fracLen} fraction digits but this currency has ${exponent}. Pass onExtraPrecision with an explicit RoundingMode if the loss is intended.`,
        { input: raw, fracLen, exponent },
      );
    }
    minor = divideRound(BigInt(digits), 10n ** BigInt(fracLen - exponent), mode);
  }
  return negative ? -minor : minor;
}

export class Money {
  /** Integer count of minor units: paise for INR, cents for USD, whole yen for JPY. */
  public readonly minor: bigint;
  public readonly currency: CurrencyCode;
  public readonly exponent: number;

  private constructor(minor: bigint, currency: CurrencyCode, exponent: number) {
    this.minor = minor;
    this.currency = currency;
    this.exponent = exponent;
    Object.freeze(this);
  }

  // ---------------------------------------------------------------- construction

  /**
   * Build from an integer count of minor units — the canonical constructor.
   * A JS number is accepted only when it is a safe integer; a float throws rather than
   * being rounded behind your back.
   */
  static of(minorUnits: bigint | number | string, currency: string): Money {
    const code = assertCurrency(currency);
    let minor: bigint;

    if (typeof minorUnits === 'bigint') {
      minor = minorUnits;
    } else if (typeof minorUnits === 'number') {
      if (!Number.isFinite(minorUnits)) {
        throw new MoneyError('INVALID_AMOUNT', `Amount is not finite: ${minorUnits}`, { minorUnits });
      }
      if (!Number.isInteger(minorUnits)) {
        throw new MoneyError('FLOAT_REJECTED', `Money.of expects minor units as an integer, got ${minorUnits}. Use Money.fromDecimal("${minorUnits}", "${code}") if this is a major-unit amount.`, { minorUnits });
      }
      if (!Number.isSafeInteger(minorUnits)) {
        throw new MoneyError('UNSAFE_NUMBER', `${minorUnits} exceeds Number.MAX_SAFE_INTEGER — pass a BigInt or a string`, { minorUnits });
      }
      minor = BigInt(minorUnits);
    } else if (typeof minorUnits === 'string') {
      const raw = minorUnits.trim();
      if (!/^[+-]?\d+$/.test(raw)) {
        throw new MoneyError('INVALID_AMOUNT', `Minor units must be an integer string, got ${JSON.stringify(minorUnits)}`, { minorUnits });
      }
      minor = BigInt(raw);
    } else {
      throw new MoneyError('INVALID_AMOUNT', `Unsupported amount type: ${typeof minorUnits}`, {});
    }

    return new Money(minor, code, exponentOf(code));
  }

  /**
   * Build from a major-unit decimal *string* — "10000.55", or exactly what the pg driver
   * hands back for a DECIMAL(14,2) column. Never pass a float here.
   */
  static fromDecimal(amount: string, currency: string, options: DecimalParseOptions = {}): Money {
    const code = assertCurrency(currency);
    if (typeof amount === 'number') {
      throw new MoneyError('FLOAT_REJECTED', `fromDecimal takes a string, not a number (${amount}). A double cannot represent most decimal amounts exactly — read the column as a string, or use fromLegacyFloat if you are migrating a call site.`, { amount });
    }
    const exponent = exponentOf(code);
    return new Money(parseDecimalToMinor(amount, exponent, options), code, exponent);
  }

  /**
   * Migration shim for call sites still holding a float — deliberately named so it is easy
   * to grep for and delete. Rounds the double's decimal expansion at the currency's exponent,
   * which recovers the intended value for amounts that originated as decimals
   * (8250.449999999999 -> 8250.45) but cannot undo error already accumulated across a sum.
   * Fix the source; do not build on this.
   */
  static fromLegacyFloat(amount: number, currency: string, mode: RoundingMode = 'HALF_UP'): Money {
    const code = assertCurrency(currency);
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new MoneyError('INVALID_AMOUNT', `fromLegacyFloat needs a finite number, got ${amount}`, { amount });
    }
    const exponent = exponentOf(code);
    if (Math.abs(amount) >= 1e21) {
      throw new MoneyError('UNSAFE_NUMBER', `${amount} is too large to convert without exponential notation`, { amount });
    }
    // toFixed rounds the exact binary value at the requested scale; parse the result exactly.
    return new Money(parseDecimalToMinor(amount.toFixed(exponent), exponent, { onExtraPrecision: mode }), code, exponent);
  }

  /**
   * Read a value straight out of a DECIMAL column.
   *
   * The pg driver hands back `numeric`/`DECIMAL` as a string precisely so no precision is
   * lost, and that string path is exact. A number arriving here means something upstream
   * already coerced it (a JSON body, an ORM getter, a legacy call site), so it is routed
   * through the lossy float path and rounded at the currency's exponent.
   */
  static fromDatabaseValue(value: string | number | bigint | null | undefined, currency: string, mode: RoundingMode = 'HALF_UP'): Money {
    if (value === null || value === undefined) return Money.zero(currency);
    if (typeof value === 'bigint') return Money.of(value, currency);
    if (typeof value === 'number') return Money.fromLegacyFloat(value, currency, mode);
    return Money.fromDecimal(value, currency, { onExtraPrecision: mode });
  }

  static zero(currency: string): Money {
    const code = assertCurrency(currency);
    return new Money(0n, code, exponentOf(code));
  }

  static fromJSON(json: MoneyJSON): Money {
    if (!json || typeof json !== 'object') {
      throw new MoneyError('INVALID_AMOUNT', 'fromJSON expects a MoneyJSON object', {});
    }
    const money = Money.of(json.amount, json.currency);
    if (typeof json.exponent === 'number' && json.exponent !== money.exponent) {
      throw new MoneyError(
        'INVALID_AMOUNT',
        `Exponent mismatch for ${json.currency}: payload says ${json.exponent}, this build says ${money.exponent}. Refusing to guess which is right.`,
        { json },
      );
    }
    return money;
  }

  // ---------------------------------------------------------------- arithmetic

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) throw new CurrencyMismatchError(this.currency, other.currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor + other.minor, this.currency, this.exponent);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor - other.minor, this.currency, this.exponent);
  }

  negate(): Money {
    return new Money(-this.minor, this.currency, this.exponent);
  }

  abs(): Money {
    return this.minor < 0n ? this.negate() : this;
  }

  /** Exact scaling by a whole number — quantity x unit price. */
  multiply(factor: bigint | number): Money {
    let f: bigint;
    if (typeof factor === 'bigint') {
      f = factor;
    } else if (Number.isInteger(factor) && Number.isSafeInteger(factor)) {
      f = BigInt(factor);
    } else {
      throw new MoneyError('FLOAT_REJECTED', `multiply takes a whole number; for a rate use multiplyRatio or percentage. Got ${factor}`, { factor });
    }
    return new Money(this.minor * f, this.currency, this.exponent);
  }

  /** Scale by the rational numerator/denominator with an explicit rounding mode. */
  multiplyRatio(numerator: bigint | number, denominator: bigint | number, mode: RoundingMode): Money {
    const n = typeof numerator === 'bigint' ? numerator : BigInt(Math.trunc(numerator));
    const d = typeof denominator === 'bigint' ? denominator : BigInt(Math.trunc(denominator));
    if (typeof numerator === 'number' && !Number.isInteger(numerator)) {
      throw new MoneyError('FLOAT_REJECTED', `multiplyRatio needs integers; express ${numerator} as a fraction (e.g. 175/1000 for 17.5%)`, { numerator });
    }
    return new Money(divideRound(this.minor * n, d, mode), this.currency, this.exponent);
  }

  /**
   * Apply a percentage given as a decimal string ("17.5", "0.075"). Parsed exactly, so a
   * GST or platform-fee rate never arrives as 17.499999999999998.
   */
  percentage(percent: string | number, mode: RoundingMode): Money {
    const text = typeof percent === 'number' ? String(percent) : percent.trim();
    const match = DECIMAL_RE.exec(text);
    if (!match) throw new MoneyError('INVALID_AMOUNT', `Not a valid percentage: ${JSON.stringify(percent)}`, { percent });
    const [, sign, intPart = '', fracPart = ''] = match;
    if (intPart === '' && fracPart === '') throw new MoneyError('INVALID_AMOUNT', `Percentage has no digits: ${JSON.stringify(percent)}`, { percent });
    const numerator = BigInt(`${sign === '-' ? '-' : ''}${intPart || '0'}${fracPart}`);
    const denominator = 100n * 10n ** BigInt(fracPart.length);
    return new Money(divideRound(this.minor * numerator, denominator, mode), this.currency, this.exponent);
  }

  /**
   * Split across weights so the parts always sum back to exactly this amount. The remainder
   * is handed out one minor unit at a time to the largest fractional parts (largest-remainder),
   * so no penny is created or destroyed — the property every marketplace payout split needs.
   */
  allocate(weights: readonly (bigint | number)[], _mode?: RoundingMode): Money[] {
    if (!Array.isArray(weights) || weights.length === 0) {
      throw new MoneyError('INVALID_WEIGHTS', 'allocate needs at least one weight', {});
    }
    const w = weights.map((x, i) => {
      const v = typeof x === 'bigint' ? x : BigInt(Math.trunc(x));
      if (typeof x === 'number' && !Number.isInteger(x)) {
        throw new MoneyError('INVALID_WEIGHTS', `Weight ${i} must be a whole number, got ${x}. Scale your ratios up (0.5/0.5 -> 1/1).`, { index: i, weight: x });
      }
      if (v < 0n) throw new MoneyError('INVALID_WEIGHTS', `Weight ${i} is negative`, { index: i });
      return v;
    });
    const total = w.reduce((a, b) => a + b, 0n);
    if (total === 0n) throw new MoneyError('INVALID_WEIGHTS', 'Weights sum to zero', {});

    // Work on the magnitude so a negative amount (refund) distributes identically.
    const negative = this.minor < 0n;
    const magnitude = negative ? -this.minor : this.minor;

    const bases = w.map((weight) => (magnitude * weight) / total);
    const remainders = w.map((weight, i) => magnitude * weight - bases[i]! * total);

    const distributed = bases.reduce((a, b) => a + b, 0n);
    let leftover = magnitude - distributed;

    // Largest remainder first; ties resolve by index so the split is deterministic and
    // reproducible across services reconciling the same order.
    const order = remainders
      .map((r, i) => ({ r, i }))
      .sort((a, b) => (a.r === b.r ? a.i - b.i : (b.r > a.r ? 1 : -1)));

    const parts = bases.slice();
    let cursor = 0;
    while (leftover > 0n && order.length > 0) {
      const target = order[cursor % order.length]!;
      parts[target.i] = parts[target.i]! + 1n;
      leftover -= 1n;
      cursor += 1;
    }

    return parts.map((p) => new Money(negative ? -p : p, this.currency, this.exponent));
  }

  /** Equal split into n parts, remainder spread across the first parts. */
  split(n: number): Money[] {
    if (!Number.isInteger(n) || n <= 0) throw new MoneyError('INVALID_WEIGHTS', `split needs a positive integer, got ${n}`, { n });
    return this.allocate(new Array(n).fill(1));
  }

  // ---------------------------------------------------------------- comparison

  compare(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other);
    if (this.minor < other.minor) return -1;
    if (this.minor > other.minor) return 1;
    return 0;
  }

  equals(other: Money): boolean { return other instanceof Money && other.currency === this.currency && other.minor === this.minor; }
  greaterThan(other: Money): boolean { return this.compare(other) > 0; }
  greaterThanOrEqual(other: Money): boolean { return this.compare(other) >= 0; }
  lessThan(other: Money): boolean { return this.compare(other) < 0; }
  lessThanOrEqual(other: Money): boolean { return this.compare(other) <= 0; }
  isZero(): boolean { return this.minor === 0n; }
  isPositive(): boolean { return this.minor > 0n; }
  isNegative(): boolean { return this.minor < 0n; }

  // ---------------------------------------------------------------- output

  /** Exact major-unit decimal string: 1000055 paise -> "10000.55". Safe for a DECIMAL column. */
  toDecimalString(): string {
    const negative = this.minor < 0n;
    const digits = (negative ? -this.minor : this.minor).toString();
    if (this.exponent === 0) return `${negative ? '-' : ''}${digits}`;
    const padded = digits.padStart(this.exponent + 1, '0');
    const cut = padded.length - this.exponent;
    return `${negative ? '-' : ''}${padded.slice(0, cut)}.${padded.slice(cut)}`;
  }

  /**
   * Minor units as a JS number, for boundaries that still take one (PSP SDKs, the PCL
   * `amountMinor` field). Throws rather than silently losing precision.
   */
  toSafeNumber(): number {
    if (this.minor > BigInt(Number.MAX_SAFE_INTEGER) || this.minor < -BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new MoneyError('UNSAFE_NUMBER', `${this.minor} minor units exceeds Number.MAX_SAFE_INTEGER`, { minor: this.minor.toString() });
    }
    return Number(this.minor);
  }

  /** Grouped display string. 'indian' gives the lakh/crore grouping used on INR invoices. */
  format(options: { grouping?: 'western' | 'indian' | 'none'; symbol?: string } = {}): string {
    const grouping = options.grouping ?? (this.currency === 'INR' ? 'indian' : 'western');
    const decimal = this.toDecimalString();
    const negative = decimal.startsWith('-');
    const body = negative ? decimal.slice(1) : decimal;
    const [whole = '0', fraction] = body.split('.');

    let grouped = whole;
    if (grouping === 'western') {
      grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else if (grouping === 'indian') {
      const head = whole.slice(0, -3);
      const tail = whole.slice(-3);
      grouped = head ? `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}` : tail;
    }

    const prefix = options.symbol ? `${options.symbol}` : `${this.currency} `;
    return `${negative ? '-' : ''}${prefix}${grouped}${fraction ? `.${fraction}` : ''}`;
  }

  toJSON(): MoneyJSON {
    return { amount: this.minor.toString(), currency: this.currency, exponent: this.exponent };
  }

  toString(): string {
    return `${this.toDecimalString()} ${this.currency}`;
  }

  // ---------------------------------------------------------------- statics

  static sum(...amounts: Money[]): Money {
    if (amounts.length === 0) throw new MoneyError('INVALID_AMOUNT', 'sum needs at least one amount (currency cannot be inferred from nothing)', {});
    return amounts.reduce((a, b) => a.add(b));
  }

  static max(...amounts: Money[]): Money {
    if (amounts.length === 0) throw new MoneyError('INVALID_AMOUNT', 'max needs at least one amount', {});
    return amounts.reduce((a, b) => (a.compare(b) >= 0 ? a : b));
  }

  static min(...amounts: Money[]): Money {
    if (amounts.length === 0) throw new MoneyError('INVALID_AMOUNT', 'min needs at least one amount', {});
    return amounts.reduce((a, b) => (a.compare(b) <= 0 ? a : b));
  }
}
