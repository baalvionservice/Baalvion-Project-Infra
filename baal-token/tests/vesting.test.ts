import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAllocationDocument } from '../token/src/allocation.ts';
import {
  addMonthsUtc,
  claimableAmount,
  vestedAmount,
  vestingBoundaries,
  vestingParamsFromSpec,
} from '../token/src/vesting.ts';
import type { VestingParams } from '../token/src/vesting.ts';
import { load } from './helpers.ts';

const doc = parseAllocationDocument(load('token', 'allocation.json'));
const founder = doc.allocations.find((a) => a.id === 'founder-team');
assert.ok(founder);
const ALLOCATION = BigInt(founder.baseUnits); // 150,000,000 BAAL
const params = vestingParamsFromSpec(founder.vesting);
assert.ok(params);

const utc = (y: number, m: number, d = 1, h = 0, mi = 0, s = 0): number =>
  Date.UTC(y, m - 1, d, h, mi, s) / 1000;
const TGE = utc(2027, 1, 1);
const CLIFF_END = utc(2028, 1, 1);
const END = utc(2031, 1, 1);
const vested = (at: number): bigint => vestedAmount(ALLOCATION, params, TGE, at);

// Independent re-statement of the ideal line, used to cross-check the library.
const ideal = (at: number): bigint =>
  (ALLOCATION * BigInt(at - CLIFF_END)) / BigInt(END - CLIFF_END);

describe('founder vesting: 12-month cliff, then 36-month linear', () => {
  it('has the approved boundaries', () => {
    assert.deepEqual(vestingBoundaries(TGE, params), {
      tge: TGE,
      cliffEnd: CLIFF_END,
      vestingEnd: END,
    });
  });

  const checkpoints: [string, number, bigint][] = [
    ['TGE', TGE, 0n],
    ['30 days', TGE + 30 * 86400, 0n],
    ['90 days', TGE + 90 * 86400, 0n],
    ['6 months', addMonthsUtc(TGE, 6), 0n],
    ['12 months (cliff end)', addMonthsUtc(TGE, 12), 0n],
    ['24 months', addMonthsUtc(TGE, 24), ideal(addMonthsUtc(TGE, 24))],
    ['36 months', addMonthsUtc(TGE, 36), ideal(addMonthsUtc(TGE, 36))],
    ['48 months (final)', addMonthsUtc(TGE, 48), ALLOCATION],
  ];
  for (const [label, at, expected] of checkpoints) {
    it(`vested at ${label}`, () => {
      assert.equal(vested(at), expected);
    });
  }

  it('hand-checked values at 24 and 36 months', () => {
    // 2028-01-01 -> 2029-01-01 is 366 days (2028 leap); whole vesting window is 1096 days.
    assert.equal(vested(utc(2029, 1, 1)), (ALLOCATION * 366n) / 1096n);
    assert.equal(vested(utc(2030, 1, 1)), (ALLOCATION * 731n) / 1096n);
    assert.ok(vested(utc(2029, 1, 1)) > 0n && vested(utc(2029, 1, 1)) < ALLOCATION / 2n);
  });

  it('cliff: nothing before it, nothing at it, something one second after', () => {
    assert.equal(vested(CLIFF_END - 1), 0n);
    assert.equal(vested(CLIFF_END), 0n);
    assert.ok(vested(CLIFF_END + 1) > 0n);
    assert.equal(vested(CLIFF_END + 1), ideal(CLIFF_END + 1));
  });

  it('claims immediately before and after the cliff', () => {
    assert.equal(claimableAmount(ALLOCATION, params, TGE, CLIFF_END - 1, 0n), 0n);
    const after = claimableAmount(ALLOCATION, params, TGE, CLIFF_END + 1, 0n);
    assert.equal(after, ideal(CLIFF_END + 1));
    assert.equal(claimableAmount(ALLOCATION, params, TGE, CLIFF_END + 1, after), 0n);
  });

  it('is linear: equal time slices release equal amounts (within one unit of rounding)', () => {
    const slice = (END - CLIFF_END) / 4;
    assert.ok(Number.isInteger(slice));
    const releases = [1, 2, 3, 4].map(
      (i) => vested(CLIFF_END + i * slice) - vested(CLIFF_END + (i - 1) * slice),
    );
    for (const r of releases) assert.ok(r - releases[0]! <= 1n && releases[0]! - r <= 1n);
  });

  it('never exceeds the allocation, never decreases, hits the cap exactly', () => {
    let previous = 0n;
    for (let at = TGE - 86400; at <= END + 86400 * 400; at += 86400 * 3 + 17) {
      const v = vested(at);
      assert.ok(v >= previous, `decreased at ${at}`);
      assert.ok(v <= ALLOCATION, `exceeded cap at ${at}`);
      previous = v;
    }
    assert.equal(vested(END - 1) < ALLOCATION, true);
    assert.equal(vested(END), ALLOCATION);
    assert.equal(vested(END + 10 * 365 * 86400), ALLOCATION);
  });

  it('final vesting date releases exactly the full allocation, with no dust', () => {
    assert.equal(
      claimableAmount(ALLOCATION, params, TGE, END, vested(END - 1)),
      ALLOCATION - vested(END - 1),
    );
    assert.equal(claimableAmount(ALLOCATION, params, TGE, END, ALLOCATION), 0n);
  });

  it('nothing is vested before TGE', () => {
    assert.equal(vested(TGE - 1), 0n);
  });

  it('is deterministic', () => {
    const at = utc(2029, 6, 15, 12, 30, 45);
    assert.equal(vested(at), vested(at));
  });
});

