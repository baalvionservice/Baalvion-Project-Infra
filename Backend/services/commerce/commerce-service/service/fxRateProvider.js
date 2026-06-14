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
const FX_LIVE_FEED_REQUESTED = String(process.env.FX_LIVE_FEED || 'false').toLowerCase() === 'true';
// TTL on the cached snapshot. A snapshot older than this is treated as stale → static fallback.
const FX_CACHE_TTL = Number(process.env.FX_CACHE_TTL || 3600); // 1h
// Suggested cadence for the background refresh job (kept below the TTL so the cache never expires).
const REFRESH_INTERVAL_MS = Number(process.env.FX_REFRESH_INTERVAL_MS || 30 * 60 * 1000); // 30m
// Default to a KEYLESS, USD-base public FX feed (open.er-api.com) so a live feed works with zero
// secrets in non-prod. Override FX_API_URL for a paid/keyed provider; FX_API_KEY is appended as
// access_key only when set. The feed is OFF unless FX_LIVE_FEED=true regardless of this default.
const DEFAULT_FX_API_URL = 'https://open.er-api.com/v6/latest/USD';
const FX_API_URL = process.env.FX_API_URL || DEFAULT_FX_API_URL;
const FX_API_KEY = process.env.FX_API_KEY || '';
// Hard cap on the upstream fetch so a hung feed never blocks the refresh job.
const FETCH_TIMEOUT_MS = Number(process.env.FX_FETCH_TIMEOUT_MS || 5000);

const CACHE_KEY = 'commerce:fx:snapshot:usd';

// SSRF guard for an operator-misconfigured FX_API_URL. The URL is operator-supplied, so a typo or a
// hostile-internal value could point the refresh job at an internal/metadata endpoint. We require a
// well-formed https:// URL whose host is NOT loopback/link-local/private (RFC1918). Returns true only
// for a safe public-looking https URL. Hostname comparison is purely lexical — we never resolve DNS.
function isSafeFeedUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false; // not a parseable absolute URL
    }
    if (parsed.protocol !== 'https:') return false; // plaintext / file: / etc. rejected
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
    if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host === '') return false;
    // IPv6 loopback / link-local / unique-local (fc00::/7) — lexical prefix checks.
    if (host === '::' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return false;
    // IPv4 RFC1918 private + loopback + link-local ranges.
    const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (v4) {
        const [a, b] = [Number(v4[1]), Number(v4[2])];
        if (a === 10) return false;                       // 10.0.0.0/8
        if (a === 127) return false;                      // 127.0.0.0/8 loopback
        if (a === 169 && b === 254) return false;         // 169.254.0.0/16 link-local
        if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
        if (a === 192 && b === 168) return false;         // 192.168.0.0/16
    }
    return true;
}

// Effective enable flag: the live feed only runs when explicitly requested AND its URL passes the
// SSRF guard. An invalid/private FX_API_URL DISABLES the feed (warn + static fallback) instead of
// throwing into boot, so the store still prices every product from the static rates.
const LIVE_FEED_ENABLED = FX_LIVE_FEED_REQUESTED && isSafeFeedUrl(FX_API_URL);
if (FX_LIVE_FEED_REQUESTED && !LIVE_FEED_ENABLED) {
    // eslint-disable-next-line no-console
    console.warn(`[Commerce FX] FX_LIVE_FEED is on but FX_API_URL is invalid or points at a private/`
        + `non-https host — live feed DISABLED, falling back to static rates. URL: ${FX_API_URL}`);
}

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

// Build the upstream URL, appending the access_key query param only when FX_API_KEY is set (so the
// keyless default stays clean and keyed providers like exchangerate.host/apilayer work too).
function buildFeedUrl() {
    if (!FX_API_URL) return null;
    if (!FX_API_KEY) return FX_API_URL;
    const sep = FX_API_URL.includes('?') ? '&' : '?';
    return `${FX_API_URL}${sep}access_key=${encodeURIComponent(FX_API_KEY)}`;
}

// Extract a USD-base rates map from the common provider wire formats. Supports the keyless
// open.er-api.com shape ({ result:'success', rates:{...} }) and the exchangerate.host /
// exchangeratesapi shape ({ success:true, base:'USD', rates:{...} }). Returns the raw map (or null);
// validation/normalization happens in normalizeRates(). USD is forced to 1 as the base anchor.
function extractRates(body) {
    if (!body || typeof body !== 'object') return null;
    // Explicit failure flags from keyed providers.
    if (body.success === false || (typeof body.result === 'string' && body.result !== 'success')) return null;
    const rates = body.rates && typeof body.rates === 'object' ? body.rates : null;
    if (!rates) return null;
    // Only USD-base snapshots are usable (markets.js converts FROM USD). If a provider returns a
    // different base we cannot safely use it → bail to static.
    if (body.base && String(body.base).toUpperCase() !== 'USD') return null;
    return { ...rates, USD: 1 };
}

// ── LIVE-FEED INTEGRATION POINT ────────────────────────────────────────────────
// Calls the configured USD-base FX provider and returns a raw rates map (USD-anchored) or null on
// ANY failure (never throws). normalizeRates() downstream drops junk and rejects an empty result.
async function fetchLiveSnapshot() {
    const url = buildFeedUrl();
    if (!url) return null; // no feed configured → caller falls back to static
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
        if (!res || !res.ok) return null;
        const body = await res.json();
        return extractRates(body);
    } catch {
        return null; // network error / timeout / bad JSON → static fallback
    } finally {
        clearTimeout(timer);
    }
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

let refreshTimer = null;

/**
 * Boot the live-feed lifecycle: hydrate from Redis, kick an immediate refresh, then refresh on an
 * interval (kept below the cache TTL so the snapshot never expires under the read path). A complete
 * NO-OP when FX_LIVE_FEED is disabled, so the static-pricing default boots with zero side effects.
 * Returns a stop() handle (used by tests / graceful shutdown). The timer is unref()'d so it never
 * keeps the process alive on its own.
 */
function startBackgroundRefresh() {
    if (!LIVE_FEED_ENABLED) return { started: false, stop: () => {} };
    if (refreshTimer) return { started: true, stop: stopBackgroundRefresh };
    // Prime + first refresh asynchronously; never block boot, never throw.
    primeFromCache().catch(() => {});
    refreshRates().catch(() => {});
    refreshTimer = setInterval(() => { refreshRates().catch(() => {}); }, REFRESH_INTERVAL_MS);
    if (typeof refreshTimer.unref === 'function') refreshTimer.unref();
    return { started: true, stop: stopBackgroundRefresh };
}

function stopBackgroundRefresh() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

// Test-only: reset the in-process memo so unit tests start from a known (static) state.
function _resetForTest() {
    memo = null;
    stopBackgroundRefresh();
}

module.exports = {
    isLiveFeedEnabled,
    isSafeFeedUrl,
    getEffectiveFxRate,
    refreshRates,
    primeFromCache,
    normalizeRates,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    fetchLiveSnapshot,
    REFRESH_INTERVAL_MS,
    FX_CACHE_TTL,
    CACHE_KEY,
    _resetForTest,
};
