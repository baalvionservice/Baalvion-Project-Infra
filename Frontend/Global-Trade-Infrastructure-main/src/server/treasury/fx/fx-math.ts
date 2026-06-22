/**
 * @file server/treasury/fx/fx-math.ts
 * @description Pure FX pricing and conversion. The platform quotes an all-in
 * rate by marking the mid-market rate in its favour by (spread + margin) basis
 * points, then converts amounts exactly. Quote expiry is a pure time comparison.
 * No floating point — all arithmetic is BigInt (money-math).
 */
import { Money } from '../../ledger/money';
import { applyRate, parseRate, formatRate, roundDivHalfUp } from '../money-math';
import { FXPricing } from '../types';

export class FXError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FXError';
  }
}

const BPS_DENOM = BigInt(10_000);

/**
 * Price a quote: the all-in rate the customer receives when converting base →
 * quote is the mid rate marked DOWN by (spread + margin) bps, so the platform
 * earns the difference. spread/margin are non-negative basis points.
 */
export function priceQuote(midRate: string, spreadBps: number, marginBps: number): FXPricing {
  if (!Number.isInteger(spreadBps) || spreadBps < 0 || !Number.isInteger(marginBps) || marginBps < 0) {
    throw new FXError(`INVALID_BPS: spread=${spreadBps} margin=${marginBps}`);
  }
  const totalBps = spreadBps + marginBps;
  if (totalBps >= 10_000) throw new FXError('SPREAD_TOO_WIDE: spread + margin must be under 100%');

  const midUnits = parseRate(midRate); // scale-8
  const allInUnits = roundDivHalfUp(midUnits * BigInt(10_000 - totalBps), BPS_DENOM);
  return { midRate: formatRate(midUnits), spreadBps, marginBps, allInRate: formatRate(allInUnits) };
}

/** Convert a base amount to the quote currency at the all-in rate. */
export function convert(base: Money, allInRate: string, quoteCurrency: string): Money {
  if (!base.isPositive()) throw new FXError('CONVERT_NON_POSITIVE: base amount must be positive');
  return applyRate(base, allInRate, quoteCurrency);
}

/** True when `expiresAtMs` is at or before `nowMs`. */
export function isExpired(nowMs: number, expiresAtMs: number): boolean {
  return expiresAtMs <= nowMs;
}

/** The platform's FX margin in the base currency, given mid vs all-in rate. */
export function marginAmount(base: Money, midRate: string, allInRate: string, quoteCurrency: string): Money {
  const atMid = applyRate(base, midRate, quoteCurrency);
  const atAllIn = applyRate(base, allInRate, quoteCurrency);
  return atMid.subtract(atAllIn); // what the customer gives up vs mid
}
