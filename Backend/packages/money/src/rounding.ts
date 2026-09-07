/**
 * Rounding is always explicit. There is no default mode anywhere in this package: a caller
 * that divides money must say what happens to the remainder, because that choice is a
 * business decision (tax rules, PSP behaviour, contract terms) and not a maths detail.
 */
import { MoneyError } from './errors';

export type RoundingMode =
  /** Toward zero. -1.5 -> -1, 1.5 -> 1. */
  | 'TRUNCATE'
  /** Toward -inf. -1.5 -> -2, 1.5 -> 1. */
  | 'FLOOR'
  /** Toward +inf. -1.5 -> -1, 1.5 -> 2. */
  | 'CEIL'
  /** Ties away from zero. The everyday "round half up" most invoices assume. */
  | 'HALF_UP'
  /** Ties toward zero. */
  | 'HALF_DOWN'
  /** Ties to the even neighbour — banker's rounding. Use for repeated allocations so
   *  rounding error does not accumulate in one direction across a large book. */
  | 'HALF_EVEN';

export const ROUNDING_MODES: readonly RoundingMode[] = Object.freeze([
  'TRUNCATE', 'FLOOR', 'CEIL', 'HALF_UP', 'HALF_DOWN', 'HALF_EVEN',
]);

/**
 * Integer division with an explicit rounding mode, correct for negative numerators
 * (refunds, credit notes, chargebacks — the cases most money bugs hide in).
 */
export function divideRound(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint {
  if (denominator === 0n) {
    throw new MoneyError('DIVISION_BY_ZERO', 'Division by zero');
  }
  // Normalise so the denominator is positive; the numerator carries the sign.
  let n = numerator;
  let d = denominator;
  if (d < 0n) { n = -n; d = -d; }

  const q = n / d;  // BigInt division truncates toward zero
  const r = n % d;  // remainder takes the sign of n
  if (r === 0n) return q;

  const sign = n < 0n ? -1n : 1n;
  const twiceRemainder = (r < 0n ? -r : r) * 2n;

  switch (mode) {
    case 'TRUNCATE':
      return q;
    case 'FLOOR':
      return n < 0n ? q - 1n : q;
    case 'CEIL':
      return n > 0n ? q + 1n : q;
    case 'HALF_UP':
      return twiceRemainder >= d ? q + sign : q;
    case 'HALF_DOWN':
      return twiceRemainder > d ? q + sign : q;
    case 'HALF_EVEN':
      if (twiceRemainder > d) return q + sign;
      if (twiceRemainder < d) return q;
      return q % 2n === 0n ? q : q + sign;
    default: {
      const exhaustive: never = mode;
      throw new MoneyError('INVALID_AMOUNT', `Unknown rounding mode: ${String(exhaustive)}`);
    }
  }
}
