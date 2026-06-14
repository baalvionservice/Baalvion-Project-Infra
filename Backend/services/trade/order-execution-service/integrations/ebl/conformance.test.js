'use strict';
/**
 * Reusable eB/L conformance suite. Asserts the LEGAL GUARD: a non-production
 * adapter MUST refuse to issue or transfer title.
 */
const assert = require('assert');
const { EBL_STATUS } = require('./contract');
const { createMockEblProvider } = require('./mockAdapter');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const VALID = new Set(Object.values(EBL_STATUS));

/**
 * @param {() => import('./contract').EblProvider} adapterFactory
 * @param {{ productionSafe: boolean }} opts
 */
function runConformanceSuite(adapterFactory, { productionSafe }) {
    describe(`eB/L contract conformance (productionSafe=${productionSafe})`, () => {
        test('exposes the required interface', () => {
            const a = adapterFactory();
            assert.strictEqual(a.IS_PRODUCTION_SAFE, productionSafe);
            for (const m of ['issue', 'transfer', 'getStatus']) {
                assert.strictEqual(typeof a[m], 'function', `missing ${m}`);
            }
        });

        if (!productionSafe) {
            test('non-production adapter MUST refuse to issue title', async () => {
                const a = adapterFactory();
                await assert.rejects(
                    () => a.issue(issueReq('ebl-1')),
                    (err) => /NOT LEGALLY VALID|INTEGRATION_REQUIRED|not configured/i.test(String(err.message)),
                    'issue must throw on a non-production adapter'
                );
            });

            test('non-production adapter MUST refuse to transfer title', async () => {
                const a = adapterFactory();
                await assert.rejects(
                    () => a.transfer({ id: 'x', toHolderId: 'y', idempotencyKey: 'k' }),
                    (err) => /NOT LEGALLY VALID|INTEGRATION_REQUIRED|not configured/i.test(String(err.message)),
                    'transfer must throw on a non-production adapter'
                );
            });
        } else {
            test('production status enum is honored on getStatus', async () => {
                const a = adapterFactory();
                let res;
                try {
                    res = await a.getStatus('some-id');
                } catch (err) {
                    assert.ok(err instanceof IntegrationRequiredError, `unexpected error: ${err}`);
                    return;
                }
                assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
            });
        }
    });
}

function issueReq(idempotencyKey) {
    return {
        idempotencyKey,
        shipperId: 's1',
        consigneeId: 'c1',
        carrierId: 'ca1',
        portOfLoading: 'CNSHA',
        portOfDischarge: 'DEHAM',
        cargo: { description: 'Electronics', weightKg: 12000 },
    };
}

module.exports = { runConformanceSuite };

if (typeof describe === 'function') {
    runConformanceSuite(() => createMockEblProvider(), { productionSafe: false });
}
