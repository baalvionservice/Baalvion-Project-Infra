/**
 * Payment-provider amount adapters.
 *
 * Each PSP has its own idea of what an "amount" is, and getting it wrong is silent: an
 * over- or under-charge that both sides consider valid. These adapters are the only place
 * that conversion is allowed to happen, so the rule for every gateway is written down once.
 */
import { Money } from './money';
import { MoneyError } from './errors';
import { exponentOf } from './currency';

/**
 * Razorpay takes the amount in the smallest currency unit as an integer — paise for INR.
 * This is already our internal representation, so the conversion is identity plus a
 * safe-integer check.
 */
export function toRazorpayAmount(money: Money): number {
  if (money.isNegative()) {
    throw new MoneyError('INVALID_AMOUNT', `Razorpay amounts must be positive, got ${money.toString()}`, { amount: money.toJSON() });
  }
  return money.toSafeNumber();
}

export function fromRazorpayAmount(amountMinor: number | string | bigint, currency: string): Money {
  return Money.of(amountMinor, currency);
}

/**
 * Stripe also takes the smallest currency unit. The trap is zero-decimal currencies (JPY,
 * KRW): sending value*100 there is a 100x overcharge. Our ISO table already encodes that.
 * Stripe additionally requires three-decimal currencies to be a multiple of ten.
 */
export function toStripeAmount(money: Money): number {
  if (money.isNegative()) {
    throw new MoneyError('INVALID_AMOUNT', `Stripe amounts must be positive, got ${money.toString()}`, { amount: money.toJSON() });
  }
  if (exponentOf(money.currency) === 3 && money.minor % 10n !== 0n) {
    throw new MoneyError(
      'INVALID_AMOUNT',
      `Stripe requires ${money.currency} amounts to be a multiple of 10 minor units; ${money.minor} is not. Round the price before charging.`,
      { amount: money.toJSON() },
    );
  }
  return money.toSafeNumber();
}

export function fromStripeAmount(amountMinor: number | string | bigint, currency: string): Money {
  return Money.of(amountMinor, currency);
}

/** PayU posts major units as a fixed-point string ("10000.55") and signs that exact text. */
export function toPayUAmount(money: Money): string {
  if (!money.isPositive()) {
    throw new MoneyError('INVALID_AMOUNT', `PayU amounts must be positive, got ${money.toString()}`, { amount: money.toJSON() });
  }
  return money.toDecimalString();
}

export function fromPayUAmount(amountMajor: string, currency: string): Money {
  return Money.fromDecimal(amountMajor, currency);
}

/** Cashfree takes major units as a decimal. Same string form as PayU. */
export function toCashfreeAmount(money: Money): string {
  return toPayUAmount(money);
}

export function fromCashfreeAmount(amountMajor: string, currency: string): Money {
  return Money.fromDecimal(amountMajor, currency);
}

export interface AmountMatchResult {
  ok: boolean;
  expected: Money;
  seen: Money;
  /** Signed difference, seen - expected. Zero when they agree. */
  difference: Money;
}

/**
 * The capture-time guard: does what the provider says it took equal what we asked for?
 *
 * Exact — no epsilon. A float comparison needs a tolerance (`Math.abs(a-b) > 0.01`), and a
 * tolerance is a hole: it accepts a real short-payment of up to one minor unit per capture,
 * every capture, forever. With integers the question has a yes/no answer.
 *
 * A currency mismatch is reported as a failed match rather than thrown, because at a webhook
 * boundary that is untrusted input, not a bug in our code.
 */
export function checkCapturedAmount(expected: Money, seenMinor: number | string | bigint, seenCurrency: string): AmountMatchResult {
  const seen = Money.of(seenMinor, seenCurrency);
  if (seen.currency !== expected.currency) {
    return { ok: false, expected, seen, difference: seen };
  }
  const difference = seen.subtract(expected);
  return { ok: difference.isZero(), expected, seen, difference };
}
