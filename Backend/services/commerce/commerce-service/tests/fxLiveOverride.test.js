'use strict';
// FX live-feed OVERRIDE — with FX_LIVE_FEED=true, a fresh in-memo snapshot overrides the static
// rate; a stale/missing snapshot falls back to static. Run STANDALONE (`node --test
// tests/fxLiveOverride.test.js`) so the enable flag is set before the module loads. cacheService is
// stubbed (no real Redis); fetch is stubbed (no real network).
process.env.FX_LIVE_FEED = 'true';
process.env.FX_CACHE_TTL = '3600';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
// Stub the cache module so refreshRates()/primeFromCache() never touch Redis.
const cacheService = require('../service/cacheService');
let cacheStore = {};
cacheService.set = async (k, v) => { cacheStore[k] = v; };
cacheService.get = async (k) => cacheStore[k] || null;

const fx = require('../service/fxRateProvider');
const realFetch = global.fetch;

beforeEach(() => { cacheStore = {}; fx._resetForTest(); });
afterEach(() => { global.fetch = realFetch; fx._resetForTest(); });

test('the live feed is enabled in this process', () => {
    assert.equal(fx.isLiveFeedEnabled(), true);
});

test('a fresh live snapshot OVERRIDES the static rate', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ result: 'success', base: 'USD', rates: { USD: 1, GBP: 0.5 } }) });
    const r = await fx.refreshRates();
    assert.equal(r.ok, true);
    assert.equal(r.source, 'live');
    // static fallback is 0.79, but the live snapshot says 0.5 → live wins
    assert.equal(fx.getEffectiveFxRate('GBP', 0.79), 0.5);
});

test('a currency missing from the live snapshot falls back to its static rate', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ result: 'success', base: 'USD', rates: { USD: 1, GBP: 0.5 } }) });
    await fx.refreshRates();
    // SGD not in the snapshot → static 1.35
    assert.equal(fx.getEffectiveFxRate('SGD', 1.35), 1.35);
});

test('when the feed returns nothing, reads stay on the static rate (graceful fallback)', async () => {
    global.fetch = async () => ({ ok: false, json: async () => ({}) });
    const r = await fx.refreshRates();
    assert.equal(r.ok, false);
    assert.equal(fx.getEffectiveFxRate('GBP', 0.79), 0.79);
});

test('primeFromCache hydrates the memo from a fresh cached snapshot', async () => {
    cacheStore[fx.CACHE_KEY] = { rates: { USD: 1, GBP: 0.6 }, fetchedAt: Date.now() };
    const primed = await fx.primeFromCache();
    assert.equal(primed, true);
    assert.equal(fx.getEffectiveFxRate('GBP', 0.79), 0.6);
});

test('startBackgroundRefresh starts when enabled and stop() is idempotent', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ result: 'success', base: 'USD', rates: { USD: 1, GBP: 0.55 } }) });
    const handle = fx.startBackgroundRefresh();
    assert.equal(handle.started, true);
    handle.stop();
    handle.stop(); // idempotent — no throw
});
