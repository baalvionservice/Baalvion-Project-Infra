'use strict';
// The price of one USDT in a currency, from public sources that need no key, tried in order (Coinbase, then CoinGecko).
// Cached for a minute. If neither answers it throws; a price is never made up.
const { AppError } = require('../utils/errors');

const CURRENCIES = ['INR', 'AED', 'USD'];
let cache = null; // { at, value }
const TTL_MS = 60 * 1000;

async function coinbase() {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USDT', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`coinbase ${res.status}`);
    const r = ((await res.json()).data || {}).rates || {};
    const out = {};
    for (const c of CURRENCIES) { const n = Number(r[c]); if (Number.isFinite(n) && n > 0) out[c] = n; }
    if (!out.USD) throw new Error('coinbase empty');
    return { rates: out, source: 'Coinbase' };
}

async function coingecko() {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,inr,aed', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const t = (await res.json()).tether || {};
    const out = {};
    if (Number.isFinite(t.usd)) out.USD = t.usd;
    if (Number.isFinite(t.inr)) out.INR = t.inr;
    if (Number.isFinite(t.aed)) out.AED = t.aed;
    if (!out.USD) throw new Error('coingecko empty');
    return { rates: out, source: 'CoinGecko' };
}

async function load() {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
    for (const fn of [coinbase, coingecko]) {
        try { const value = { ...(await fn()), at: new Date().toISOString() }; cache = { at: Date.now(), value }; return value; } catch { /* try the next source */ }
    }
    if (cache) return cache.value; // a stale price is better than none, and the quote records when it was taken
    throw new AppError('RATE_UNAVAILABLE', 'Today\'s USDT price is not available right now. Try again in a minute.', 503);
}

// Price of 1 USDT in `currency`, with where and when it was taken.
async function perUsdt(currency) {
    if (!CURRENCIES.includes(currency)) throw new AppError('VALIDATION_ERROR', `currency must be one of ${CURRENCIES.join(', ')}`, 400);
    const v = await load();
    const rate = v.rates[currency];
    if (!rate) throw new AppError('RATE_UNAVAILABLE', `No ${currency} price is available right now`, 503);
    return { rate, source: v.source, at: v.at };
}

module.exports = { perUsdt, CURRENCIES };
