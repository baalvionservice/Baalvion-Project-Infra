import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAllocationDocument } from '../token/src/allocation.ts';
import {
  addMonthsUtc,
  vestedAmount,
  vestingBoundaries,
  vestingParamsFromSpec,
} from '../token/src/vesting.ts';
import { load } from './helpers.ts';

const doc = parseAllocationDocument(load('token', 'allocation.json'));
const founder = doc.allocations.find((a) => a.id === 'founder-team');
assert.ok(founder);
const A = BigInt(founder.baseUnits);
const params = vestingParamsFromSpec(founder.vesting);
assert.ok(params);
const utc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0): number =>
  Date.UTC(y, m - 1, d, h, mi, s) / 1000;
const v = (tge: number, at: number): bigint => vestedAmount(A, params, tge, at);

describe('ADR-006: exact founder interpretation V(t)', () => {
  const tge = utc(2027, 3, 15, 9, 30, 0);
  const c = addMonthsUtc(tge, 12);
  const e = addMonthsUtc(tge, 48);

  it('V(t) = 0 for every t <= cliff', () => {
    for (const t of [tge - 1, tge, tge + 1, tge + 86400 * 100, c - 1, c])
      assert.equal(v(tge, t), 0n, String(t));
  });

  it('V(t) = floor(A * (t - c) / (e - c)) for c < t < e', () => {
    for (const t of [c + 1, c + 3600, utc(2029, 6, 1), utc(2030, 1, 1), e - 1]) {
      assert.equal(v(tge, t), (A * BigInt(t - c)) / BigInt(e - c), String(t));
    }
  });

  it('V(t) = A for every t >= e', () => {
    for (const t of [e, e + 1, e + 86400 * 5000]) assert.equal(v(tge, t), A);
  });

  it('has no lump sum at the cliff: the first second releases about one second of linear vesting', () => {
    const perSecond = A / BigInt(e - c) + 1n;
    assert.ok(v(tge, c + 1) > 0n);
    assert.ok(v(tge, c + 1) <= perSecond);
    assert.ok(v(tge, c + 1) < A / 1000n);
  });

  it('is continuous: adjacent seconds never differ by more than one second of vesting (+1 for rounding)', () => {
    const step = A / BigInt(e - c) + 1n;
    for (const t of [c, c + 1, utc(2029, 1, 1), utc(2030, 12, 31, 23, 59, 59), e - 2, e - 1]) {
      const d = v(tge, t + 1) - v(tge, t);
      assert.ok(d >= 0n && d <= step, `${t}: ${d}`);
    }
  });

  it('24 months after TGE, about one third is vested because vesting began at month 12', () => {
    const at = addMonthsUtc(tge, 24);
    const ratio = (v(tge, at) * 1000n) / A;
    assert.ok(ratio >= 330n && ratio <= 336n, `${ratio}`);
  });
});

describe('calendar-month boundaries (UTC)', () => {
  it('TGE on the 31st: cliff and end keep the 31st where it exists', () => {
    const tge = utc(2027, 1, 31, 12);
    assert.deepEqual(vestingBoundaries(tge, params), {
      tge,
      cliffEnd: utc(2028, 1, 31, 12),
      vestingEnd: utc(2031, 1, 31, 12),
    });
  });

  it('TGE on 29 Feb (leap day): cliff clamps to 28 Feb, end returns to 29 Feb', () => {
    const tge = utc(2028, 2, 29);
    const b = vestingBoundaries(tge, params);
    assert.equal(b.cliffEnd, utc(2029, 2, 28));
    assert.equal(b.vestingEnd, utc(2032, 2, 29));
    assert.equal(v(tge, b.cliffEnd), 0n);
    assert.ok(v(tge, b.cliffEnd + 1) > 0n);
    assert.equal(v(tge, b.vestingEnd - 1) < A, true);
    assert.equal(v(tge, b.vestingEnd), A);
  });

  it('TGE on 30 Aug: month arithmetic does not drift through shorter months', () => {
    const tge = utc(2027, 8, 30);
    assert.equal(addMonthsUtc(tge, 6), utc(2028, 2, 29));
    assert.equal(addMonthsUtc(tge, 12), utc(2028, 8, 30));
    assert.equal(addMonthsUtc(tge, 48), utc(2031, 8, 30));
  });

  it('last second of a month and the first second of the next', () => {
    const tge = utc(2027, 1, 31, 23, 59, 59);
    assert.equal(addMonthsUtc(tge, 1), utc(2027, 2, 28, 23, 59, 59));
    assert.equal(addMonthsUtc(utc(2027, 12, 31), 2), utc(2028, 2, 29));
  });

  it('is independent of the local timezone (uses UTC only)', () => {
    const tge = utc(2027, 6, 1, 0, 0, 0);
    assert.equal(addMonthsUtc(tge, 12), utc(2028, 6, 1, 0, 0, 0));
  });

  it('calendar months make equal month offsets unequal in seconds', () => {
    const tge = utc(2027, 1, 1);
    const firstYear = addMonthsUtc(tge, 24) - addMonthsUtc(tge, 12);
    const window = addMonthsUtc(tge, 48) - addMonthsUtc(tge, 12);
    assert.notEqual(firstYear * 3, window);
  });
});
