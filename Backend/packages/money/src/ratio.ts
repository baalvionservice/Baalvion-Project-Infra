/**
 * Exact rational form of a decimal value.
 *
 * Rates — tax percentages, customs duty, FX — arrive as decimals and are then multiplied into
 * money. Doing that multiplication in floating point is where the error enters, so the rate is
 * first turned into an exact fraction (0.034 -> 34/1000) and the multiply becomes integer
 * arithmetic with one explicit rounding at the end.
 */
import { MoneyError } from './errors';

export interface Ratio {
  numerator: bigint;
  denominator: bigint;
}

const PLAIN_DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?$/;

/**
 * Render a number as a plain decimal string, expanding exponent notation.
 * `String(1e-7)` gives "1e-7", which is not a decimal this can parse.
 */
function toPlainDecimalString(value: number): string {
  const text = String(value);
  if (!/[eE]/.test(text)) return text;
  // 20 is the maximum toFixed supports and is well past a double's significant digits.
  const fixed = value.toFixed(20);
  // Trim trailing zeros introduced by the padding, but keep at least one fraction digit.
  return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * Convert a decimal rate to an exact fraction.
 *
 * A string is parsed exactly. A number is converted via its own decimal rendering, which
 * recovers the intended rate for a literal like `0.18` but cannot undo error already
 * accumulated in the value — pass rates as strings wherever they originate as text.
 */
export function ratioFromDecimal(value: string | number | bigint): Ratio {
  if (typeof value === 'bigint') return { numerator: value, denominator: 1n };
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new MoneyError('INVALID_AMOUNT', `Rate is not finite: ${value}`, { value });
  }

  const text = typeof value === 'number' ? toPlainDecimalString(value) : String(value).trim();
  const match = PLAIN_DECIMAL.exec(text);
  if (!match) {
    throw new MoneyError('INVALID_AMOUNT', `Not a plain decimal rate: ${JSON.stringify(value)}`, { value });
  }
  const [, sign, intPart = '', fracPart = ''] = match;
  if (intPart === '' && fracPart === '') {
    throw new MoneyError('INVALID_AMOUNT', `Rate has no digits: ${JSON.stringify(value)}`, { value });
  }
  return {
    numerator: BigInt(`${sign === '-' ? '-' : ''}${intPart || '0'}${fracPart}`),
    denominator: 10n ** BigInt(fracPart.length),
  };
}
