'use strict';
// Live market data for the newsroom dashboard (indices, share prices, commodities,
// currencies, bond yields, crypto). Every provider is independently isConfigured()-gated
// — a missing key just leaves that slice of data null, it never throws or blocks the
// other slices (same "manual value stays put on failure" contract as ir-service's
// marketFeedService). Each fetch also records provider health (ok/rate_limited/error)
// so the dashboard's "Market Data Health" panel reflects reality, not just "has a key".
//
// Provider assignment is split to stay inside each free tier's daily request budget.
// Zero-traffic cost-saving policy (2026-08-26): the newsroom dashboard is the only
// live consumer right now (Imperialpedia has no public traffic and these pages
// aren't even indexed yet — see Frontend/Imperialpedia-main/config/market-quotes.ts),
// so every TTL below is stretched to once a day (DAY_TTL) instead of the previous
// per-provider tuning (Finnhub/Binance 60s, Twelve Data 30min, Alpha Vantage 6h,
// FRED 1h) — that means the dashboard can show up to a day-old price while someone
// has it open. Bring the old per-provider values back once real traffic or active
// newsroom monitoring makes fresher-than-daily data worth the request budget again.
const cacheService = require('./cacheService');
const contentService = require('./contentService');
const marketHours = require('./marketHours');
const { computeIndicators } = require('./technicalIndicators');
const { logger } = require('../platform/logger');

const log = logger('marketDataService');

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || '';
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || '';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const FRED_KEY = process.env.FRED_API_KEY || '';

const DAY_TTL = 24 * 60 * 60;

const TTL = {
    quote: DAY_TTL,
    crypto: DAY_TTL,
    forex: DAY_TTL,
    commodity: DAY_TTL,
    bond: DAY_TTL,
    news: DAY_TTL,
};

