'use strict';
/**
 * Warehouse Management System, Phase A — Putaway Engine verification.
 * Covers every PURE module (schema/normalize/compatibility/scoring/
 * fallbackRules/optimizer). The DB-backed engine.js (persistence, assignBin,
 * completeTask) is integration-level and covered by the manual API smoke test
 * in the plan's verification section, not here — same convention
 * tests/logistics-optimization.verify.js uses for service/logistics/
 * (it never requires logisticsEngine.js).
 *
 *   node tests/wms-putaway-engine.verify.js
 */
const assert = require('assert');

const schema = require('../service/warehouse/putaway/schema');
const { normalizePutawayRequest } = require('../service/warehouse/putaway/normalize');
const compat = require('../service/warehouse/putaway/compatibility');
const { rankCandidates } = require('../service/warehouse/putaway/scoring');
const { relaxAndRetry } = require('../service/warehouse/putaway/fallbackRules');
const optimizer = require('../service/warehouse/putaway/putawayOptimizer');

let pass = 0;
let fail = 0;
const failures = [];

function t(name, fn) {
    try {
        fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}
function section(title) { console.log(`\n${title}`); }

const WH = 'warehouse-1';
const ZONE_A = 'zone-a';
const ZONE_B = 'zone-b';

function bin(overrides = {}) {
    return {
        id: 'bin-default',
        warehouse_id: WH,
        zone_id: ZONE_A,
        bin_type: 'bin',
        status: 'active',
        capacity_units: 100,
        used_units: 0,
        metadata: {},
        ...overrides,
    };
}

// ── schema ────────────────────────────────────────────────────────────────
section('schema');
t('STRATEGY vocabulary is frozen and complete', () => {
    assert.ok(Object.isFrozen(schema.STRATEGY));
    assert.deepStrictEqual([...schema.VALID_STRATEGIES].sort(), ['abc', 'capacity_first', 'fefo', 'fifo'].sort());
});
t('normalizedCandidate() requires an id', () => {
    assert.throws(() => schema.normalizedCandidate({}));
});
t('normalizedCandidate() maps snake_case db fields', () => {
    const c = schema.normalizedCandidate(bin({ id: 'b1', used_units: 3 }));
    assert.strictEqual(c.id, 'b1');
    assert.strictEqual(c.usedUnits, 3);
    assert.strictEqual(c.warehouseId, WH);
});
t('putawayError() builds a PutawayError with a valid FAILURE_KIND', () => {
    const err = schema.putawayError(schema.FAILURE_KIND.NO_CANDIDATE, 'no bin');
    assert.ok(err instanceof schema.PutawayError);
    assert.strictEqual(err.kind, schema.FAILURE_KIND.NO_CANDIDATE);
});

// ── normalize ─────────────────────────────────────────────────────────────
section('normalize');
t('requires warehouseId', () => {
    assert.throws(() => normalizePutawayRequest({ quantity: 1 }), (err) => err.kind === schema.FAILURE_KIND.VALIDATION);
});
t('requires a positive quantity', () => {
    assert.throws(() => normalizePutawayRequest({ warehouseId: WH, quantity: 0 }), (err) => err.kind === schema.FAILURE_KIND.VALIDATION);
});
t('defaults strategy to FIFO', () => {
    const r = normalizePutawayRequest({ warehouseId: WH, quantity: 5 });
    assert.strictEqual(r.strategy, schema.STRATEGY.FIFO);
});
t('rejects an unknown strategy', () => {
    assert.throws(() => normalizePutawayRequest({ warehouseId: WH, quantity: 5, strategy: 'nope' }));
});
t('returns a frozen normalized request', () => {
    const r = normalizePutawayRequest({ warehouseId: WH, quantity: 5 });
    assert.ok(Object.isFrozen(r));
});

// ── compatibility ─────────────────────────────────────────────────────────
// compat.* pure functions operate on NORMALIZED candidates (camelCase) — the
// shape schema.normalizedCandidate() produces from a raw db row, never the
// raw snake_case bin() fixture directly.
section('compatibility');
const nc = (overrides) => schema.normalizedCandidate(bin(overrides));
t('hazardCompatible: non-hazardous request excludes a hazmat-restricted bin', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1 });
    assert.strictEqual(compat.hazardCompatible(nc({ hazard_class: 'flammable' }), req), false);
});
t('hazardCompatible: hazardous request requires an exact matching bin', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, hazardClass: 'flammable' });
    assert.strictEqual(compat.hazardCompatible(nc({ hazard_class: 'flammable' }), req), true);
    assert.strictEqual(compat.hazardCompatible(nc({ hazard_class: 'corrosive' }), req), false);
    assert.strictEqual(compat.hazardCompatible(nc({}), req), false);
});
t('temperatureCompatible: ambient default matches an unset bin zone', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1 });
    assert.strictEqual(compat.temperatureCompatible(nc({}), req), true);
    assert.strictEqual(compat.temperatureCompatible(nc({ temperature_zone: 'frozen' }), req), false);
});
t('capacityCompatible: rejects when free capacity is insufficient', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 5 });
    assert.strictEqual(compat.capacityCompatible(nc({ capacity_units: 10, used_units: 8 }), req), false);
    assert.strictEqual(compat.capacityCompatible(nc({ capacity_units: 10, used_units: 2 }), req), true);
});
t('capacityCompatible: rejects a non-active or non-leaf bin', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1 });
    assert.strictEqual(compat.capacityCompatible(nc({ status: 'blocked' }), req), false);
    assert.strictEqual(compat.capacityCompatible(nc({ bin_type: 'rack' }), req), false);
});
t('filterCompatible: zone hint narrows the candidate set', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, zoneId: ZONE_A });
    const candidates = [bin({ id: 'b1', zone_id: ZONE_A }), bin({ id: 'b2', zone_id: ZONE_B })].map(schema.normalizedCandidate);
    const result = compat.filterCompatible(candidates, req);
    assert.deepStrictEqual(result.map((c) => c.id), ['b1']);
});

