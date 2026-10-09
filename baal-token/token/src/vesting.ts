// Deterministic vesting specification calculator. Specification and test use
// only: nothing here signs, sends, or deploys anything.
//
// Model (see docs/03-tokenomics/vesting.md):
//   - Time zero is the TGE timestamp (UTC unix seconds).
//   - Months are calendar months in UTC, clamped to the last day of a shorter
//     month, always counted from the TGE (no drift).
//   - tgeUnlockPercent of the allocation is released at TGE.
//   - Nothing else is released until the cliff ends (TGE + cliffMonths).
//   - The remainder then vests linearly, per second, until
//     cliff end + linearMonths. Amounts are floored, so a schedule can lag the
//     ideal line by less than one base unit but can never exceed it, and the
//     final timestamp releases exactly the whole allocation.

import { parsePercentToBps, bpsOf } from './units.ts';

export const MAX_CLIFF_MONTHS = 120;
/** Nothing before the cliff, no lump sum at it, continuous linear release after it (ADR-006). */
export const RELEASE_SHAPE = 'zero-before-cliff-then-continuous-linear';
export const MONTH_COUNTING = 'calendar-months-utc-from-tge';
export const MAX_LINEAR_MONTHS = 240;

export type VestingSpec =
  | { readonly type: 'none'; readonly status: 'approved'; readonly tgeUnlockPercent: string }
  /** TBD: no schedule has been approved. It must never be turned into numbers. */
  | {
      readonly type: 'unspecified';
      readonly status: 'tbd';
      readonly tgeUnlockPercent: null;
    }
  | {
      readonly type: 'cliff-linear';
      readonly status: 'approved';
      readonly releaseShape: typeof RELEASE_SHAPE;
      readonly monthCounting: typeof MONTH_COUNTING;
      readonly cliffMonths: number;
      readonly linearMonths: number;
      readonly tgeUnlockPercent: string;
    };

export interface VestingParams {
  readonly cliffMonths: number;
  readonly linearMonths: number;
  readonly tgeUnlockBps: bigint;
}

export interface VestingBoundaries {
  readonly tge: number;
  readonly cliffEnd: number;
  readonly vestingEnd: number;
}

function assertTimestamp(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} must be a non-negative integer (unix seconds)`);
}

/** Adds calendar months in UTC, clamping the day to the target month's length. */
export function addMonthsUtc(unixSeconds: number, months: number): number {
  assertTimestamp(unixSeconds, 'unixSeconds');
  if (!Number.isInteger(months) || months < 0)
    throw new RangeError('months must be a non-negative integer');
  const d = new Date(unixSeconds * 1000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);
  const ms = Date.UTC(year, month, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
  return ms / 1000;
}

/** Converts a validated spec into calculator parameters. "unspecified" has none. */
export function vestingParamsFromSpec(spec: VestingSpec): VestingParams | undefined {
  if (spec.type === 'unspecified') return undefined;
  const bps = parsePercentToBps(spec.tgeUnlockPercent);
  if (bps === undefined || bps > 10_000n)
    throw new RangeError('tgeUnlockPercent must be between "0" and "100"');
  if (spec.type === 'none') return { cliffMonths: 0, linearMonths: 1, tgeUnlockBps: 10_000n };
  return { cliffMonths: spec.cliffMonths, linearMonths: spec.linearMonths, tgeUnlockBps: bps };
}

export function vestingBoundaries(tge: number, params: VestingParams): VestingBoundaries {
  const cliffEnd = addMonthsUtc(tge, params.cliffMonths);
  const vestingEnd = addMonthsUtc(tge, params.cliffMonths + params.linearMonths);
  return { tge, cliffEnd, vestingEnd };
}

/** Total base units vested (released, whether or not claimed) at `at`. */
export function vestedAmount(
  allocation: bigint,
  params: VestingParams,
  tge: number,
  at: number,
): bigint {
  if (allocation < 0n) throw new RangeError('allocation must not be negative');
  assertTimestamp(tge, 'tge');
  assertTimestamp(at, 'at');
  if (params.linearMonths < 1) throw new RangeError('linearMonths must be at least 1');
  if (at < tge) return 0n;

  const atTge = bpsOf(allocation, params.tgeUnlockBps);
  const { cliffEnd, vestingEnd } = vestingBoundaries(tge, params);
  if (at <= cliffEnd) return atTge;
  if (at >= vestingEnd) return allocation;

  const linearTotal = allocation - atTge;
  const elapsed = BigInt(at - cliffEnd);
  const duration = BigInt(vestingEnd - cliffEnd);
  return atTge + (linearTotal * elapsed) / duration;
}

/** Vested minus already claimed. Rejects impossible claim histories. */
export function claimableAmount(
  allocation: bigint,
  params: VestingParams,
  tge: number,
  at: number,
  alreadyClaimed: bigint,
): bigint {
  if (alreadyClaimed < 0n) throw new RangeError('alreadyClaimed must not be negative');
  const vested = vestedAmount(allocation, params, tge, at);
  if (alreadyClaimed > vested)
    throw new RangeError('alreadyClaimed exceeds the amount vested at this time');
  return vested - alreadyClaimed;
}