// `canonicalSymbol` is the DB (market_assets) symbol — the one /quote/:symbol
// resolves against. `symbol`/`fn`/`series` stay as the PROVIDER ticker used for the
// actual API call. These diverge for indices/forex/commodities (e.g. Dow Jones is
// fetched as "DIA" but its canonical, linkable symbol is "DJI") — every group now
// carries both explicitly rather than relying on one field to mean two things.
const US_INDICES = [
    { symbol: 'SPY', canonicalSymbol: 'SPX', label: 'S&P 500 (SPY)' },
    { symbol: 'DIA', canonicalSymbol: 'DJI', label: 'Dow Jones (DIA)' },
    { symbol: 'QQQ', canonicalSymbol: 'IXIC', label: 'Nasdaq (QQQ)' },
    { symbol: 'IWM', canonicalSymbol: 'RUT', label: 'Russell 2000 (IWM)' },
    { symbol: 'VIXY', canonicalSymbol: 'VIX', label: 'VIX (VIXY)' },
];
const GLOBAL_INDICES = [
    { symbol: 'VGK', canonicalSymbol: 'EUROPE', label: 'Europe (VGK)', region: 'Europe' },
    { symbol: 'VPL', canonicalSymbol: 'APAC', label: 'Asia-Pacific (VPL)', region: 'Asia-Pacific' },
    { symbol: 'FXI', canonicalSymbol: 'CHINA', label: 'China (FXI)', region: 'China' },
    { symbol: 'EEM', canonicalSymbol: 'EM', label: 'Emerging Markets (EEM)', region: 'Emerging Markets' },
];
const STOCKS = [
    { symbol: 'AAPL', canonicalSymbol: 'AAPL', label: 'Apple', newsKeyword: 'Apple' },
    { symbol: 'MSFT', canonicalSymbol: 'MSFT', label: 'Microsoft', newsKeyword: 'Microsoft' },
    { symbol: 'GOOGL', canonicalSymbol: 'GOOGL', label: 'Alphabet', newsKeyword: 'Google' },
    { symbol: 'AMZN', canonicalSymbol: 'AMZN', label: 'Amazon', newsKeyword: 'Amazon' },
    { symbol: 'TSLA', canonicalSymbol: 'TSLA', label: 'Tesla', newsKeyword: 'Tesla' },
    { symbol: 'NVDA', canonicalSymbol: 'NVDA', label: 'Nvidia', newsKeyword: 'Nvidia' },
    { symbol: 'AMD', canonicalSymbol: 'AMD', label: 'AMD', newsKeyword: 'AMD' },
    { symbol: 'META', canonicalSymbol: 'META', label: 'Meta', newsKeyword: 'Meta' },
    { symbol: 'NFLX', canonicalSymbol: 'NFLX', label: 'Netflix', newsKeyword: 'Netflix' },
    { symbol: 'JPM', canonicalSymbol: 'JPM', label: 'JPMorgan', newsKeyword: 'JPMorgan' },
    { symbol: 'BRK.B', canonicalSymbol: 'BRKB', label: 'Berkshire Hathaway', newsKeyword: 'Berkshire Hathaway' },
    { symbol: 'INTC', canonicalSymbol: 'INTC', label: 'Intel', newsKeyword: 'Intel' },
    { symbol: 'TSM', canonicalSymbol: 'TSM', label: 'TSMC', newsKeyword: 'TSMC' },
];
// SPDR sector ETFs — the standard free-data proxy for "sector performance" widgets.
const SECTORS = [
    { symbol: 'XLK', canonicalSymbol: 'XLK', label: 'Technology' },
    { symbol: 'XLE', canonicalSymbol: 'XLE', label: 'Energy' },
    { symbol: 'XLV', canonicalSymbol: 'XLV', label: 'Healthcare' },
    { symbol: 'XLF', canonicalSymbol: 'XLF', label: 'Financials' },
    { symbol: 'XLY', canonicalSymbol: 'XLY', label: 'Consumer' },
];
const CRYPTO = [
    { id: 'bitcoin', symbol: 'BTC', canonicalSymbol: 'BTC', label: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', canonicalSymbol: 'ETH', label: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', canonicalSymbol: 'SOL', label: 'Solana' },
];
const FOREX = [
    { symbol: 'EUR/USD', canonicalSymbol: 'EURUSD', label: 'EUR/USD' },
    { symbol: 'GBP/USD', canonicalSymbol: 'GBPUSD', label: 'GBP/USD' },
    { symbol: 'USD/JPY', canonicalSymbol: 'USDJPY', label: 'USD/JPY' },
    { symbol: 'USD/INR', canonicalSymbol: 'USDINR', label: 'USD/INR' },
    { symbol: 'USD/CNY', canonicalSymbol: 'USDCNY', label: 'USD/CNY' },
    { symbol: 'USD/BRL', canonicalSymbol: 'USDBRL', label: 'USD/BRL' },
];
// Individual country indices (as US-listed ETF proxies, same technique as
// GLOBAL_INDICES) — powers the /world page's per-country breakdown, which needs
// more granularity than the 4 broad region proxies above.
const COUNTRY_INDICES = [
    { symbol: 'EWZ', canonicalSymbol: 'BOVESPA', label: 'Bovespa (EWZ)' },
    { symbol: 'EWU', canonicalSymbol: 'FTSE100', label: 'FTSE 100 (EWU)' },
    { symbol: 'EWG', canonicalSymbol: 'DAX', label: 'DAX (EWG)' },
    { symbol: 'EWQ', canonicalSymbol: 'CAC40', label: 'CAC 40 (EWQ)' },
    { symbol: 'EWJ', canonicalSymbol: 'NIKKEI', label: 'Nikkei 225 (EWJ)' },
    { symbol: 'EWH', canonicalSymbol: 'HANGSENG', label: 'Hang Seng (EWH)' },
    { symbol: 'ASHR', canonicalSymbol: 'SHANGHAI', label: 'Shanghai / CSI 300 (ASHR)' },
    { symbol: 'EWP', canonicalSymbol: 'IBEX35', label: 'IBEX 35 (EWP)' },
    { symbol: 'EWI', canonicalSymbol: 'FTSEMIB', label: 'FTSE MIB (EWI)' },
    { symbol: 'EWY', canonicalSymbol: 'KOSPI', label: 'Kospi (EWY)' },
    { symbol: 'EWA', canonicalSymbol: 'ASX200', label: 'ASX 200 (EWA)' },
    { symbol: 'INDA', canonicalSymbol: 'SENSEX', label: 'Sensex / Nifty (INDA)' },
];
// Alpha Vantage has no gold endpoint on its free commodities API — Gold is sourced
// from Twelve Data's XAU/USD spot pair instead (same fetcher as forex).
const COMMODITIES_ALPHA_VANTAGE = [
    { fn: 'WTI', canonicalSymbol: 'WTI', label: 'Crude Oil (WTI)' },
    { fn: 'BRENT', canonicalSymbol: 'BRENT', label: 'Crude Oil (Brent)' },
    { fn: 'NATURAL_GAS', canonicalSymbol: 'NATGAS', label: 'Natural Gas' },
    { fn: 'COPPER', canonicalSymbol: 'COPPER', label: 'Copper' },
];
const GOLD = { symbol: 'XAU/USD', canonicalSymbol: 'XAUUSD', label: 'Gold' };
const BONDS = [
    { series: 'DGS3MO', canonicalSymbol: 'DGS3MO', label: '3-Month Treasury' },
    { series: 'DGS2', canonicalSymbol: 'DGS2', label: '2-Year Treasury' },
    { series: 'DGS10', canonicalSymbol: 'DGS10', label: '10-Year Treasury' },
    { series: 'DGS30', canonicalSymbol: 'DGS30', label: '30-Year Treasury' },
];

const isConfigured = (key) => typeof fetch === 'function' && !!key;