// ── scoring ───────────────────────────────────────────────────────────────
section('scoring');
t('capacity_first strategy ranks the bin landing inside the target utilization band first', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 70, strategy: 'capacity_first' });
    const candidates = [
        schema.normalizedCandidate(bin({ id: 'nearly-empty', capacity_units: 1000, used_units: 0 })), // 7% full -> outside band
        schema.normalizedCandidate(bin({ id: 'good-fit', capacity_units: 100, used_units: 5 })),       // 75% full -> inside [60,90] band
    ].map((c) => c);
    const ranked = rankCandidates(candidates, req);
    assert.strictEqual(ranked[0].candidate.id, 'good-fit');
    assert.strictEqual(ranked[0].scoreBreakdown.capacityFit, 0);
});
t('same-lot consolidation wins regardless of strategy', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, lotNumber: 'LOT-42' });
    const candidates = [
        schema.normalizedCandidate(bin({ id: 'other-lot', metadata: { lastLotNumber: 'LOT-99' } })),
        schema.normalizedCandidate(bin({ id: 'same-lot', metadata: { lastLotNumber: 'LOT-42' } })),
    ];
    const ranked = rankCandidates(candidates, req);
    assert.strictEqual(ranked[0].candidate.id, 'same-lot');
    assert.ok(ranked[0].reasonCodes.includes('same_lot_consolidation'));
});
t('FIFO strategy prefers the bin with the older turnover history', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, strategy: 'fifo' });
    const candidates = [
        schema.normalizedCandidate(bin({ id: 'newer', metadata: { oldestReceiptAt: '2026-06-01' } })),
        schema.normalizedCandidate(bin({ id: 'older', metadata: { oldestReceiptAt: '2026-01-01' } })),
    ];
    const ranked = rankCandidates(candidates, req);
    assert.strictEqual(ranked[0].candidate.id, 'older');
});
t('FEFO strategy prefers the bin whose stock expires soonest', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, strategy: 'fefo' });
    const candidates = [
        schema.normalizedCandidate(bin({ id: 'expires-later', metadata: { nearestExpiryAt: '2026-12-01' } })),
        schema.normalizedCandidate(bin({ id: 'expires-soon', metadata: { nearestExpiryAt: '2026-07-01' } })),
    ];
    const ranked = rankCandidates(candidates, req);
    assert.strictEqual(ranked[0].candidate.id, 'expires-soon');
});
t('ABC strategy prefers a bin already classified for the requested tier', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, strategy: 'abc', abcClass: 'A' });
    const candidates = [
        schema.normalizedCandidate(bin({ id: 'class-b', abc_class: 'B' })),
        schema.normalizedCandidate(bin({ id: 'class-a', abc_class: 'A' })),
    ];
    const ranked = rankCandidates(candidates, req);
    assert.strictEqual(ranked[0].candidate.id, 'class-a');
});

