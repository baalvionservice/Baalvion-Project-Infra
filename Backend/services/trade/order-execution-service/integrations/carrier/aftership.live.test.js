'use strict';
/**
 * LIVE AfterShip smoke test — gated on AFTERSHIP_API_KEY.
 * Skipped by default (no key in CI). When a real key is present it hits the real
 * AfterShip v4 API to confirm the adapter wiring end-to-end. It still asserts the
 * fail-open contract: track() resolves to a valid status and never throws.
 *
 * Provide AFTERSHIP_LIVE_TRACKING_NUMBER (+ optional AFTERSHIP_LIVE_CARRIER slug)
 * to exercise a real shipment; otherwise a synthetic number is registered.
 */
const assert = require('assert');
const { TRACKING_STATUS } = require('./contract');
const { createRealCarrierProvider } = require('./realAdapter');

const gate = process.env.AFTERSHIP_API_KEY ? describe : describe.skip;
const VALID = new Set(Object.values(TRACKING_STATUS));

gate('carrier/aftership LIVE', () => {
    test('track() returns a valid status and never throws', async () => {
        const provider = createRealCarrierProvider(); // reads process.env
        const trackingNumber = process.env.AFTERSHIP_LIVE_TRACKING_NUMBER || `GTI-LIVE-${Date.now()}`;
        const carrier = process.env.AFTERSHIP_LIVE_CARRIER; // optional slug

        let res;
        let threw = false;
        try { res = await provider.track({ trackingNumber, carrier }); }
        catch { threw = true; }

        assert.strictEqual(threw, false, 'track must never throw (fail-open)');
        assert.ok(VALID.has(res.status), `invalid status ${res.status}`);
        assert.strictEqual(typeof res.degraded, 'boolean');
        assert.ok(Array.isArray(res.events));
    }, 20000);
});
