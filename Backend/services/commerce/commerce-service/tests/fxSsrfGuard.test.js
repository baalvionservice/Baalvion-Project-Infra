'use strict';
// FX live-feed SSRF guard — an operator-misconfigured FX_API_URL (private/link-local host) must
// DISABLE the live feed rather than throw into boot, so the store still prices from static rates.
// Run STANDALONE (`node --test tests/fxSsrfGuard.test.js`) so FX_LIVE_FEED/FX_API_URL are set
// before the module loads (the effective-enable flag is computed once at require time). No real
// network or Redis is contacted.
process.env.FX_LIVE_FEED = 'true';
// Cloud metadata endpoint — the classic SSRF target. The guard must reject it and disable the feed.
process.env.FX_API_URL = 'https://169.254.169.254/latest/meta-data';

const { test } = require('node:test');
const assert = require('node:assert');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const fx = require('../service/fxRateProvider');

test('a private/link-local FX_API_URL DISABLES the live feed (no throw at boot)', () => {
    // Requested true, but the SSRF guard rejected the URL → effectively disabled.
    assert.equal(fx.isLiveFeedEnabled(), false);
});

test('with the feed disabled, getEffectiveFxRate falls back to the static rate', () => {
    assert.equal(fx.getEffectiveFxRate('GBP', 0.79), 0.79);
});

test('refreshRates is a graceful no-op when the feed was disabled by the SSRF guard', async () => {
    const r = await fx.refreshRates();
    assert.deepEqual(r, { ok: false, source: 'noop' });
});

test('isSafeFeedUrl rejected the configured private host', () => {
    assert.equal(fx.isSafeFeedUrl(process.env.FX_API_URL), false);
});
