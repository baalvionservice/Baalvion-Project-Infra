'use strict';
/**
 * FX rate provider — the seam between the static, env-overridable rates baked into
 * config/markets.js and a future LIVE FX feed (e.g. an external exchange-rate API).
 *
 * ── Design contract ──────────────────────────────────────────────────────────────
 * Today every per-market price is derived from the STATIC rates in config/markets.js
 * (1 USD = <rate> CCY, overridable via FX_USD_<CCY>). This module preserves that exact
 * behaviour by default: with no live feed configured, `getEffectiveFxRate(ccy, static)`
 * returns the static rate unchanged, so money math is byte-identical to before.
 *
 * When a live feed is enabled (FX_LIVE_FEED=true) the provider serves rates that a
 * background refresh has written into Redis (service/cacheService.js) under a single
 * snapshot key with a TTL. Reads are SYNCHRONOUS against an in-process memo of that
 * snapshot, so the hot price-conversion path never awaits I/O — and if Redis, the feed,
 * or the snapshot is missing/stale/invalid, every lookup GRACEFULLY FALLS BACK to the
 * caller-supplied static rate. The store therefore can never fail to price a product.
 *
 * ── How the live feed plugs in (integration point) ───────────────────────────────
 * 1. Set FX_LIVE_FEED=true and FX_API_URL / FX_API_KEY for your provider.
 * 2. Run refreshRates() on an interval (cron / BullMQ repeatable job / a tiny timer):
 *      const fx = require('./service/fxRateProvider');
 *      setInterval(() => fx.refreshRates().catch(() => {}), fx.REFRESH_INTERVAL_MS);
 *    refreshRates() fetches a USD-base snapshot, validates it, writes it to Redis
 *    (TTL = FX_CACHE_TTL) and updates the in-process memo. It NEVER throws to callers.
 * 3. Implement fetchLiveSnapshot() below (marked LIVE-FEED INTEGRATION POINT) to call
 *    the real API and return { USD: 1, GBP: 0.79, AED: 3.67, INR: 83.3, SGD: 1.35, ... }.
 *
 * No API key is required for the default (static) mode — this file is fully functional
 * and side-effect-free until a live feed is explicitly turned on.
 */

const cacheService = require('./cacheService');

// ── Tunables (all env-overridable) ─────────────────────────────────────────────
const LIVE_FEED_ENABLED = String(process.env.FX_LIVE_FEED || 'false').toLowerCase() === 'true';
// TTL on the cached snapshot. A snapshot older than this is treated as stale → static fallback.
const FX_CACHE_TTL = Number(process.env.FX_CACHE_TTL || 3600); // 1h
// Suggested cadence for the background refresh job (kept below the TTL so the cache never expires).
const REFRESH_INTERVAL_MS = Number(process.env.FX_REFRESH_INTERVAL_MS || 30 * 60 * 1000); // 30m
const FX_API_URL = process.env.FX_API_URL || '';
const FX_API_KEY = process.env.FX_API_KEY || '';

const CACHE_KEY = 'commerce:fx:snapshot:usd';

// In-process memo of the latest validated snapshot. The hot path reads THIS (sync) so a
// per-request price conversion never awaits Redis. Refreshed by refreshRates()/primeFromCache().
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

// Validate + normalize a raw rates map into uppercase-keyed positive numbers. Drops any
// junk entry rather than poisoning the snapshot. Returns null when nothing usable remains.
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
 * SYNCHRONOUS by contract: the price path must not await. `staticRate` is the rate
 * markets.js already computed from FX_USD_<CCY>/defaults, so a missing/disabled feed is
 * indistinguishable from the legacy static behaviour.
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

// ── LIVE-FEED INTEGRATION POINT ────────────────────────────────────────────────
// Implement the real API call here. Must return a USD-base rates map
// ({ USD: 1, GBP: 0.79, ... }) or null on any failure (never throw). This is the ONLY
// function that should know about the upstream provider's wire format / auth.
//
// Example skeleton (kept commented so the service has no hard dependency on a feed):
//
//   const res = await fetch(`${FX_API_URL}?base=USD&access_key=${FX_API_KEY}`);
//   if (!res.ok) return null;
//   const body = await res.json();
//   return body && body.rates ? { USD: 1, ...body.rates } : null;
//
async function fetchLiveSnapshot() {
    if (!FX_API_URL) return null; // no feed configured → caller falls back to static
    // Intentionally a stub: returning null keeps the static rates authoritative until a
    // real provider is wired in above. Implement and return a normalized rates map here.
    return null;
}

/**
 * Background refresh: fetch a fresh snapshot, validate it, persist to Redis (TTL) and
 * update the in-process memo. NEVER throws — failures leave the previous memo/cache in
 * place so reads keep falling back to static. Safe to call on an interval or by hand.
 *
 * @returns {Promise<{ ok: boolean, source: 'live'|'noop', rates?: object }>}
 */
async function refreshRates() {
    if (!LIVE_FEED_ENABLED) return { ok: false, source: 'noop' };
    try {
        const raw = await fetchLiveSnapshot();
        const rates = normalizeRates(raw);
        if (!rates) return { ok: false, source: 'noop' };
        const snapshot = { rates, fetchedAt: nowMs() };
        memo = snapshot;
        await cacheService.set(CACHE_KEY, snapshot, FX_CACHE_TTL); // fail-open inside cacheService
        return { ok: true, source: 'live', rates };
    } catch {
        return { ok: false, source: 'noop' }; // keep prior memo/cache; reads stay on static
    }
}

/**
 * On boot, hydrate the in-process memo from Redis so a freshly-started instance serves the
 * last good snapshot without waiting for its first refresh. No-op (and never throws) when
 * the feed is disabled, the cache is empty, or the snapshot is stale/invalid.
 */
async function primeFromCache() {
    if (!LIVE_FEED_ENABLED) return false;
    try {
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
    refreshRates,
    primeFromCache,
    normalizeRates,
    REFRESH_INTERVAL_MS,
    FX_CACHE_TTL,
    CACHE_KEY,
    _resetForTest,
};