// ── Provider health (Step 4: "Market Data Health" panel) ───────────────────────
// In-memory only — resets on process restart, which is fine for an ops-visibility
// panel; it reflects "since this instance started", not a persisted SLA record.
const health = {
    finnhub: { status: isConfigured(FINNHUB_KEY) ? 'unknown' : 'unconfigured', message: null, checkedAt: null },
    twelveData: { status: isConfigured(TWELVE_DATA_KEY) ? 'unknown' : 'unconfigured', message: null, checkedAt: null },
    alphaVantage: { status: isConfigured(ALPHA_VANTAGE_KEY) ? 'unknown' : 'unconfigured', message: null, checkedAt: null },
    fred: { status: isConfigured(FRED_KEY) ? 'unknown' : 'unconfigured', message: null, checkedAt: null },
    binance: { status: 'unknown', message: null, checkedAt: null }, // keyless — never "unconfigured"
};

function setHealth(provider, status, message = null) {
    health[provider] = { status, message, checkedAt: new Date().toISOString() };
}

// ── Cache helper — also stamps fetchedAt/nextRefreshAt (Step 5) ────────────────
async function cachedWithMeta(key, ttlSeconds, fetcher) {
    const hit = await cacheService.get(key);
    if (hit) return hit;
    const value = await fetcher();
    if (value === null || value === undefined) return null;
    const withMeta = {
        ...value,
        fetchedAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
    await cacheService.set(key, withMeta, ttlSeconds);
    return withMeta;
}

// Same idea as cachedWithMeta but for array/list payloads (e.g. the economic
// calendar) — no fetchedAt/nextRefreshAt stamping, since `{...array}` would
// silently turn the array into a numeric-keyed object.
async function cachedList(key, ttlSeconds, fetcher) {
    const hit = await cacheService.get(key);
    if (hit) return hit;
    const value = await fetcher();
    if (value === null || value === undefined) return null;
    await cacheService.set(key, value, ttlSeconds);
    return value;
}

async function safeFetch(label, fn) {
    try {
        return await fn();
    } catch (err) {
        log.warn({ label, err: err && err.message }, 'market-data provider fetch failed');
        return null;
    }
}

async function fetchFinnhubQuote(symbol) {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
    if (res.status === 429) { setHealth('finnhub', 'rate_limited', 'HTTP 429'); throw new Error(`finnhub ${symbol} 429`); }
    if (!res.ok) { setHealth('finnhub', 'error', `HTTP ${res.status}`); throw new Error(`finnhub ${symbol} ${res.status}`); }
    const j = await res.json();
    if (j.c == null || j.c === 0) { setHealth('finnhub', 'error', `empty quote for ${symbol}`); return null; }
    setHealth('finnhub', 'ok');
    return {
        price: j.c, change: j.d, changePercent: j.dp,
        high: j.h, low: j.l, open: j.o, prevClose: j.pc,
        asOf: j.t ? new Date(j.t * 1000).toISOString() : new Date().toISOString(),
    };
}

async function fetchTwelveDataQuote(symbol) {
    const res = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_KEY}`);
    if (res.status === 429) { setHealth('twelveData', 'rate_limited', 'HTTP 429'); throw new Error(`twelvedata ${symbol} 429`); }
    if (!res.ok) { setHealth('twelveData', 'error', `HTTP ${res.status}`); throw new Error(`twelvedata ${symbol} ${res.status}`); }
    const j = await res.json();
    if (j.code === 429 || (j.status === 'error' && /limit/i.test(j.message || ''))) {
        setHealth('twelveData', 'rate_limited', j.message || 'rate limited');
        return null;
    }
    if (j.status === 'error' || j.code) { setHealth('twelveData', 'error', j.message || `code ${j.code}`); return null; }
    setHealth('twelveData', 'ok');
    return {
        price: Number(j.close), change: Number(j.change), changePercent: Number(j.percent_change),
        high: Number(j.high), low: Number(j.low), open: Number(j.open), prevClose: Number(j.previous_close),
        asOf: j.datetime || new Date().toISOString(),
    };
}

async function fetchAlphaVantageCommodity(fn) {
    const res = await fetch(`https://www.alphavantage.co/query?function=${fn}&interval=daily&apikey=${ALPHA_VANTAGE_KEY}`);
    if (!res.ok) { setHealth('alphaVantage', 'error', `HTTP ${res.status}`); throw new Error(`alphavantage ${fn} ${res.status}`); }
    const j = await res.json();
    if (j.Note || j.Information) { setHealth('alphaVantage', 'rate_limited', j.Note || j.Information); return null; }
    const series = Array.isArray(j.data) ? j.data.filter((d) => d.value !== '.') : [];
    if (series.length === 0) { setHealth('alphaVantage', 'error', `no data for ${fn}`); return null; }
    setHealth('alphaVantage', 'ok');
    const [latest, prev] = series;
    const price = Number(latest.value);
    const prevPrice = prev ? Number(prev.value) : null;
    const change = prevPrice != null ? price - prevPrice : null;
    const changePercent = prevPrice ? (change / prevPrice) * 100 : null;
    return { price, change, changePercent, asOf: latest.date };
}

