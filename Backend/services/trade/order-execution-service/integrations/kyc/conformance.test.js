'use strict';
/** Reusable KYC/IDV conformance suite. */
const assert = require('assert');
const { KYC_STATUS } = require('./contract');
const { createMockKycProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID = new Set(Object.values(KYC_STATUS));

/**
 * @param {() => import('./contract').KycProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`KYC contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(typeof a.name, 'string');
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            for (const m of ['startVerification', 'getResult']) {
                assert.strictEqual(typeof a[m], 'function', `missing ${m}`);
            }
        });

        test('startVerification returns a valid status or fails-closed', async () => {
            const a = adapterFactory();
            let res;
            try {
                res = await a.startVerification(subject('kyc-1', 'Acme Ltd'));
            } catch (err) {
                assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                return;
            }
            assert.ok(res.id);
            assert.strictEqual(res.idempotencyKey, 'kyc-1');
            assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
        });

        test('startVerification is idempotent on idempotencyKey', async () => {
            const a = adapterFactory();
            let first;
            try {
                first = await a.startVerification(subject('kyc-dup', 'Acme Ltd'));
            } catch (err) {
                assert.ok(err instanceof IntegrationRequiredError);
                return;
            }
            const second = await a.startVerification(subject('kyc-dup', 'Acme Ltd'));
            assert.strictEqual(second.id, first.id, 'replay must not create a duplicate KYC check');
        });
    });
}

function subject(idempotencyKey, legalName) {
    return { idempotencyKey, type: 'BUSINESS', legalName, country: 'GB' };
}

module.exports = { runConformanceSuite };

if (typeof describe === 'function') {
    runConformanceSuite(() => createMockKycProvider(), { productionSafe: false });
}
