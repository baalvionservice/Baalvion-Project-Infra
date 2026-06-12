'use strict';
/**
 * Reusable carrier-tracking conformance suite. Asserts the FAIL-OPEN posture:
 * provider unavailability returns a degraded result, it never blocks.
 */
const assert = require('assert');
const { TRACKING_STATUS } = require('./contract');
const { createMockCarrierProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID = new Set(Object.values(TRACKING_STATUS));

/**
 * @param {() => import('./contract').CarrierProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`Carrier contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            assert.strictEqual(typeof a.track, 'function');
        });

        test('track returns a valid status + degraded flag, or fails (scaffold)', async () => {
            const a = adapterFactory();
            let res;
            try {
                res = await a.track({ trackingNumber: 'TRK-1', carrier: 'MAEU' });
            } catch (err) {
                assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                return;
            }
            assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
            assert.strictEqual(typeof res.degraded, 'boolean');
            assert.ok(Array.isArray(res.events));
        });

        if (!productionSafe) {
            test('FAIL-OPEN: provider unavailability returns degraded, does not throw', async () => {
                const a = adapterFactory();
                const res = await a.track({ trackingNumber: 'down-test-1' });
                assert.strictEqual(res.degraded, true, 'unavailable provider must degrade, not block');
                assert.strictEqual(res.status, TRACKING_STATUS.UNKNOWN);
            });
        }
    });
}

module.exports = { runConformanceSuite };

if (typeof describe === 'function') {
    runConformanceSuite(() => createMockCarrierProvider(), { productionSafe: false });
}
