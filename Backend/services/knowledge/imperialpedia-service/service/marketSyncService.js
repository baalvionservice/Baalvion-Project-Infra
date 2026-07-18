'use strict';
// Pulls the already-fetched/cached live overview from cms-service (the actual
// Finnhub/Twelve Data/Alpha Vantage/FRED/CoinGecko integration — NOT reimplemented
// here) and upserts it into this service's own market_assets/asset_summaries
// tables, which is what /assets actually serves to the public site. Mirrors
// service/payments.js's existing CMS-vault fetch: same env vars, same
// x-internal-secret header, same AbortController timeout, same fail-open contract.
const db = require('../models');
const config = require('../config/appConfig');

// Read through config/appConfig.js (which has a dev fallback for CMS_BASE_URL
// and crashes at boot via requireEnv() if INTERNAL_SERVICE_SECRET is unset) —
// previously this read process.env directly, bypassing that shared config
// layer for no reason and making prod misconfiguration indistinguishable from
// "everything is fine, there's just no data" (see _status below for the fix).
const CMS_BASE_URL = config.cms.baseUrl;
const INTERNAL_SECRET = config.internalSecret;
const SYNC_TTL_MS = 60_000; // matches cms-service's own live-quote cache TTL

let _lastSyncAt = 0;
let _syncInFlight = null;

// Sync health, surfaced via GET /market-data/sync-status (admin-platform's
// SyncHealthPanel polls this). In-memory only, resets on process restart —
// same tradeoff cms-service's own provider `health` object already accepts.
// This exists because every failure branch below used to be silent: a
// misconfigured/unreachable cms-service or a cms-service returning 200 with
// all-null quotes (e.g. its own provider API keys never provisioned) both
// left asset_summaries permanently empty with zero visible signal anywhere.
const _status = {
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    lastRowCount: null,
    lastSkippedCount: null,
    configOk: Boolean(CMS_BASE_URL && INTERNAL_SECRET),
};

function getSyncStatus() {
    return { ..._status };
}

