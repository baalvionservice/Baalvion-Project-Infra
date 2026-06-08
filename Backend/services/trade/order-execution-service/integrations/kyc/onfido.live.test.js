'use strict';
/**
 * LIVE Onfido smoke test — hits the REAL Onfido API. SKIPPED unless
 * ONFIDO_API_TOKEN is present in the environment, so it is inert in CI/dev.
 *
 * To run against the sandbox:
 *   ONFIDO_API_TOKEN=api_sandbox.xxx ONFIDO_REGION=eu \
 *   ONFIDO_WORKFLOW_ID=<wf-id> npx jest integrations/kyc/onfido.live
 *
 * Creates a real applicant + workflow run, then resolves it. It asserts only the
 * contract shape (id present, status is a valid KYC_STATUS) — it never asserts
 * APPROVED, because a fresh async run is normally PENDING (fail-closed).
 */
const assert = require('assert');
const { KYC_STATUS } = require('./contract');
const { createRealKycProvider } = require('./realAdapter');

const gate = process.env.ONFIDO_API_TOKEN ? describe : describe.skip;
const VALID = new Set(Object.values(KYC_STATUS));

gate('Onfido LIVE smoke (sandbox token required)', () => {
    test('startVerification creates a real run and getResult resolves a valid status', async () => {
        const a = createRealKycProvider(); // reads process.env
        const start = await a.startVerification({
            idempotencyKey: `live-${Date.now()}`,
            type: 'INDIVIDUAL',
            fullName: 'Jane Doe',
            country: 'GB',
        });
        assert.ok(start.id, 'expected a verification id');
        assert.ok(VALID.has(start.status), `invalid start status ${start.status}`);

        const got = await a.getResult(start.id, { idempotencyKey: start.idempotencyKey });
        assert.strictEqual(got.id, start.id);
        assert.ok(VALID.has(got.status), `invalid getResult status ${got.status}`);
    }, 30000);
});