async function fetchFredSeries(seriesId) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=2`;
    const res = await fetch(url);
    if (res.status === 429) { setHealth('fred', 'rate_limited', 'HTTP 429'); throw new Error(`fred ${seriesId} 429`); }
    if (!res.ok) { setHealth('fred', 'error', `HTTP ${res.status}`); throw new Error(`fred ${seriesId} ${res.status}`); }
    const j = await res.json();
    const obs = (j.observations || []).filter((o) => o.value !== '.');
    if (obs.length === 0) { setHealth('fred', 'error', `no observations for ${seriesId}`); return null; }
    setHealth('fred', 'ok');
    const [latest, prev] = obs;
    const value = Number(latest.value);
    const prevValue = prev ? Number(prev.value) : null;
    const change = prevValue != null ? value - prevValue : null;
    return { value, change, asOf: latest.date };
}

async function fetchBinancePrices() {
    const symbols = CRYPTO.map((c) => `${c.symbol}USDT`);
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
    // 418 = Binance's own "IP banned for repeated 429s" code, on top of the standard 429.
    if (res.status === 429 || res.status === 418) { setHealth('binance', 'rate_limited', `HTTP ${res.status}`); throw new Error(`binance ${res.status}`); }
    if (!res.ok) { setHealth('binance', 'error', `HTTP ${res.status}`); throw new Error(`binance ${res.status}`); }
    const arr = await res.json();
    setHealth('binance', 'ok');
    const bySymbol = new Map(arr.map((t) => [t.symbol, t]));
    const now = new Date().toISOString();
    const out = {};
    for (const c of CRYPTO) {
        const t = bySymbol.get(`${c.symbol}USDT`);
        if (!t) { out[c.id] = null; continue; }
        const price = Number(t.lastPrice);
        const changePercent = Number(t.priceChangePercent);
        const change = Number(t.priceChange);
        out[c.id] = { price, change, changePercent, asOf: now };
    }
    return out;
}

async function getQuoteGroup(list, cacheKeyPrefix) {
    if (!isConfigured(FINNHUB_KEY)) return list.map((s) => ({ ...s, source: 'Finnhub', quote: null }));
    return Promise.all(list.map(async (s) => ({
        ...s,
        source: 'Finnhub',
        quote: await cachedWithMeta(`cms:market-data:${cacheKeyPrefix}:${s.symbol}`, TTL.quote, () => safeFetch(s.symbol, () => fetchFinnhubQuote(s.symbol))),
    })));
}

async function getForex() {
    if (!isConfigured(TWELVE_DATA_KEY)) return FOREX.map((s) => ({ ...s, source: 'Twelve Data', quote: null }));
    return Promise.all(FOREX.map(async (s) => ({
        ...s,
        source: 'Twelve Data',
        quote: await cachedWithMeta(`cms:market-data:forex:${s.symbol}`, TTL.forex, () => safeFetch(s.symbol, () => fetchTwelveDataQuote(s.symbol))),
    })));
}

async function getGold() {
    if (!isConfigured(TWELVE_DATA_KEY)) return { ...GOLD, source: 'Twelve Data', quote: null };
    const quote = await cachedWithMeta(`cms:market-data:forex:${GOLD.symbol}`, TTL.forex, () => safeFetch(GOLD.symbol, () => fetchTwelveDataQuote(GOLD.symbol)));
    return { ...GOLD, source: 'Twelve Data', quote };
}

async function getCommodities() {
    const gold = await getGold(); // sourced from Twelve Data, not Alpha Vantage — cached under its own key
    if (!isConfigured(ALPHA_VANTAGE_KEY)) {
        return [gold, ...COMMODITIES_ALPHA_VANTAGE.map((c) => ({ ...c, source: 'Alpha Vantage', quote: null }))];
    }
    // Alpha Vantage's free tier trips on concurrent bursts even inside its 25/day
    // budget — confirmed each of these 4 calls succeeds alone but returns empty
    // when fired together via Promise.all. Fetch sequentially with a stagger,
    // and only on a cache miss (a cache hit resolves instantly, no need to wait).
    const results = [gold];
    for (const c of COMMODITIES_ALPHA_VANTAGE) {
        const key = `cms:market-data:commodity:${c.fn}`;
        const hit = await cacheService.get(key);
        let quote = hit;
        if (!hit) {
            const value = await safeFetch(c.fn, () => fetchAlphaVantageCommodity(c.fn));
            if (value !== null && value !== undefined) {
                quote = { ...value, fetchedAt: new Date().toISOString(), nextRefreshAt: new Date(Date.now() + TTL.commodity * 1000).toISOString() };
                await cacheService.set(key, quote, TTL.commodity);
            } else {
                quote = null;
            }
            await new Promise((resolve) => setTimeout(resolve, 1200));
        }
        results.push({ ...c, source: 'Alpha Vantage', quote });
    }
    return results;
}

async function getCrypto() {
    if (!isConfigured(FINNHUB_KEY) && typeof fetch !== 'function') return CRYPTO.map((c) => ({ ...c, source: 'Binance', quote: null }));
    const batch = await cachedWithMeta('cms:market-data:crypto:batch', TTL.crypto, () => safeFetch('binance', fetchBinancePrices));
    if (!batch) return CRYPTO.map((c) => ({ ...c, source: 'Binance', quote: null }));
    return CRYPTO.map((c) => ({
        ...c,
        source: 'Binance',
        quote: batch[c.id] ? { ...batch[c.id], fetchedAt: batch.fetchedAt, nextRefreshAt: batch.nextRefreshAt } : null,
    }));
}

async function getBonds() {
    if (!isConfigured(FRED_KEY)) return BONDS.map((b) => ({ ...b, source: 'FRED', quote: null }));
    return Promise.all(BONDS.map(async (b) => ({
        ...b,
        source: 'FRED',
        quote: await cachedWithMeta(`cms:market-data:bond:${b.series}`, TTL.bond, () => safeFetch(b.series, () => fetchFredSeries(b.series))),
    })));
}

async function getSectors() {
    return getQuoteGroup(SECTORS, 'sector');
}

// ── Step 2 (this round): Market Movers — ranked from the live stock quotes ─────
function computeMovers(stocks) {
    const withQuotes = stocks.filter((s) => s.quote && s.quote.changePercent != null);
    const sorted = [...withQuotes].sort((a, b) => b.quote.changePercent - a.quote.changePercent);
    return {
        gainers: sorted.slice(0, 3).map((s) => ({ symbol: s.symbol, label: s.label, changePercent: s.quote.changePercent, price: s.quote.price })),
        losers: sorted.slice(-3).reverse().map((s) => ({ symbol: s.symbol, label: s.label, changePercent: s.quote.changePercent, price: s.quote.price })),
    };
}

// ── Step 4 (this round): Economic Calendar — real FRED release dates, no fabricated
// intraday times. Finnhub's /calendar/economic is premium-only on the free tier
// (confirmed via live 403), so FRED's release calendar is the only genuinely free
// source available here.
async function fetchFredReleaseCalendar() {
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://api.stlouisfed.org/fred/releases/dates?api_key=${FRED_KEY}&file_type=json&sort_order=asc&realtime_start=${today}&limit=20&include_release_dates_with_no_data=false`;
    const res = await fetch(url);
    if (res.status === 429) { setHealth('fred', 'rate_limited', 'HTTP 429'); throw new Error('fred calendar 429'); }
    if (!res.ok) { setHealth('fred', 'error', `HTTP ${res.status}`); throw new Error(`fred calendar ${res.status}`); }
    const j = await res.json();
    setHealth('fred', 'ok');
    const seen = new Set();
    const events = [];
    for (const r of j.release_dates || []) {
        const dedupeKey = `${r.date}:${r.release_name}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        events.push({ date: r.date, releaseName: r.release_name });
        if (events.length >= 12) break;
    }
    return events;
}

async function getEconomicCalendar() {
    if (!isConfigured(FRED_KEY)) return [];
    const events = await cachedList('cms:market-data:economic-calendar', TTL.bond, () => safeFetch('fred-calendar', fetchFredReleaseCalendar));
    return events || [];
}

// ── Step 6: related news — links each stock to its latest Imperialpedia coverage ──
async function getRelatedNewsFor(newsKeyword, websiteId) {
    if (!websiteId || !newsKeyword) return [];
    const cacheKey = `cms:market-data:news:${websiteId}:${newsKeyword}`;
    const cachedNews = await cacheService.get(cacheKey);
    if (cachedNews) return cachedNews;
    try {
        const { data } = await contentService.listContent(websiteId, {
            search: newsKeyword, status: 'published', page: 1, limit: 3,
        });
        const relatedNews = (data || []).map((item) => ({ id: item.id, title: item.title, publishedAt: item.publishedAt }));
        await cacheService.set(cacheKey, relatedNews, TTL.news);
        return relatedNews;
    } catch (err) {
        log.warn({ newsKeyword, err: err && err.message }, 'related-news lookup failed');
        return [];
    }
}

async function attachRelatedNews(stocks, websiteId) {
    return Promise.all(stocks.map(async (s) => ({ ...s, relatedNews: await getRelatedNewsFor(s.newsKeyword, websiteId) })));
}

// ── Step 5 (this round): quote page template — DB-driven via market_assets ─────
const PROVIDER_LABEL = {
    finnhub: 'Finnhub', twelvedata: 'Twelve Data', alphavantage: 'Alpha Vantage', fred: 'FRED', binance: 'Binance',
};

// TTLs all stretched to DAY_TTL under the zero-traffic cost-saving policy above —
// interval/outputsize (the actual bar resolution per range) are unchanged, only
// how often each range's series gets re-fetched from Twelve Data.
const RANGE_CONFIG = {
    '1D': { interval: '5min', outputsize: 78, ttl: DAY_TTL },
    '5D': { interval: '30min', outputsize: 65, ttl: DAY_TTL },
    '1M': { interval: '1day', outputsize: 22, ttl: DAY_TTL },
    '6M': { interval: '1day', outputsize: 130, ttl: DAY_TTL },
    'YTD': { interval: '1day', outputsize: 260, ttl: DAY_TTL }, // fetched then date-filtered to Jan 1
    '1Y': { interval: '1day', outputsize: 260, ttl: DAY_TTL },
    '5Y': { interval: '1week', outputsize: 260, ttl: DAY_TTL }, // verified live: 260wk = ~5Y history
    'MAX': { interval: '1month', outputsize: 300, ttl: DAY_TTL }, // verified live: 300mo reaches ~2001
};

// A fixed daily-260 series (independent of the user's selected chart range) used
// for technical indicators — SMA200 needs 200+ daily points, which YTD/5D/etc.
// ranges often don't have.
const INDICATOR_SERIES_CONFIG = { interval: '1day', outputsize: 260, ttl: DAY_TTL };
// A fixed weekly-260 (~5Y) series used for the Performance Summary, independent of
// the chart range selector, so switching chart ranges never changes these numbers.
const PERFORMANCE_SERIES_CONFIG = { interval: '1week', outputsize: 260, ttl: DAY_TTL };

async function fetchTwelveDataOhlcv(symbol, interval, outputsize) {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_KEY}`;
    const res = await fetch(url);
    if (res.status === 429) { setHealth('twelveData', 'rate_limited', 'HTTP 429 (series)'); throw new Error('twelvedata series 429'); }
    if (!res.ok) { setHealth('twelveData', 'error', `HTTP ${res.status}`); throw new Error(`twelvedata series ${res.status}`); }
    const j = await res.json();
    if (j.status === 'error') { setHealth('twelveData', 'error', j.message); return null; }
    setHealth('twelveData', 'ok');
    // Twelve Data returns newest-first; a chart/table reads left-to-right oldest-first.
    return (j.values || []).slice().reverse().map((v) => ({
        date: v.datetime,
        open: Number(v.open), high: Number(v.high), low: Number(v.low), close: Number(v.close),
        volume: v.volume != null ? Number(v.volume) : null,
    }));
}

