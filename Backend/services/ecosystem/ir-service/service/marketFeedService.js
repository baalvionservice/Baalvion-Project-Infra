'use strict';
// Optional live market-data feed.
//
// When MARKET_FEED_SYMBOL is set, pulls a quote from the configured provider and
// normalizes it to the market_snapshot shape. With NO symbol configured (the default),
// isConfigured() is false and the service is inert — the manually-entered snapshot is
// used unchanged. A fetch failure also leaves the manual snapshot in place.
//
//   MARKET_FEED_SYMBOL    e.g. "AAPL" (the company's real ticker once listed)
//   MARKET_FEED_PROVIDER  "yahoo" (default, keyless) | "finnhub"
//   MARKET_FEED_API_KEY   required only for finnhub
const PROVIDER = (process.env.MARKET_FEED_PROVIDER || 'yahoo').toLowerCase();
const SYMBOL = process.env.MARKET_FEED_SYMBOL || '';
const API_KEY = process.env.MARKET_FEED_API_KEY || '';

const isConfigured = () => !!SYMBOL && typeof fetch === 'function';

async function fetchYahoo(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`yahoo ${res.status}`);
    const j = await res.json();
    const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
    if (!m || m.regularMarketPrice == null) throw new Error('yahoo: no quote');
    const prev = m.chartPreviousClose != null ? m.chartPreviousClose : m.previousClose;
    const price = Number(m.regularMarketPrice);
    const changePct = prev ? ((price - prev) / prev) * 100 : null;
    return {
        symbol: m.symbol || symbol,
        exchange: m.fullExchangeName || m.exchangeName || null,
        currency: m.currency || 'USD',
        price,
        change_pct: changePct != null ? Number(changePct.toFixed(2)) : null,
        volume: m.regularMarketVolume != null ? Number(m.regularMarketVolume) : null,
        week52_high: m.fiftyTwoWeekHigh != null ? Number(m.fiftyTwoWeekHigh) : null,
        week52_low: m.fiftyTwoWeekLow != null ? Number(m.fiftyTwoWeekLow) : null,
        as_of: new Date(),
    };
}

async function fetchFinnhub(symbol) {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`);
    if (!res.ok) throw new Error(`finnhub ${res.status}`);
    const j = await res.json();
    if (j.c == null) throw new Error('finnhub: no quote');
    return {
        symbol,
        price: Number(j.c),
        change_pct: j.dp != null ? Number(j.dp) : null,
        week52_high: j.h != null ? Number(j.h) : null,
        week52_low: j.l != null ? Number(j.l) : null,
        currency: 'USD',
        as_of: new Date(),
    };
}

async function fetchQuote() {
    if (!isConfigured()) return null;
    if (PROVIDER === 'finnhub' && API_KEY) return fetchFinnhub(SYMBOL);
    return fetchYahoo(SYMBOL);
}

module.exports = { isConfigured, fetchQuote, SYMBOL, PROVIDER };
