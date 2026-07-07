'use strict';
/**
 * Freight Management (Phase 3, Prompt 2) — standalone verification harness.
 *
 * jest is broken repo-wide (jest-runtime clearMocksOnScope skew — see
 * freight-marketplace.verify.js), so this mirrors that harness's tiny built-in
 * runner. Covers the PURE / deterministic pieces added in this phase: the rate
 * engine's rule selection + application, comparison scoring, the generic carrier
 * connector (any-carrier-dynamically fallback), and the route optimizer's new
 * `green` strategy. No DB, no network.
 *
 *   node tests/freight-management.verify.js
 */
const assert = require('assert');

const rateEngine = require('../service/freight/rateEngine');
const scoring = require('../service/freight/comparisonScoring');
const registry = require('../service/freight/connectors');
const { GenericConnector } = require('../service/freight/connectors/genericConnector');
const optimizer = require('../service/logistics/optimizer');
const logisticsScoring = require('../service/logistics/scoring');
const { STRATEGY, normalizedRoute } = require('../service/logistics/schema');

let pass = 0; let fail = 0; const failures = [];
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

(async () => {
    // ── rate engine ────────────────────────────────────────────────────────────
    section('rate engine');
    await t('ruleApplies matches on lane/mode/weight and rejects out-of-range weight', () => {
        const laneRule = { active: true, origin_code: 'CNSHA', destination_code: 'NLRTM', mode: 'ocean', min_weight_kg: 500 };
        assert.strictEqual(rateEngine.ruleApplies(laneRule, { originCode: 'CNSHA', destinationCode: 'NLRTM', mode: 'ocean', weightKg: 1000 }), true);
        assert.strictEqual(rateEngine.ruleApplies(laneRule, { originCode: 'CNSHA', destinationCode: 'NLRTM', mode: 'ocean', weightKg: 100 }), false);
        assert.strictEqual(rateEngine.ruleApplies(laneRule, { originCode: 'USNYC', destinationCode: 'NLRTM', mode: 'ocean', weightKg: 1000 }), false);
    });
    await t('selectApplicableRules sorts by ascending priority', () => {
        const rules = [
            { id: 'b', active: true, priority: 20 },
            { id: 'a', active: true, priority: 10 },
            { id: 'c', active: false, priority: 5 },
        ];
        const applicable = rateEngine.selectApplicableRules(rules, {});
        assert.deepStrictEqual(applicable.map((r) => r.id), ['a', 'b']);
    });
    await t('applyRules stacks flat/percent/per_kg adjustments in order', () => {
        const rules = [
            { id: 'r1', rule_type: 'lane', adjustment_type: 'percent', adjustment_value: 10 },
            { id: 'r2', rule_type: 'peak', adjustment_type: 'flat', adjustment_value: 50 },
            { id: 'r3', rule_type: 'discount', adjustment_type: 'per_kg', adjustment_value: -0.05 },
        ];
        const result = rateEngine.applyRules(1000, rules, { weightKg: 1000 });
        // 1000 + 10% (100) + 50 flat - (0.05*1000=50) => 1100
        assert.strictEqual(result.finalRate, 1100);
        assert.strictEqual(result.appliedRules.length, 3);
    });
    await t('computeRate filters inapplicable rules before applying', () => {
        const rules = [
            { id: 'match', active: true, mode: 'ocean', adjustment_type: 'flat', adjustment_value: 20 },
            { id: 'nomatch', active: true, mode: 'air', adjustment_type: 'flat', adjustment_value: 999 },
        ];
        const result = rateEngine.computeRate({ baseRate: 100, rules, mode: 'ocean' });
        assert.strictEqual(result.finalRate, 120);
    });

    // ── comparison scoring ─────────────────────────────────────────────────────
    section('comparison scoring');
    await t('scoreAndRank ranks cheaper/faster/lower-carbon options higher', () => {
        const items = [
            { carrierId: 'A', totalAmount: 100, transitDays: 10, carbonEstimateKg: 50 },
            { carrierId: 'B', totalAmount: 200, transitDays: 5, carbonEstimateKg: 20 },
        ];
        const ranked = scoring.scoreAndRank(items, {});
        assert.strictEqual(ranked.length, 2);
        assert.strictEqual(ranked[0].rank, 1);
        ranked.forEach((r) => assert.ok(r.overallScore >= 0 && r.overallScore <= 1));
    });
    await t('scoreAndRank uses carrier metadata for reliability/insurance/tracking scores', () => {
        const items = [{ carrierId: 'A', totalAmount: 100, transitDays: 5, carbonEstimateKg: 10 }];
        const carriersById = { A: { reliability_score: 95, insurance: { coverage_amount: 100000 }, tracking_api_supported: true, performance_score: 90 } };
        const ranked = scoring.scoreAndRank(items, carriersById);
        assert.strictEqual(ranked[0].reliabilityScore, 0.95);
        assert.strictEqual(ranked[0].insuranceScore, 1);
        assert.strictEqual(ranked[0].trackingQualityScore, 1);
    });
    await t('scoreAndRank returns empty for no items', () => {
        assert.deepStrictEqual(scoring.scoreAndRank([], {}), []);
    });

    // ── generic connector (any carrier dynamically) ───────────────────────────
    section('generic connector');
    await t('GenericConnector prices a dynamically registered carrier with no coded connector', async () => {
        const conn = new GenericConnector({
            carrier: 'msc', carrierName: 'MSC', modes: ['ocean'], reliability: 88,
            rateCardsByMode: { ocean: { service: 'FCL', base_fee: 500, rate_per_kg: 0.8, transit: 25 } },
        });
        const request = {
            origin: { country: 'CN' }, destination: { country: 'US' }, mode: 'ocean',
            pieces: [{ weight_kg: 1000, length_cm: 100, width_cm: 100, height_cm: 100 }],
        };
        const { quote } = await conn.quote(request, { now: new Date('2026-07-06T00:00:00Z') });
        assert.strictEqual(quote.carrier, 'msc');
        assert.strictEqual(quote.mode, 'ocean');
        assert.ok(quote.amount > 0);
        assert.strictEqual(quote.reliability, 88);
    });
    await t('buildConnectorForCarrier falls back to GenericConnector for an unmatched connector_key', () => {
        const conn = registry.buildConnectorForCarrier({ id: 'x', code: 'dsv', name: 'DSV', connector_key: null, modes: ['road'], reliability_score: 80 }, { services: [] });
        assert.ok(conn instanceof GenericConnector);
        assert.strictEqual(conn.carrier, 'dsv');
    });
    await t('buildConnectorForCarrier uses the coded connector when connector_key matches', () => {
        const conn = registry.buildConnectorForCarrier({ id: 'y', code: 'dhl-row', connector_key: 'dhl', modes: ['express'] }, {});
        assert.strictEqual(conn.carrier, 'dhl');
        assert.ok(!(conn instanceof GenericConnector));
    });

    // ── route optimizer: green strategy ────────────────────────────────────────
    section('route optimizer — green strategy');
    await t('optimize({ strategy: green }) returns the lowest-co2 route as primary/recommended', () => {
        const result = optimizer.optimize(
            { origin: { country: 'CN', city: 'Shanghai' }, destination: { country: 'NL', city: 'Rotterdam' }, weight_kg: 5000 },
            { strategy: STRATEGY.GREEN },
        );
        assert.strictEqual(result.strategy, 'green');
        assert.ok(result.green);
        assert.strictEqual(result.recommended.id, result.green.id);
        // every route in the primary list must be sorted by co2_kg ascending
        for (let i = 1; i < result.routes.length; i += 1) {
            assert.ok(result.routes[i].co2_kg >= result.routes[i - 1].co2_kg);
        }
    });
    await t('logistics scoring.rank() exposes byGreen + a green pick', () => {
        const routes = [
            normalizedRoute([{ from: 'A', to: 'B', mode: 'ocean', cost: 100, transit_days: 10, co2_kg: 50 }], { id: 'r1' }),
            normalizedRoute([{ from: 'A', to: 'B', mode: 'air', cost: 300, transit_days: 2, co2_kg: 10 }], { id: 'r2' }),
        ];
        const ranked = logisticsScoring.rank(routes, { strategy: STRATEGY.GREEN });
        assert.strictEqual(ranked.green.id, 'r2');
        assert.strictEqual(ranked.recommended.id, 'r2');
    });

    // ── summary ─────────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`freight-management.verify — ${pass} passed, ${fail} failed (${pass + fail} total)`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
    process.exit(0);
})();
