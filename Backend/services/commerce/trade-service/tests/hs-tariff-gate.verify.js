'use strict';
/**
 * The HS database holds hand-entered sample duty/VAT figures. In production they must
 * never become a duty or landed-cost number, in the estimator or in a code lookup.
 *
 *   node tests/hs-tariff-gate.verify.js
 */
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-only-secret-for-this-verify-script';
const assert = require('assert');

let pass = 0;
let fail = 0;
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); } catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const withEnv = (env, fn) => {
    const saved = { NODE_ENV: process.env.NODE_ENV, HS_TARIFF_DATA: process.env.HS_TARIFF_DATA };
    try {
        for (const [k, v] of Object.entries(env)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
        return fn();
    } finally {
        for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    }
};

const hsDatabase = require('../service/hscode/hsDatabase');
const duty = require('../service/hscode/duty');
const engine = require('../service/hscode/hsEngine');
const CODE = hsDatabase.all()[0].hs_code;
const COUNTRY = Object.keys(hsDatabase.all()[0].tariffs)[0];
const ask = () => duty.estimateDuty({ hsCode: CODE, country: COUNTRY, customsValue: 10000, currency: 'USD' });

console.log('Production gate');
t('outside production the sample rates still work (development and tests)', () => {
    withEnv({ NODE_ENV: 'test', HS_TARIFF_DATA: undefined }, () => {
        const r = ask();
        assert.strictEqual(r.available, true);
        assert.ok(r.duty_rate >= 0 && r.total_landed_cost > 0);
    });
});
t('in production no duty estimate is given, and it says why', () => {
    withEnv({ NODE_ENV: 'production', HS_TARIFF_DATA: undefined }, () => {
        const r = ask();
        assert.strictEqual(r.available, false);
        assert.match(r.reason, /verified tariff rates are not loaded/);
        assert.strictEqual(r.duty_amount, undefined);
        assert.strictEqual(r.total_landed_cost, undefined);
    });
});
t('in production a code lookup withholds the rates but keeps the national code', () => {
    withEnv({ NODE_ENV: 'production', HS_TARIFF_DATA: undefined }, () => {
        const r = engine.lookup({ hsCode: CODE, country: COUNTRY, customsValue: 10000 });
        assert.strictEqual(r.tariff.duty_rate, null);
        assert.strictEqual(r.tariff.vat_rate, null);
        assert.strictEqual(r.tariff.rates_verified, false);
        assert.ok(r.tariff.national_code);
        assert.strictEqual(r.duty_estimate.available, false);
    });
});
t('production serves rates again only when the operator declares verified data', () => {
    withEnv({ NODE_ENV: 'production', HS_TARIFF_DATA: 'verified' }, () => {
        assert.strictEqual(ask().available, true);
        assert.strictEqual(engine.lookup({ hsCode: CODE, country: COUNTRY }).tariff.rates_verified, true);
    });
});
t('any other value does not unlock it', () => {
    withEnv({ NODE_ENV: 'production', HS_TARIFF_DATA: 'true' }, () => assert.strictEqual(ask().available, false));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