// ── fallbackRules ─────────────────────────────────────────────────────────
section('fallbackRules');
t('widens the search to the whole warehouse when the zone hint has no compatible bin', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, zoneId: ZONE_A });
    const candidates = [schema.normalizedCandidate(bin({ id: 'b-other-zone', zone_id: ZONE_B }))];
    const { compatible, warnings } = relaxAndRetry(candidates, req);
    assert.strictEqual(compatible.length, 1);
    assert.ok(warnings[0].includes('widened search'));
});
t('relaxes ABC stratification when no bin matches the requested tier', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, abcClass: 'A' });
    const candidates = [schema.normalizedCandidate(bin({ id: 'class-c', abc_class: 'C' }))];
    const { compatible, warnings } = relaxAndRetry(candidates, req);
    assert.strictEqual(compatible.length, 1);
    assert.ok(warnings.some((w) => w.includes('ABC')));
});
t('returns empty + a terminal warning when nothing is safe to relax further', () => {
    const req = normalizePutawayRequest({ warehouseId: WH, quantity: 1, hazardClass: 'flammable' });
    const candidates = [schema.normalizedCandidate(bin({ id: 'no-hazmat' }))]; // never hazard-compatible
    const { compatible, warnings } = relaxAndRetry(candidates, req);
    assert.strictEqual(compatible.length, 0);
    assert.ok(warnings[warnings.length - 1].includes('hazard'));
});

// ── optimizer (end-to-end, still fully pure) ───────────────────────────────
section('optimizer');
t('happy path: suggests the best-fit compatible bin', () => {
    const rawCandidates = [
        bin({ id: 'too-empty', capacity_units: 1000, used_units: 0 }),
        bin({ id: 'good-fit', capacity_units: 100, used_units: 5 }),
    ];
    const result = optimizer.suggest({ warehouseId: WH, quantity: 70, strategy: 'capacity_first' }, rawCandidates);
    assert.strictEqual(result.top.binId, 'good-fit');
    assert.ok(Object.isFrozen(result));
});
t('suggestions are sorted best (lowest score) first', () => {
    const rawCandidates = [
        bin({ id: 'worse', capacity_units: 1000, used_units: 0 }),
        bin({ id: 'better', capacity_units: 100, used_units: 5 }),
    ];
    const result = optimizer.suggest({ warehouseId: WH, quantity: 70, strategy: 'capacity_first' }, rawCandidates);
    assert.ok(result.suggestions[0].score <= result.suggestions[1].score);
});
t('throws NO_CANDIDATE when nothing is safe to place', () => {
    const rawCandidates = [bin({ id: 'no-hazmat' })];
    assert.throws(
        () => optimizer.suggest({ warehouseId: WH, quantity: 1, hazardClass: 'flammable' }, rawCandidates),
        (err) => err.kind === schema.FAILURE_KIND.NO_CANDIDATE,
    );
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Putaway engine — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);
