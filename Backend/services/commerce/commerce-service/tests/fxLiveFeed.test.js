'use strict';
// FX live-feed fetch/parse — fetchLiveSnapshot() against a STUBBED global.fetch (no real network).
// Verifies it parses the keyless open.er-api.com shape and the exchangerate.host shape, anchors USD
// to 1, rejects a non-USD base / failure flags / bad responses, and never throws. The live-feed
// ENABLE gate (FX_LIVE_FEED) and graceful static fallback are covered in fxRateProvider.test.js.
process.env.FX_LIVE_FEED = 'false'; // fetchLiveSnapshot itself is not gated on the enable flag

const { test, afterEach } = require('node:test');
const assert = require('node:assert');

const fx = require('../service/fxRateProvider');

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

function stubFetch(body, { ok = true } = {}) {
    global.fetch = async () => ({ ok, json: async () => body });
}

test('parses the keyless open.er-api.com shape ({ result:"success", rates }) and anchors USD=1', async () => {
    stubFetch({ result: 'success', base_code: 'USD', rates: { USD: 1, GBP: 0.79, AED: 3.67 } });
    const snap = await fx.fetchLiveSnapshot();
    assert.equal(snap.USD, 1);
    assert.equal(snap.GBP, 0.79);
    assert.equal(snap.AED, 3.67);
});

test('parses the exchangerate.host shape ({ success:true, base:"USD", rates }) and forces USD=1', async () => {
    stubFetch({ success: true, base: 'USD', rates: { GBP: 0.8, INR: 83 } }); // no USD key in body
    const snap = await fx.fetchLiveSnapshot();
    assert.equal(snap.USD, 1, 'USD is anchored to 1 even when absent from the provider payload');
    assert.equal(snap.GBP, 0.8);
});

test('rejects a non-USD base (cannot be used by the USD-base conversion)', async () => {
    stubFetch({ success: true, base: 'EUR', rates: { USD: 1.1, GBP: 0.86 } });
    assert.equal(await fx.fetchLiveSnapshot(), null);
});

test('rejects explicit provider failure flags', async () => {
    stubFetch({ success: false, error: { code: 101 } });
    assert.equal(await fx.fetchLiveSnapshot(), null);
    stubFetch({ result: 'error', 'error-type': 'invalid-key' });
    assert.equal(await fx.fetchLiveSnapshot(), null);
});

test('rejects a non-OK HTTP response and a body with no rates', async () => {
    stubFetch({ rates: { GBP: 0.79 } }, { ok: false });
    assert.equal(await fx.fetchLiveSnapshot(), null);
    stubFetch({ result: 'success' }); // no rates
    assert.equal(await fx.fetchLiveSnapshot(), null);
});

test('never throws on a fetch error — returns null for static fallback', async () => {
    global.fetch = async () => { throw new Error('network down'); };
    assert.equal(await fx.fetchLiveSnapshot(), null);
});

test('normalizeRates of a fetched snapshot drops junk and keeps positive numbers', async () => {
    stubFetch({ result: 'success', base: 'USD', rates: { USD: 1, GBP: 0.79, BAD: -1, NOPE: 'x' } });
    const snap = await fx.fetchLiveSnapshot();
    assert.deepEqual(fx.normalizeRates(snap), { USD: 1, GBP: 0.79 });
});
