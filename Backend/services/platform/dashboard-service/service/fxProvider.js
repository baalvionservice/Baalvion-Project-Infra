'use strict';
// FX rate provider seam. Default source is the free, no-key Open Exchange Rates community endpoint
// (open.er-api.com). To use a paid/contracted feed instead, swap fetchRates() — the rest of the
// pipeline (change calc, persistence) is provider-agnostic. Every network path is failure-safe:
// on ANY error we keep the cached DB rows untouched and never throw to the caller.

const PROVIDER_URL = process.env.FX_PROVIDER_URL || 'https://open.er-api.com/v6/latest/USD';
const TIMEOUT_MS = Number(process.env.FX_PROVIDER_TIMEOUT_MS || 4000);

/**
 * Fetch the latest USD-based rates from the provider.
 * @returns {Promise<{asOf: Date, rates: Record<string, number>} | null>} null on any failure.
 */
async function fetchRates() {
    if (typeof fetch !== 'function') return null; // older Node without global fetch
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(PROVIDER_URL, { signal: ctrl.signal, headers: { accept: 'application/json' } });
        if (!res.ok) return null;
        const json = await res.json();
        // open.er-api.com → { result:'success', time_last_update_unix, rates:{USD:1, EUR:0.92, ...} }
        const rates = json.rates || json.conversion_rates || null;
        if (!rates || typeof rates !== 'object') return null;
        const asOf = json.time_last_update_unix
            ? new Date(json.time_last_update_unix * 1000)
            : new Date();
        return { asOf, rates };
    } catch (_) {
        return null; // network/abort/parse — fall back to cached values
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Refresh persisted fx_rates rows from the provider. Recomputes change_24h from the prior stored
 * rate. Leaves rows untouched if the provider is unreachable. Returns the (possibly unchanged) rows.
 */
async function refreshFxRates(db) {
    try {
        const rows = await db.FxRate.findAll();
        if (!rows.length) return rows;
        const fresh = await fetchRates();
        if (!fresh) return rows; // provider down — serve cached

        const now = new Date();
        await Promise.all(rows.map(async (row) => {
            const next = Number(fresh.rates[row.code]);
            if (!Number.isFinite(next) || next <= 0) return;
            const prev = Number(row.rate);
            const change24h = prev > 0 ? Number((((next - prev) / prev) * 100).toFixed(4)) : 0;
            await row.update({
                prev_rate: prev,
                rate: next,
                change_24h: change24h,
                last_updated: now,
                as_of: fresh.asOf || now,
            });
        }));
        return db.FxRate.findAll();
    } catch (_) {
        // never throw — endpoint must always resolve
        try { return await db.FxRate.findAll(); } catch (__) { return []; }
    }
}

module.exports = { fetchRates, refreshFxRates };
