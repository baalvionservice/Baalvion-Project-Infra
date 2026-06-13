'use strict';
/**
 * FX rate provider for ORDER pricing — the seam between the static, env-overridable rates
 * baked into config/markets.js and a LIVE FX feed.
 *
 * ⚠️  MIRROR of commerce-service/service/fxRateProvider.js. It reads the SAME Redis
 * snapshot key (commerce:fx:snapshot:usd) that commerce-service's background refresh
 * writes, so when a live feed is enabled BOTH services serve identical effective rates —
 * the order total can never diverge from the displayed storefront price. order-service
 * does NOT run the background refresh itself; createOrder calls primeFromCache() so each
 * order reads the freshest snapshot commerce-service published. With the feed disabled
 * (default) every lookup returns the caller-supplied static rate (FX_USD_<CCY>/default),
 * byte-identical to the legacy behaviour.
 */

// cacheService (and through it appConfig/ioredis) is required LAZILY inside primeFromCache so
// that requiring this module for pure, synchronous rate math (getEffectiveFxRate) pulls in no
// Redis/env dependencies — keeps config/markets.js and service/pricing.js cheap and unit-testable.

// ── Tunables (all env-overridable; keep in sync with commerce-service) ───────────
const LIVE_FEED_ENABLED = String(process.env.FX_LIVE_FEED || 'false').toLowerCase() === 'true';
const FX_CACHE_TTL = Number(process.env.FX_CACHE_TTL || 3600); // 1h

const CACHE_KEY = 'commerce:fx:snapshot:usd';

// In-process memo of the latest validated snapshot. The hot path reads THIS (sync).
// Shape: { rates: { USD: 1, GBP: 0.79, ... }, fetchedAt: <epoch ms> } | null.
let memo = null;

const nowMs = () => Date.now();

function isLiveFeedEnabled() {
    return LIVE_FEED_ENABLED;
}

// A rate is usable only when it is a finite, strictly-positive number.
function isValidRate(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
}

// Validate + normalize a raw rates map into uppercase-keyed positive numbers.
function normalizeRates(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const [ccy, rate] of Object.entries(raw)) {
        if (typeof ccy === 'string' && isValidRate(rate)) out[ccy.toUpperCase()] = Number(rate);
    }
    return Object.keys(out).length > 0 ? out : null;
}

// True when a snapshot is present and still inside its TTL window.
function isFresh(snapshot) {
    return !!(snapshot && snapshot.rates && (nowMs() - snapshot.fetchedAt) < FX_CACHE_TTL * 1000);
}

/**
 * The effective USD→`currency` rate for a price conversion.
 *
 * Resolution order (each step falls through on miss):
 *   1. live feed disabled → staticRate (today's behaviour, unchanged)
 *   2. fresh in-process memo has the currency → memoized live rate
 *   3. otherwise → staticRate (graceful fallback)
 *
 * SYNCHRONOUS by contract. `staticRate` is the rate markets.js already computed from
 * FX_USD_<CCY>/defaults, so a missing/disabled feed is indistinguishable from legacy.
 *
 * @param {string} currency  ISO-4217 code, e.g. 'GBP'
 * @param {number} staticRate  the static USD→currency fallback (from config/markets.js)
 * @returns {number} a finite, positive USD→currency rate
 */
function getEffectiveFxRate(currency, staticRate) {
    if (!LIVE_FEED_ENABLED) return staticRate;
    const ccy = typeof currency === 'string' ? currency.toUpperCase() : '';
    if (isFresh(memo) && isValidRate(memo.rates[ccy])) return memo.rates[ccy];
    return staticRate; // graceful fallback: feed down / stale / missing this currency
}

/**
 * Hydrate the in-process memo from the shared Redis snapshot written by commerce-service.
 * No-op (and never throws) when the feed is disabled, the cache is empty, or the snapshot
 * is stale/invalid. Called by createOrder so each order uses the freshest published rates.
 *
 * @returns {Promise<boolean>} true when a fresh snapshot was loaded into the memo
 */
async function primeFromCache() {
    if (!LIVE_FEED_ENABLED) return false;
    try {
        const cacheService = require('./cacheService'); // lazy: only when a live feed is enabled
        const cached = await cacheService.get(CACHE_KEY);
        if (cached && isFresh(cached) && normalizeRates(cached.rates)) {
            memo = { rates: normalizeRates(cached.rates), fetchedAt: cached.fetchedAt };
            return true;
        }
    } catch { /* fall through to static */ }
    return false;
}

// Test-only: reset the in-process memo so unit tests start from a known (static) state.
function _resetForTest() {
    memo = null;
}

module.exports = {
    isLiveFeedEnabled,
    getEffectiveFxRate,
    primeFromCache,
    normalizeRates,
    FX_CACHE_TTL,
    CACHE_KEY,
    _resetForTest,
};