async function getChart(providerSymbol, range) {
    if (!isConfigured(TWELVE_DATA_KEY)) return [];
    const cfg = RANGE_CONFIG[range] || RANGE_CONFIG['1M'];
    const key = `cms:market-data:chart:${providerSymbol}:${range}`;
    const series = await cachedList(key, cfg.ttl, () => safeFetch(`${providerSymbol}-chart`, () => fetchTwelveDataOhlcv(providerSymbol, cfg.interval, cfg.outputsize)));
    if (!series) return [];
    if (range === 'YTD') {
        const jan1 = `${new Date().getFullYear()}-01-01`;
        return series.filter((row) => row.date >= jan1);
    }
    return series;
}

async function getIndicatorSeries(providerSymbol) {
    if (!isConfigured(TWELVE_DATA_KEY)) return [];
    const key = `cms:market-data:indicator-series:${providerSymbol}`;
    const cfg = INDICATOR_SERIES_CONFIG;
    const series = await cachedList(key, cfg.ttl, () => safeFetch(`${providerSymbol}-indicators`, () => fetchTwelveDataOhlcv(providerSymbol, cfg.interval, cfg.outputsize)));
    return series || [];
}

async function getPerformanceSeries(providerSymbol) {
    if (!isConfigured(TWELVE_DATA_KEY)) return [];
    const key = `cms:market-data:performance-series:${providerSymbol}`;
    const cfg = PERFORMANCE_SERIES_CONFIG;
    const series = await cachedList(key, cfg.ttl, () => safeFetch(`${providerSymbol}-performance`, () => fetchTwelveDataOhlcv(providerSymbol, cfg.interval, cfg.outputsize)));
    return series || [];
}

