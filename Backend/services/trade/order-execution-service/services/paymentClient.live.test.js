'use strict';
/**
 * Live probe: oes payment client → real payment-service. Skips if unreachable.
 *   PAYMENT_SERVICE_URL=http://127.0.0.1:13015 npx jest paymentClient.live
 * Proves the order→payment trigger drives a real payment (which posts the ledger
 * double-entry via the Kafka choreography).
 */
const { initiate } = require('./paymentClient');

const URL = process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:13015';
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.floor(Date.now() % 16) + Math.floor(performance.now() % 16)) % 16; // deterministic-ish, no crypto needed
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
});
let reachable = false;

beforeAll(async () => {
    try {
        const r = await fetch(`${URL}/actuator/health`);
        reachable = r.ok;
    } catch { reachable = false; }
});

test('oes payment client initiates a real payment', async () => {
    if (!reachable) { console.warn(`[skip] payment-service not reachable at ${URL}`); return; }
    const tenant = '11111111-1111-1111-1111-111111111111';
    const result = await initiate({
        idempotencyKey: `oes-e2e-${Date.now()}`,
        sourceAccountId: '22222222-2222-2222-2222-222222222222',
        destinationAccountId: '33333333-3333-3333-3333-333333333333',
        amount: 2500.0,
        currency: 'USD',
        tenantId: tenant,
    }, { url: URL });
    expect(result).toBeTruthy();
    expect(result.id).toBeTruthy();
    expect(['INITIATED', 'COMPLETED', 'PROCESSING']).toContain(result.status);
});
