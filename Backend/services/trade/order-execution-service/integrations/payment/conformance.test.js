'use strict';
/**
 * Reusable PSP conformance suite. ANY payment adapter (mock or future real one)
 * must pass this. Exports `runConformanceSuite` so a real adapter's own test can
 * reuse it. When run directly under Jest it exercises the mock adapter.
 */
const assert = require('assert');
const { PAYMENT_STATUS } = require('./contract');
const { createMockPaymentProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID_STATUSES = new Set(Object.values(PAYMENT_STATUS));

/**
 * @param {() => import('./contract').PaymentProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`PSP contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(typeof a.name, 'string');
            assert.strictEqual(typeof a.IS_PRODUCTION_SAFE, 'boolean');
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            for (const m of ['initiate', 'getStatus', 'cancel']) {
                assert.strictEqual(typeof a[m], 'function', `missing method ${m}`);
            }
        });

        if (!productionSafe) {
            test('non-production adapter is clearly flagged', () => {
                assert.strictEqual(adapterFactory().IS_PRODUCTION_SAFE, false);
            });
        }

        test('initiate returns a contract-shaped result with a valid status', async () => {
            const a = adapterFactory();
            const req = baseReq('idem-1');
            let res;
            try {
                res = await a.initiate(req);
            } catch (err) {
                // A scaffold real adapter is allowed to signal not-configured.
                assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                return;
            }
            assert.ok(res.id, 'result.id required');
            assert.strictEqual(res.idempotencyKey, 'idem-1');
            assert.ok(VALID_STATUSES.has(res.status), `invalid status ${res.status}`);
            assert.strictEqual(res.currency, req.currency);
        });

        test('initiate is idempotent on idempotencyKey', async () => {
            const a = adapterFactory();
            let first;
            try {
                first = await a.initiate(baseReq('idem-dup'));
            } catch (err) {
                assert.ok(err instanceof IntegrationRequiredError);
                return; // scaffold — nothing to compare
            }
            const second = await a.initiate(baseReq('idem-dup'));
            assert.strictEqual(second.id, first.id, 'replay must return the same payment, no double-spend');
            assert.strictEqual(second.status, first.status);
        });
    });
}

function baseReq(idempotencyKey) {
    return {
        idempotencyKey,
        sourceAccountId: 'acct-src',
        destinationAccountId: 'acct-dst',
        amount: 1917.5,
        currency: 'EUR',
        paymentScheme: 'INTERNAL',
    };
}

module.exports = { runConformanceSuite };

// Self-run against the mock when executed by the test runner.
if (typeof describe === 'function') {
    runConformanceSuite(() => createMockPaymentProvider(), { productionSafe: false });
}
