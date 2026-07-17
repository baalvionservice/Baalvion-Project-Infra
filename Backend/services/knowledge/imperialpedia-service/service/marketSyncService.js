'use strict';
// Pulls the already-fetched/cached live overview from cms-service (the actual
// Finnhub/Twelve Data/Alpha Vantage/FRED/CoinGecko integration — NOT reimplemented
// here) and upserts it into this service's own market_assets/asset_summaries
// tables, which is what /assets actually serves to the public site. Mirrors
// service/payments.js's existing CMS-vault fetch: same env vars, same
// x-internal-secret header, same AbortController timeout, same fail-open contract.
const db = require('../models');

const CMS_BASE_URL = process.env.CMS_BASE_URL || '';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const SYNC_TTL_MS = 60_000; // matches cms-service's own live-quote cache TTL

let _lastSyncAt = 0;
let _syncInFlight = null;

async function fetchLiveOverview() {
    if (!CMS_BASE_URL || !INTERNAL_SECRET) return null;
    const url = `${CMS_BASE_URL.replace(/\/$/, '')}/internal/market-data/overview`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, { headers: { 'x-internal-secret': INTERNAL_SECRET }, signal: controller.signal });
        if (!res.ok) return null;
        const body = await res.json().catch(() => null);
        return body?.data ?? null;
    } catch {
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
    await Promise.all(instruments.map((inst) => {
        if (inst.price == null) return Promise.resolve(); // no live quote this cycle — leave prior value in place
        return db.AssetSummary.upsert({
            symbol: inst.symbol,
            name: inst.name,
            asset_type: typeOf(overview, inst.symbol),
            current_price: inst.price,
            change_pct_24h: inst.changePercent,
            last_updated_at: now,
        });
    }));
    return instruments.length;
}

// Lazy-refresh entry point — called from assetsController before serving reads.
// Coalesces concurrent callers into one in-flight sync (same shape as the
// content-service single-flight patterns elsewhere in this codebase).
async function ensureFresh() {
    const now = Date.now();
    if (now - _lastSyncAt < SYNC_TTL_MS) return;
    if (_syncInFlight) return _syncInFlight;
    _syncInFlight = (async () => {
        const overview = await fetchLiveOverview();
        if (overview) {
            await upsertSummaries(overview);
            _lastSyncAt = Date.now();
        }
    })().finally(() => { _syncInFlight = null; });
    return _syncInFlight;
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

module.exports = { ensureFresh, fetchLiveOverview, upsertSummaries, fetchAssetDetail };
