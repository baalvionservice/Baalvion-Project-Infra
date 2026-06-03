'use strict';
// FX rate provider seam — the boundary between the static env rates and a future live feed.
// Verifies: default (disabled) mode returns the static fallback unchanged; refresh/prime are
// safe no-ops with no live feed configured; rate validation drops junk/negative/non-finite
// entries. Pure unit tests — no real Redis or external API is contacted.
process.env.FX_LIVE_FEED = 'false';

const { test } = require('node:test');
const assert = require('node:assert');

const fx = require('../service/fxRateProvider');

test('live feed is disabled by default', () => {
    assert.equal(fx.isLiveFeedEnabled(), false);
});

test('getEffectiveFxRate returns the static fallback when the live feed is disabled', () => {
    assert.equal(fx.getEffectiveFxRate('GBP', 0.79), 0.79);
    assert.equal(fx.getEffectiveFxRate('AED', 3.67), 3.67);
    // Unknown currency still falls back to the supplied static rate (never NaN/undefined).
    assert.equal(fx.getEffectiveFxRate('ZZZ', 1.23), 1.23);
});

test('refreshRates is a graceful no-op when the live feed is disabled', async () => {
    const r = await fx.refreshRates();
    assert.deepEqual(r, { ok: false, source: 'noop' });
});

test('primeFromCache is a graceful no-op when the live feed is disabled', async () => {
    assert.equal(await fx.primeFromCache(), false);
});

test('normalizeRates keeps finite positive rates and uppercases keys', () => {
    assert.deepEqual(
        fx.normalizeRates({ usd: 1, gbp: 0.79, AED: 3.67 }),
        { USD: 1, GBP: 0.79, AED: 3.67 },
    );
});

test('normalizeRates drops non-finite, zero, negative and non-numeric entries', () => {
    assert.deepEqual(
        fx.normalizeRates({ USD: 1, A: 0, B: -2, C: Infinity, D: NaN, E: 'x', F: null }),
        { USD: 1 },
    );
});

test('normalizeRates returns null for empty / non-object / all-junk input', () => {
    assert.equal(fx.normalizeRates({}), null);
    assert.equal(fx.normalizeRates(null), null);
    assert.equal(fx.normalizeRates([1, 2, 3]), null);
    assert.equal(fx.normalizeRates({ A: 'x', B: -1 }), null);
    assert.equal(fx.normalizeRates('nope'), null);
});

test('the cache key and tunables are exposed for the refresh job', () => {
    assert.equal(fx.CACHE_KEY, 'commerce:fx:snapshot:usd');
    assert.ok(Number.isFinite(fx.FX_CACHE_TTL) && fx.FX_CACHE_TTL > 0);
    assert.ok(Number.isFinite(fx.REFRESH_INTERVAL_MS) && fx.REFRESH_INTERVAL_MS > 0);
});