async function fetchLiveOverview() {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) {
        _status.configOk = false;
        _status.lastErrorMessage = 'CMS_BASE_URL or INTERNAL_SERVICE_SECRET is not configured';
        _status.lastErrorAt = new Date();
        console.error('[marketSyncService] sync skipped: CMS_BASE_URL/INTERNAL_SERVICE_SECRET missing');
        return null;
    }
    _status.configOk = true;
    const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/market-data/overview`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET }, signal: controller.signal });
        if (!res.ok) {
            _status.lastErrorMessage = `cms-service responded ${res.status}`;
            _status.lastErrorAt = new Date();
            console.error(`[marketSyncService] fetchLiveOverview failed: cms-service returned ${res.status} ${res.statusText}`);
            return null;
        }
        const body = await res.json().catch(() => null);
        return body?.data ?? null;
    } catch (err) {
        _status.lastErrorMessage = err.name === 'AbortError' ? 'cms-service request timed out' : err.message;
        _status.lastErrorAt = new Date();
        console.error(`[marketSyncService] fetchLiveOverview error: ${_status.lastErrorMessage}`);
        return null; // fail-open — callers keep serving whatever's already in the DB
    } finally {
        clearTimeout(tid);
    }
}

function flattenInstruments(overview) {
    const groups = [
        overview.usIndices, overview.globalIndices, overview.countryIndices, overview.sectors,
        overview.stocks, overview.crypto, overview.forex, overview.commodities, overview.bonds,
    ];
    return groups.flat().filter(Boolean).map((item) => ({
        symbol: item.canonicalSymbol,
        name: item.label,
        price: item.quote?.price ?? item.quote?.value ?? null,
        changePercent: item.quote?.changePercent ?? null,
        source: item.source,
    }));
}

// asset_type per group, since flattening loses the group name.
function typeOf(overview, canonicalSymbol) {
    if (overview.usIndices.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'index';
    if (overview.globalIndices.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'index';
    if (overview.countryIndices.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'index';
    if (overview.sectors.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'index';
    if (overview.stocks.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'stock';
    if (overview.crypto.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'crypto';
    if (overview.forex.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'forex';
    if (overview.commodities.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'commodity';
    if (overview.bonds.some((i) => i.canonicalSymbol === canonicalSymbol)) return 'bond';
    return 'stock';
}

async function upsertSummaries(overview) {
    const instruments = flattenInstruments(overview);
    const now = new Date();
    let upserted = 0;
    let skipped = 0;
    await Promise.all(instruments.map((inst) => {
        if (inst.price == null) { skipped += 1; return Promise.resolve(); } // no live quote this cycle — leave prior value in place
        upserted += 1;
        return db.AssetSummary.upsert({
            symbol: inst.symbol,
            name: inst.name,
            asset_type: typeOf(overview, inst.symbol),
            current_price: inst.price,
            change_pct_24h: inst.changePercent,
            last_updated_at: now,
        });
    }));
    _status.lastRowCount = upserted;
    _status.lastSkippedCount = skipped;
    if (skipped > 0) {
        console.error(`[marketSyncService] upsertSummaries: ${skipped}/${instruments.length} instruments had no live quote this cycle (cms-service returned null price — check its provider API keys) — ${upserted} upserted`);
    }
    return instruments.length;
}

// Lazy-refresh entry point — called from assetsController before serving reads.
// Coalesces concurrent callers into one in-flight sync (same shape as the
// content-service single-flight patterns elsewhere in this codebase).
async function ensureFresh() {
    const now = Date.now();
    if (now - _lastSyncAt < SYNC_TTL_MS) return;
    if (_syncInFlight) return _syncInFlight;
    _status.lastAttemptAt = new Date();
    _syncInFlight = (async () => {
        const overview = await fetchLiveOverview();
        if (overview) {
            await upsertSummaries(overview);
            _status.lastSuccessAt = new Date();
            console.log(`[marketSyncService] sync ok: ${_status.lastRowCount} upserted, ${_status.lastSkippedCount} skipped`);
        }
        // Advance the TTL window on both success AND failure — otherwise a
        // persistently unreachable cms-service means every single request
        // re-pays the full fetchLiveOverview() timeout budget forever, with
        // no backoff (this is what caused the 2026-07-17 /market-news, /world
        // and /markets/quote hangs in production).
        _lastSyncAt = Date.now();
    })().finally(() => { _syncInFlight = null; });
    return _syncInFlight;
}

// Forces an immediate sync regardless of the TTL window — backs the admin
// "Resync now" action (POST /market-data/resync). Resets the TTL clock so a
// forced sync doesn't get treated as already-fresh by a concurrent request.
async function forceSync() {
    _lastSyncAt = 0;
    return ensureFresh();
}

// Per-symbol chart/indicators/performance detail — lazy-cached in-memory (60s,
// matches cms-service's own quote TTL) so the public quote page gets full CNBC
// depth without ever calling cms-service directly from the browser.
const _detailCache = new Map(); // key: `${symbol}:${range}` -> { at, data }
const DETAIL_TTL_MS = 60_000;

async function fetchAssetDetail(symbol, range) {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) return null;
    const cacheKey = `${symbol}:${range}`;
    const hit = _detailCache.get(cacheKey);
    if (hit && Date.now() - hit.at < DETAIL_TTL_MS) return hit.data;

    const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/market-data/quote/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET }, signal: controller.signal });
        if (!res.ok) return hit?.data ?? null;
        const body = await res.json().catch(() => null);
        const data = body?.data ?? null;
        if (data) _detailCache.set(cacheKey, { at: Date.now(), data });
        return data ?? hit?.data ?? null;
    } catch {
        return hit?.data ?? null; // fail-open — serve last-known detail if we have one
    } finally {
        clearTimeout(tid);
    }
}

module.exports = { ensureFresh, forceSync, fetchLiveOverview, upsertSummaries, fetchAssetDetail, getSyncStatus };