describe('rounding', () => {
  const tiny: VestingParams = { cliffMonths: 0, linearMonths: 3, tgeUnlockBps: 0n };

  it('floors, so a schedule can lag but never lead', () => {
    const allocation = 7n;
    const total = utc(2027, 4, 1) - TGE;
    for (let t = 0; t <= total; t += 3600) {
      assert.equal(
        vestedAmount(allocation, tiny, TGE, TGE + t),
        (allocation * BigInt(t)) / BigInt(total),
      );
    }
    assert.equal(vestedAmount(allocation, tiny, TGE, TGE + total), allocation);
  });

  it('handles amounts that are not divisible by the duration', () => {
    const allocation = 10n ** 18n + 1n;
    assert.equal(vestedAmount(allocation, tiny, TGE, utc(2027, 4, 1)), allocation);
    assert.ok(vestedAmount(allocation, tiny, TGE, utc(2027, 4, 1) - 1) < allocation);
  });

  it('a TGE unlock is floored and the rest still sums to the allocation', () => {
    const p: VestingParams = { cliffMonths: 6, linearMonths: 6, tgeUnlockBps: 333n };
    const allocation = 1_000_001n;
    const atTge = vestedAmount(allocation, p, TGE, TGE);
    assert.equal(atTge, (allocation * 333n) / 10_000n);
    assert.equal(vestedAmount(allocation, p, TGE, addMonthsUtc(TGE, 6)), atTge);
    assert.equal(vestedAmount(allocation, p, TGE, addMonthsUtc(TGE, 12)), allocation);
  });
});

describe('calendar arithmetic', () => {
  it('adds calendar months in UTC and clamps short months', () => {
    assert.equal(addMonthsUtc(utc(2027, 1, 31), 1), utc(2027, 2, 28));
    assert.equal(addMonthsUtc(utc(2028, 1, 31), 1), utc(2028, 2, 29));
    assert.equal(addMonthsUtc(utc(2027, 11, 30, 8, 15, 5), 3), utc(2028, 2, 29, 8, 15, 5));
    assert.equal(addMonthsUtc(utc(2027, 5, 15), 0), utc(2027, 5, 15));
  });

  it('does not drift when months are always counted from TGE', () => {
    const tge = utc(2027, 1, 31);
    assert.equal(addMonthsUtc(tge, 2), utc(2027, 3, 31));
    assert.equal(addMonthsUtc(tge, 12), utc(2028, 1, 31));
  });

  it('rejects bad input', () => {
    assert.throws(() => addMonthsUtc(-1, 1), RangeError);
    assert.throws(() => addMonthsUtc(1.5, 1), RangeError);
    assert.throws(() => addMonthsUtc(0, -1), RangeError);
    assert.throws(() => addMonthsUtc(0, 1.5), RangeError);
  });
});

describe('claims and spec handling', () => {
  it('rejects impossible claim histories', () => {
    assert.throws(
      () => claimableAmount(ALLOCATION, params, TGE, CLIFF_END, 1n),
      /exceeds the amount vested/,
    );
    assert.throws(() => claimableAmount(ALLOCATION, params, TGE, END, -1n), /must not be negative/);
    assert.throws(() => claimableAmount(ALLOCATION, params, TGE, END, ALLOCATION + 1n), RangeError);
  });

  it('rejects a negative allocation and bad timestamps', () => {
    assert.throws(() => vestedAmount(-1n, params, TGE, TGE), RangeError);
    assert.throws(() => vestedAmount(1n, params, TGE, Number.NaN), RangeError);
    assert.throws(() => vestedAmount(1n, { ...params, linearMonths: 0 }, TGE, TGE), RangeError);
  });

  it('has no calculable schedule for allocations without an approved one', () => {
    assert.equal(
      vestingParamsFromSpec({ type: 'unspecified', status: 'tbd', tgeUnlockPercent: null }),
      undefined,
    );
  });

  it('"none" is fully liquid at TGE', () => {
    const p = vestingParamsFromSpec({ type: 'none', status: 'approved', tgeUnlockPercent: '100' });
    assert.ok(p);
    assert.equal(vestedAmount(1000n, p, TGE, TGE), 1000n);
  });

  it('a 100% TGE unlock on a cliff schedule is still capped at the allocation', () => {
    const p = vestingParamsFromSpec({
      type: 'cliff-linear',
      status: 'approved',
      releaseShape: 'zero-before-cliff-then-continuous-linear',
      monthCounting: 'calendar-months-utc-from-tge',
      cliffMonths: 1,
      linearMonths: 1,
      tgeUnlockPercent: '100',
    });
    assert.ok(p);
    assert.equal(vestedAmount(1000n, p, TGE, TGE), 1000n);
    assert.equal(vestedAmount(1000n, p, TGE, addMonthsUtc(TGE, 2)), 1000n);
  });
});
