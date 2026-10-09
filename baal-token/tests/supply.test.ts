import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAllocationDocument } from '../token/src/allocation.ts';
import { computeSupply, requireCirculating } from '../token/src/supply.ts';
import { addMonthsUtc, vestedAmount, vestingParamsFromSpec } from '../token/src/vesting.ts';
import { load, mutate } from './helpers.ts';

const raw = load('token', 'allocation.json');
const doc = parseAllocationDocument(raw);
const TGE = Date.UTC(2027, 0, 1) / 1000;
const FOUNDER = 150_000_000n * 10n ** 9n;
const TBD_IDS = [
  'treasury',
  'community-ecosystem',
  'future-development',
  'liquidity',
  'marketing-partnerships',
  'operations-reserve',
];
const row = (r: ReturnType<typeof computeSupply>, id: string) => {
  const found = r.allocations.find((a) => a.id === id);
  assert.ok(found, id);
  return found;
};

describe('supply model: total, allocated, locked, vested, distributed, circulating', () => {
  it('before launch: total = allocated, nothing vested or distributed', () => {
    const r = computeSupply(doc, { at: 0, tge: undefined });
    assert.equal(r.totalSupply, 10n ** 18n);
    assert.equal(r.allocated, r.totalSupply);
    assert.equal(r.distributed, 0n);
    assert.equal(row(r, 'founder-team').vestedEligible, 0n);
    assert.equal(row(r, 'founder-team').locked, FOUNDER);
  });

  it('TBD allocations contribute null (unknown), never zero, to every derived quantity', () => {
    const r = computeSupply(doc, { at: TGE, tge: TGE });
    assert.deepEqual(r.tbdAllocationIds, TBD_IDS);
    for (const id of TBD_IDS) {
      const a = row(r, id);
      assert.equal(a.scheduleStatus, 'tbd');
      assert.equal(a.vestedEligible, null, id);
      assert.equal(a.locked, null, id);
      assert.equal(a.circulating, null, id);
    }
    assert.equal(r.locked, null);
    assert.equal(r.vestedEligible, null);
    assert.equal(r.circulating, null);
  });

  it('a TBD allocation is never counted as circulating, even if tokens were distributed from it', () => {
    const r = computeSupply(doc, {
      at: TGE + 1000,
      tge: TGE,
      distributed: { treasury: 5n * 10n ** 9n, liquidity: 1n },
    });
    assert.equal(row(r, 'treasury').distributed, 5n * 10n ** 9n);
    assert.equal(row(r, 'treasury').circulating, null);
    assert.equal(r.distributed, 5n * 10n ** 9n + 1n);
    assert.equal(r.circulating, null);
  });

  it('requireCirculating refuses while any schedule is TBD', () => {
    const r = computeSupply(doc, { at: TGE, tge: TGE });
    assert.throws(() => requireCirculating(r), /undetermined: schedules are TBD for treasury/);
  });

  it('allocated is not vested: the founder allocation is 100% allocated and 0% vested before the cliff', () => {
    const r = computeSupply(doc, { at: addMonthsUtc(TGE, 6), tge: TGE });
    const f = row(r, 'founder-team');
    assert.equal(f.allocated, FOUNDER);
    assert.equal(f.vestedEligible, 0n);
    assert.equal(f.locked, FOUNDER);
    assert.equal(f.circulating, 0n);
  });

  it('vested is not circulating: eligible tokens that were not distributed stay out of circulation', () => {
    const at = addMonthsUtc(TGE, 30);
    const f = row(computeSupply(doc, { at, tge: TGE }), 'founder-team');
    assert.ok((f.vestedEligible ?? 0n) > 0n);
    assert.equal(f.distributed, 0n);
    assert.equal(f.circulating, 0n);
    assert.equal(f.locked, FOUNDER - (f.vestedEligible ?? 0n));
  });

  it('circulating equals what was actually distributed, up to the vested amount', () => {
    const at = addMonthsUtc(TGE, 30);
    const founder = doc.allocations.find((a) => a.id === 'founder-team');
    assert.ok(founder);
    const params = vestingParamsFromSpec(founder.vesting);
    assert.ok(params);
    const vested = vestedAmount(FOUNDER, params, TGE, at);
    const half = vested / 2n;
    const f = row(
      computeSupply(doc, { at, tge: TGE, distributed: { 'founder-team': half } }),
      'founder-team',
    );
    assert.equal(f.circulating, half);
    assert.equal(f.vestedEligible, vested);
    assert.equal(
      row(
        computeSupply(doc, { at, tge: TGE, distributed: { 'founder-team': vested } }),
        'founder-team',
      ).circulating,
      vested,
    );
  });

  it('rejects distribution beyond the vested amount, before launch, unknown ids and negatives', () => {
    assert.throws(
      () => computeSupply(doc, { at: TGE, tge: TGE, distributed: { 'founder-team': 1n } }),
      /exceeds vested 0/,
    );
    assert.throws(
      () => computeSupply(doc, { at: 0, tge: undefined, distributed: { treasury: 1n } }),
      /before launch/,
    );
    assert.throws(
      () => computeSupply(doc, { at: TGE, tge: TGE, distributed: { nope: 0n } }),
      /unknown allocation/,
    );
    assert.throws(
      () => computeSupply(doc, { at: TGE, tge: TGE, distributed: { treasury: -1n } }),
      /negative/,
    );
  });

  it('after the final date the founder allocation is fully vested yet only circulating once distributed', () => {
    const end = addMonthsUtc(TGE, 48);
    const f = row(computeSupply(doc, { at: end, tge: TGE }), 'founder-team');
    assert.equal(f.vestedEligible, FOUNDER);
    assert.equal(f.locked, 0n);
    assert.equal(f.circulating, 0n);
  });

  it('would only yield a number if every schedule were approved (guard against loosening)', () => {
    const fabricated = parseAllocationDocument(
      mutate(raw, (d) => {
        for (const a of d.allocations) {
          a.vesting = {
            type: 'none',
            status: 'approved',
            tgeUnlockPercent: '100',
          };
        }
        d.circulation.status = 'approved';
      }),
    );
    const r = computeSupply(fabricated, { at: TGE, tge: TGE, distributed: { treasury: 7n } });
    assert.equal(r.circulating, 7n);
    assert.equal(requireCirculating(r), 7n);
    assert.deepEqual(r.tbdAllocationIds, []);
  });

  it('every committed figure reconciles', () => {
    const r = computeSupply(doc, { at: TGE, tge: TGE });
    assert.equal(
      r.allocated,
      r.allocations.reduce((s, a) => s + a.allocated, 0n),
    );
    assert.equal(r.allocated, r.totalSupply);
  });
});
