'use strict';
/**
 * Reusable customs conformance suite. Asserts the LEGAL GUARD: a non-production
 * adapter MUST refuse to file (submitDeclaration throws), and the status enum is
 * honored.
 */
const assert = require('assert');
const { DECLARATION_STATUS } = require('./contract');
const { createMockCustomsProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID = new Set(Object.values(DECLARATION_STATUS));

/**
 * @param {() => import('./contract').CustomsProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`Customs contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            for (const m of ['validateDeclaration', 'submitDeclaration', 'getStatus']) {
                assert.strictEqual(typeof a[m], 'function', `missing ${m}`);
            }
        });

        test('validateDeclaration yields a valid status or fails-closed', async () => {
            const a = adapterFactory();
            let res;
            try {
                res = await a.validateDeclaration(req('cus-1'));
            } catch (err) {
                assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                return;
            }
            assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
        });

        if (!productionSafe) {
            test('non-production adapter MUST refuse to file a declaration', async () => {
                const a = adapterFactory();
                await assert.rejects(
                    () => a.submitDeclaration(req('cus-file')),
                    (err) => /NOT LEGALLY VALID|INTEGRATION_REQUIRED|not configured/i.test(String(err.message)),
                    'submitDeclaration must throw on a non-production adapter'
                );
            });
        }
    });
}

function req(idempotencyKey) {
    return {
        idempotencyKey,
        regime: 'IMPORT',
        declarantId: 'declarant-1',
        destinationCountry: 'DE',
        portOfEntry: 'DEHAM',
        lines: [{ hsCode: '8471.30', description: 'Laptop', quantity: 10, value: 5000, currency: 'EUR', originCountry: 'CN' }],
    };
}

module.exports = { runConformanceSuite };

if (typeof describe === 'function') {
    runConformanceSuite(() => createMockCustomsProvider(), { productionSafe: false });
}