// Finds the closest bar at-or-before a target date and returns % change to latest close.
function percentChangeSince(series, targetDate) {
    if (!series.length) return null;
    const latest = series[series.length - 1].close;
    const bar = [...series].reverse().find((row) => row.date <= targetDate) || series[0];
    if (!bar || !bar.close) return null;
    return ((latest - bar.close) / bar.close) * 100;
}

function computePerformanceSummary(series, todayChangePercent) {
    if (!series.length) return { today: todayChangePercent ?? null, week: null, month: null, ytd: null, oneYear: null, fiveYear: null };
    const latest = series[series.length - 1];
    const d = new Date(latest.date);
    const iso = (dt) => dt.toISOString().slice(0, 10);
    const weekAgo = new Date(d); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(d); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(d); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const jan1 = `${d.getFullYear()}-01-01`;
    return {
        today: todayChangePercent ?? null,
        week: percentChangeSince(series, iso(weekAgo)),
        month: percentChangeSince(series, iso(monthAgo)),
        ytd: percentChangeSince(series, jan1),
        oneYear: percentChangeSince(series, iso(yearAgo)),
        fiveYear: percentChangeSince(series, series[0].date),
    };
}

async function fetchFinnhubFundamentals(symbol) {
    const [metricRes, profileRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_KEY}`),
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`),
    ]);
    if (!metricRes.ok || !profileRes.ok) { setHealth('finnhub', 'error', 'fundamentals fetch failed'); return null; }
    const [metricJson, profileJson] = await Promise.all([metricRes.json(), profileRes.json()]);
    const m = metricJson.metric || {};
    setHealth('finnhub', 'ok');
    return {
        marketCap: m.marketCapitalization ?? profileJson.marketCapitalization ?? null,
        peRatio: m.peTTM ?? m.peExclExtraTTM ?? null,
        week52High: m['52WeekHigh'] ?? null,
        week52Low: m['52WeekLow'] ?? null,
        dividendYield: m.currentDividendYieldTTM ?? null,
        industry: profileJson.finnhubIndustry ?? null,
        // Finnhub's basic-financials `metric` payload already carries this
        // (5Y monthly beta vs. the index) — was being fetched and discarded.
        beta: m.beta ?? null,
    };
}

