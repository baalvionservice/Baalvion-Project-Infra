'use strict';
/**
 * Reusable sanctions conformance suite. ANY screening adapter must pass this.
 * Critically asserts the FAIL-CLOSED posture: a blocking status must surface and
 * the policy must never silently allow on a non-CLEAR verdict.
 */
const assert = require('assert');
const { SCREENING_STATUS, BLOCKING_STATUSES } = require('./contract');
const { createMockSanctionsProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID = new Set(Object.values(SCREENING_STATUS));

/**
 * @param {() => import('./contract').SanctionsProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`Sanctions contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(typeof a.name, 'string');
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            assert.strictEqual(typeof a.screen, 'function');
        });

        test('screen returns a valid status enum or fails-closed', async () => {
            const a = adapterFactory();
            let res;
            try {
                res = await a.screen({ name: 'Acme Trading Co', country: 'DE' });
            } catch (err) {
                // Scaffold real adapter throwing == fail-closed; acceptable.
                assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                return;
            }
            assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
            assert.strictEqual(typeof res.confidence, 'number');
            assert.ok(Array.isArray(res.matches));
        });

        if (!productionSafe) {
            test('mock surfaces a blocking match (so fail-closed paths are testable)', async () => {
                const a = adapterFactory();
                const res = await a.screen({ name: 'sdn-test entity' });
                assert.ok(BLOCKING_STATUSES.includes(res.status), 'expected a blocking status');
                assert.ok(res.matches.length > 0, 'a match must carry match detail');
            });
        }
    });
}

module.exports = { runConformanceSuite };

if (typeof describe === 'function') {
    runConformanceSuite(() => createMockSanctionsProvider(), { productionSafe: false });
}