async function getFundamentals(providerSymbol) {
    if (!isConfigured(FINNHUB_KEY)) return null;
    const key = `cms:market-data:fundamentals:${providerSymbol}`;
    return cachedList(key, DAY_TTL, () => safeFetch(`${providerSymbol}-fundamentals`, () => fetchFinnhubFundamentals(providerSymbol)));
}

// Volume/average volume/live session flag — Finnhub's free /quote omits volume
// entirely, but Twelve Data's /quote includes it (verified live). Supplementary
// call, used only on the quote-detail page, not the overview (keeps overview's
// Twelve Data budget for forex/gold).
async function fetchTwelveDataVolumeDetail(symbol) {
    const res = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_KEY}`);
    if (res.status === 429) { setHealth('twelveData', 'rate_limited', 'HTTP 429 (volume)'); throw new Error('twelvedata volume 429'); }
    if (!res.ok) { setHealth('twelveData', 'error', `HTTP ${res.status}`); throw new Error(`twelvedata volume ${res.status}`); }
    const j = await res.json();
    if (j.status === 'error' || j.code) return null;
    setHealth('twelveData', 'ok');
    return {
        volume: j.volume != null ? Number(j.volume) : null,
        averageVolume: j.average_volume != null ? Number(j.average_volume) : null,
    };
}

async function getVolumeDetail(providerSymbol) {
    if (!isConfigured(TWELVE_DATA_KEY)) return null;
    const key = `cms:market-data:volume:${providerSymbol}`;
    return cachedList(key, DAY_TTL, () => safeFetch(`${providerSymbol}-volume`, () => fetchTwelveDataVolumeDetail(providerSymbol)));
}

// Related companies — Finnhub's free /stock/peers, filtered down to symbols we
// actually track in market_assets so every rendered link resolves to a working
// quote page instead of a dead end.
async function fetchFinnhubPeers(symbol) {
    const res = await fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
    if (!res.ok) { setHealth('finnhub', 'error', `HTTP ${res.status} (peers)`); throw new Error(`finnhub peers ${res.status}`); }
    const j = await res.json();
    setHealth('finnhub', 'ok');
    return Array.isArray(j) ? j.filter((s) => s !== symbol) : [];
}

async function getRelatedCompanies(asset) {
    if (asset.type !== 'stock' || asset.provider !== 'finnhub' || !isConfigured(FINNHUB_KEY)) return [];
    const key = `cms:market-data:peers:${asset.providerSymbol}`;
    const peers = await cachedList(key, DAY_TTL, () => safeFetch(`${asset.providerSymbol}-peers`, () => fetchFinnhubPeers(asset.providerSymbol)));
    if (!peers || peers.length === 0) return [];
    const db = require('../models');
    const known = await db.MarketAsset.findAll({
        where: { providerSymbol: peers.slice(0, 10), isActive: true },
        attributes: ['symbol', 'name', 'providerSymbol'],
    });
    return known.map((k) => ({ symbol: k.symbol, name: k.name }));
}

async function getQuoteForAsset(asset) {
    // Reuse the same per-provider fetchers as the overview, keyed by the asset's own provider_symbol.
    switch (asset.provider) {
        case 'finnhub':
            return cachedWithMeta(`cms:market-data:quote-page:${asset.providerSymbol}`, TTL.quote, () => safeFetch(asset.providerSymbol, () => fetchFinnhubQuote(asset.providerSymbol)));
        case 'twelvedata':
            return cachedWithMeta(`cms:market-data:quote-page:${asset.providerSymbol}`, TTL.forex, () => safeFetch(asset.providerSymbol, () => fetchTwelveDataQuote(asset.providerSymbol)));
        case 'alphavantage':
            return cachedWithMeta(`cms:market-data:quote-page:${asset.providerSymbol}`, TTL.commodity, () => safeFetch(asset.providerSymbol, () => fetchAlphaVantageCommodity(asset.providerSymbol)));
        case 'fred':
            return cachedWithMeta(`cms:market-data:quote-page:${asset.providerSymbol}`, TTL.bond, () => safeFetch(asset.providerSymbol, () => fetchFredSeries(asset.providerSymbol)));
        case 'binance': {
            const batch = await cachedWithMeta('cms:market-data:crypto:batch', TTL.crypto, () => safeFetch('binance', fetchBinancePrices));
            const entry = batch && batch[asset.providerSymbol];
            return entry ? { ...entry, fetchedAt: batch.fetchedAt, nextRefreshAt: batch.nextRefreshAt } : null;
        }
        default:
            return null;
    }
}

async function getQuote(symbol, websiteId, range = '1M') {
    const db = require('../models');
    const asset = await db.MarketAsset.findOne({ where: { symbol: symbol.toUpperCase(), isActive: true } });
    if (!asset) return null;

    const hasIntradayChart = asset.type === 'stock' || asset.type === 'index';

    const [quote, chart, indicatorSeries, performanceSeries, fundamentals, volumeDetail, relatedCompanies, relatedNews] = await Promise.all([
        getQuoteForAsset(asset),
        hasIntradayChart ? getChart(asset.providerSymbol, range) : Promise.resolve([]),
        hasIntradayChart ? getIndicatorSeries(asset.providerSymbol) : Promise.resolve([]),
        hasIntradayChart ? getPerformanceSeries(asset.providerSymbol) : Promise.resolve([]),
        (asset.type === 'stock' && asset.provider === 'finnhub') ? getFundamentals(asset.providerSymbol) : Promise.resolve(null),
        hasIntradayChart ? getVolumeDetail(asset.providerSymbol) : Promise.resolve(null),
        getRelatedCompanies(asset),
        getRelatedNewsFor(asset.newsKeyword, websiteId),
    ]);

    const indicators = indicatorSeries.length ? computeIndicators(indicatorSeries.map((r) => r.close)) : null;
    const performance = computePerformanceSummary(performanceSeries, quote?.changePercent ?? null);
    const marketStatus = marketHours.getAssetMarketStatus(asset.type);

    return {
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        exchange: asset.exchange,
        currency: asset.currency,
        logoUrl: asset.logoUrl,
        source: PROVIDER_LABEL[asset.provider] || asset.provider,
        marketStatus,
        quote,
        volume: volumeDetail,
        chart,
        historical: chart,
        performance,
        indicators,
        fundamentals,
        relatedCompanies,
        relatedNews,
    };
}

async function getOverview(websiteId) {
    const [usIndices, globalIndices, countryIndices, stocksRaw, sectors, crypto, forex, commodities, bonds, economicCalendar] = await Promise.all([
        getQuoteGroup(US_INDICES, 'index'),
        getQuoteGroup(GLOBAL_INDICES, 'global'),
        getQuoteGroup(COUNTRY_INDICES, 'country'),
        getQuoteGroup(STOCKS, 'stock'),
        getSectors(),
        getCrypto(),
        getForex(),
        getCommodities(),
        getBonds(),
        getEconomicCalendar(),
    ]);
    const stocks = await attachRelatedNews(stocksRaw, websiteId);
    const movers = computeMovers(stocks);

    return {
        exchangeStatus: marketHours.getAllExchangeStatuses(),
        usIndices, globalIndices, countryIndices, stocks, sectors, crypto, forex, commodities, bonds,
        movers, economicCalendar,
        providers: {
            finnhub: isConfigured(FINNHUB_KEY),
            twelveData: isConfigured(TWELVE_DATA_KEY),
            alphaVantage: isConfigured(ALPHA_VANTAGE_KEY),
            fred: isConfigured(FRED_KEY),
            binance: true,
        },
        health,
        generatedAt: new Date().toISOString(),
    };
}

module.exports = { getOverview, getQuote };
