/**
 * Live data layer for the CNBC-style World page (/world/?region=).
 *
 * Real data, fetched server-side with ISR caching, with graceful fallback to the
 * static demo set (./worldRegions) on any failure — the page can never break:
 *
 *   • Markets / indices / FX / commodities / crypto → imperialpedia-service /assets
 *     (synced from cms-service's live Finnhub/Twelve Data/Alpha Vantage/FRED/
 *     CoinGecko pipeline — market_assets is the single source of truth). Falls
 *     back to Yahoo Finance (keyless) only if that pipeline is unreachable.
 *   • Watchlist megacaps                             → same, Yahoo fallback
 *   • News: hero, live "Latest", topical sections    → GDELT 2.0 doc API (keyless)
 *   • Owned editorial blended into the feed          → Baalvion CMS (cms-service)
 *
 * All upstream calls are keyless and run only on the server. Next's data cache
 * (`next.revalidate`) means each upstream is hit at most once per window
 * regardless of traffic, so the page stays fast and we never hammer Yahoo/GDELT.
 */

import { CMS_CACHE_TAG } from "@/lib/cache-tags";
import type { CmsContent } from "@/services/data/cms-public";
import { categoryImage } from "./categoryImage";
import { safeImageUrl } from "@/lib/safe-image";
import {
  getWorldData,
  resolveRegion,
  type FeaturedStory,
  type Indicator,
  type MarketRegionGroup,
  type RegionId,
  type WorldData,
} from "./worldRegions";

// ── Yahoo symbol config ─────────────────────────────────────────────────────

type Kind = "index" | "fx" | "commodity" | "crypto" | "yield";

interface SymbolDef {
  symbol: string;
  name: string;
  dec: number;
  suffix?: string;
  kind: Kind;
  /** Markets-panel grouping (used for the World view). */
  group?: "Americas" | "Europe" | "Asia-Pacific";
}

const s = (
  symbol: string,
  name: string,
  dec: number,
  kind: Kind,
  group?: SymbolDef["group"],
  suffix?: string,
): SymbolDef => ({ symbol, name, dec, kind, group, suffix });

const YAHOO_SYMBOLS: Record<RegionId, SymbolDef[]> = {
  world: [
    s("^DJI", "Dow Jones", 2, "index", "Americas"),
    s("^GSPC", "S&P 500", 2, "index", "Americas"),
    s("^IXIC", "Nasdaq", 2, "index", "Americas"),
    s("^BVSP", "Bovespa", 0, "index", "Americas"),
    s("^FTSE", "FTSE 100", 2, "index", "Europe"),
    s("^GDAXI", "DAX", 2, "index", "Europe"),
    s("^FCHI", "CAC 40", 2, "index", "Europe"),
    s("^N225", "Nikkei 225", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("GC=F", "Gold", 2, "commodity"),
    s("CL=F", "Crude (WTI)", 2, "commodity"),
    s("BTC-USD", "Bitcoin", 0, "crypto"),
    s("EURUSD=X", "EUR/USD", 4, "fx"),
  ],
  us: [
    s("^DJI", "Dow Jones", 2, "index", "Americas"),
    s("^GSPC", "S&P 500", 2, "index", "Americas"),
    s("^IXIC", "Nasdaq", 2, "index", "Americas"),
    s("^RUT", "Russell 2000", 2, "index", "Americas"),
    s("^TNX", "10-Yr Yield", 3, "yield", undefined, "%"),
    s("^VIX", "VIX", 2, "index"),
    s("GC=F", "Gold", 2, "commodity"),
    s("CL=F", "Crude (WTI)", 2, "commodity"),
  ],
  europe: [
    s("^FTSE", "FTSE 100", 2, "index", "Europe"),
    s("^GDAXI", "DAX", 2, "index", "Europe"),
    s("^FCHI", "CAC 40", 2, "index", "Europe"),
    s("^IBEX", "IBEX 35", 2, "index", "Europe"),
    s("^STOXX", "STOXX 600", 2, "index", "Europe"),
    s("FTSEMIB.MI", "FTSE MIB", 0, "index", "Europe"),
    s("EURUSD=X", "EUR/USD", 4, "fx"),
    s("BZ=F", "Brent", 2, "commodity"),
  ],
  asia: [
    s("^N225", "Nikkei 225", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("^KS11", "Kospi", 2, "index", "Asia-Pacific"),
    s("^AXJO", "ASX 200", 2, "index", "Asia-Pacific"),
    s("^BSESN", "Sensex", 2, "index", "Asia-Pacific"),
    s("^NSEI", "Nifty 50", 2, "index", "Asia-Pacific"),
    s("JPY=X", "USD/JPY", 2, "fx"),
  ],
  china: [
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("399001.SZ", "Shenzhen", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000300.SS", "CSI 300", 2, "index", "Asia-Pacific"),
    s("399006.SZ", "ChiNext", 2, "index", "Asia-Pacific"),
    s("CNY=X", "USD/CNY", 4, "fx"),
  ],
  emerging: [
    s("^BVSP", "Bovespa", 0, "index", "Americas"),
    s("^BSESN", "Sensex", 2, "index", "Asia-Pacific"),
    s("^NSEI", "Nifty 50", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("BRL=X", "USD/BRL", 4, "fx"),
    s("INR=X", "USD/INR", 2, "fx"),
  ],
};

const WATCHLIST_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "JPM", name: "JPMorgan" },
];

// ── Admin World Control config (imperialpedia-service) ──────────────────────
// Editors control the markets, watchlist and feed settings from the admin
// panel; this reads that config. Falls back to the shipped defaults above.

// Zero-traffic cost-saving policy (2026-08-26): the site has no real visitors
// right now, so there's no reason to re-hit paid market-data providers more
// than once a day — ISR is lazy (only re-fetches on the next request *after*
// this window elapses), so raising it doesn't change anything for an idle
// page, but it caps cost the moment traffic does show up rather than the
// previous 30s window re-fetching on nearly every visit. Bring this back down
// once real traffic / AdSense approval makes fresher data worth the API cost.
export const MARKET_DATA_REVALIDATE_SECONDS = 86400;

// Window for every input to the World feed / "Trending Now" rail: the CMS list,
// the admin world-config, the news-service wire, the Google News fallback.
// Shorter than cms-public.ts's own window because ordering here goes stale on
// its own, with no publish event to fire the webhook. It has to stay well above
// a minute regardless: getWorldDataLive backs <TrendingNowModule>, which is in
// the sidebar of every article, so this is the article template's ISR floor.
const CMS_FEED_REVALIDATE_SECONDS = 3600;

const IMPERIALPEDIA_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1"
    : "http://localhost:3004/api/v1");

interface WorldConfig {
  settings?: { newsFallback?: boolean; refreshSeconds?: number };
  watchlist?: { symbol: string; name: string }[];
  regions?: {
    id: string;
    label?: string;
    enabled?: boolean;
    indices?: Array<Partial<SymbolDef> & { symbol: string; name: string }>;
  }[];
}

async function getWorldConfig(): Promise<WorldConfig | null> {
  try {
    const res = await fetch(`${IMPERIALPEDIA_API}/world-config`, {
      // Admin toggles (which indices, which watchlist, is the wire fallback on).
      // Changed a handful of times ever — but getWorldDataLive runs it on every
      // article page too, so a 120s window here set those pages' whole ISR
      // window to 120s.
      next: { revalidate: CMS_FEED_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: WorldConfig };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

const KINDS: Kind[] = ["index", "fx", "commodity", "crypto", "yield"];

function coerceDef(x: Partial<SymbolDef> & { symbol?: string; name?: string }): SymbolDef | null {
  if (!x?.symbol || !x?.name) return null;
  const kind = KINDS.includes(x.kind as Kind) ? (x.kind as Kind) : "index";
  const group =
    x.group === "Americas" || x.group === "Europe" || x.group === "Asia-Pacific"
      ? x.group
      : undefined;
  return {
    symbol: String(x.symbol),
    name: String(x.name),
    dec: Number.isFinite(x.dec) ? Number(x.dec) : 2,
    kind,
    group,
  };
}

// ── Yahoo fetch ─────────────────────────────────────────────────────────────

interface Quote {
  price: number;
  prev: number;
  /** Real regularMarketVolume from Yahoo's chart meta, when present. */
  volume?: number;
}

// ── imperialpedia-service /assets (synced from cms-service's live market-data
// pipeline — Finnhub/Twelve Data/Alpha Vantage/FRED/CoinGecko) — now the PRIMARY
// quote source. Yahoo (below) is kept only as a fallback if imperialpedia-service
// is unreachable, so this page can never go fully dark.
//
// Maps every Yahoo-style symbol used in YAHOO_SYMBOLS/WATCHLIST_SYMBOLS to the
// canonical symbol cms-service's market_assets tracks. A few Yahoo symbols with
// no dedicated proxy (Shenzhen, CSI 300, ChiNext, Nifty 50, STOXX 600) share the
// closest broad China/India/Europe proxy already tracked — an approximation,
// not a 1:1 match, same tradeoff the original 4-region World proxies already made.
export const CANONICAL_SYMBOL_MAP: Record<string, string> = {
  "^DJI": "DJI", "^GSPC": "SPX", "^IXIC": "IXIC", "^RUT": "RUT", "^VIX": "VIX",
  "^BVSP": "BOVESPA", "^FTSE": "FTSE100", "^GDAXI": "DAX", "^FCHI": "CAC40",
  "^IBEX": "IBEX35", "^STOXX": "EUROPE", "FTSEMIB.MI": "FTSEMIB",
  "^N225": "NIKKEI", "^HSI": "HANGSENG", "000001.SS": "SHANGHAI",
  "^KS11": "KOSPI", "^AXJO": "ASX200", "^BSESN": "SENSEX", "^NSEI": "SENSEX",
  "399001.SZ": "SHANGHAI", "000300.SS": "SHANGHAI", "399006.SZ": "SHANGHAI",
  "GC=F": "XAUUSD", "CL=F": "WTI", "BZ=F": "BRENT", "BTC-USD": "BTC",
  "EURUSD=X": "EURUSD", "JPY=X": "USDJPY", "CNY=X": "USDCNY",
  "BRL=X": "USDBRL", "INR=X": "USDINR", "^TNX": "DGS10",
  // Watchlist tickers are already canonical (AAPL/MSFT/NVDA/GOOGL/AMZN/META/TSLA/JPM).
};

async function fetchImperialpediaQuote(canonicalSymbol: string): Promise<Quote> {
  const res = await fetch(`${IMPERIALPEDIA_API}/assets/${encodeURIComponent(canonicalSymbol)}`, {
    next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`assets ${res.status} ${canonicalSymbol}`);
  const json = (await res.json()) as {
    data?: { current_price?: number | string | null; change_pct_24h?: number | string | null; volume_24h?: number | string | null };
  };
  const a = json?.data;
  const price = a?.current_price != null ? Number(a.current_price) : null;
  if (!a || price == null || Number.isNaN(price)) throw new Error(`assets: no price for ${canonicalSymbol}`);
  const changePct = a.change_pct_24h != null ? Number(a.change_pct_24h) : 0;
  const prev = changePct !== 0 ? price / (1 + changePct / 100) : price;
  const volume = a.volume_24h != null ? Number(a.volume_24h) : undefined;
  return { price, prev, volume };
}

/** Primary quote fetch — imperialpedia-service first, Yahoo as a fallback only if
 * the internal pipeline has no mapping for this symbol or is unreachable. */
async function fetchLiveQuote(symbol: string): Promise<Quote> {
  const canonical = CANONICAL_SYMBOL_MAP[symbol] ?? symbol;
  try {
    return await fetchImperialpediaQuote(canonical);
  } catch {
    return fetchYahooQuote(symbol);
  }
}

export async function fetchYahooQuote(symbol: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
    next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`yahoo ${res.status} ${symbol}`);
  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
          regularMarketVolume?: number;
        };
      }>;
    };
  };
  const meta = json?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  if (!meta || price == null) throw new Error(`yahoo: no price for ${symbol}`);
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  return { price, prev, volume: meta.regularMarketVolume };
}

export interface YahooChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

// (range button on /markets/quote/:symbol) -> Yahoo's (range, interval) query params.
// Same v8/finance/chart endpoint fetchYahooQuote already calls, just with the full
// range requested and its OHLC series (fetchYahooQuote only reads `meta`, discarding
// the `indicators.quote[0]` arrays this function parses) instead of always 5d/1d.
const YAHOO_RANGE_CONFIG: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  MAX: { range: "max", interval: "1mo" },
};

/** Yahoo's keyless chart series — used as marketsLoader.ts's getAssetDetail()
 * chart/historical fallback when imperialpedia-service has no asset_summaries
 * row for a symbol yet (currently true for every non-crypto tracked symbol —
 * verified live 2026-08-26). Returns [] rather than throwing on a bad/empty
 * response so the caller can render "no chart data" instead of erroring the page. */
export async function fetchYahooChart(symbol: string, range: string): Promise<YahooChartPoint[]> {
  const cfg = YAHOO_RANGE_CONFIG[range] ?? YAHOO_RANGE_CONFIG["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
      next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: (number | null)[];
              high?: (number | null)[];
              low?: (number | null)[];
              close?: (number | null)[];
              volume?: (number | null)[];
            }>;
          };
        }>;
      };
    };
    const result = json?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!q) return [];
    const intraday = cfg.interval.endsWith("m") || cfg.interval.endsWith("h");
    const points: YahooChartPoint[] = [];
    timestamps.forEach((ts, i) => {
      const open = q.open?.[i], high = q.high?.[i], low = q.low?.[i], close = q.close?.[i];
      if (open == null || high == null || low == null || close == null) return;
      const d = new Date(ts * 1000);
      points.push({
        date: intraday ? d.toISOString().slice(0, 16).replace("T", " ") : d.toISOString().slice(0, 10),
        open, high, low, close,
        volume: q.volume?.[i] ?? null,
      });
    });
    return points;
  } catch {
    return [];
  }
}

const fmt = (n: number, dec: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function toIndicator(def: SymbolDef, q: Quote): Indicator {
  const change = q.price - q.prev;
  const pct = q.prev !== 0 ? (change / q.prev) * 100 : 0;
  const positive = change >= 0;
  const sign = positive ? "+" : "";
  return {
    name: def.name,
    value: fmt(q.price, def.dec) + (def.suffix ?? ""),
    change: sign + fmt(change, def.dec),
    percent: sign + pct.toFixed(2) + "%",
    positive,
    // /markets/quote/{symbol} uses ALL_TRACKED_SYMBOLS' canonical form, not
    // the raw Yahoo ticker (e.g. "DJI", not "^DJI") -- undefined (no link)
    // for instruments this pipeline has no canonical mapping/quote page for.
    symbol: CANONICAL_SYMBOL_MAP[def.symbol],
  };
}

/** Fetch indicators for the given symbol set; null if too few succeed. */
async function buildIndicators(defs: SymbolDef[]): Promise<Indicator[] | null> {
  if (!defs.length) return null;
  const settled = await Promise.allSettled(defs.map((d) => fetchLiveQuote(d.symbol)));
  const out: Indicator[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") out.push(toIndicator(defs[i], r.value));
  });
  // Require a healthy majority before trusting the live set over the fallback.
  return out.length >= Math.ceil(defs.length * 0.6) ? out : null;
}

/** Markets panel derived from the same region quotes (index instruments only). */
function buildMarkets(
  region: RegionId,
  indicators: Indicator[],
  defs: SymbolDef[],
): MarketRegionGroup[] {
  const byName = new Map(indicators.map((i) => [i.name, i]));
  const rows = defs
    .filter((d) => d.kind === "index" && byName.has(d.name))
    .map((d) => {
      const ind = byName.get(d.name)!;
      return {
        name: d.name,
        value: ind.value,
        change: ind.percent,
        positive: ind.positive,
        symbol: ind.symbol,
        group: d.group ?? "Americas",
      };
    });
  if (region === "world") {
    const order: MarketRegionGroup["region"][] = ["Americas", "Europe", "Asia-Pacific"];
    return order
      .map((g) => ({
        region: g,
        markets: rows.filter((r) => r.group === g).map(({ group, ...m }) => m),
      }))
      .filter((g) => g.markets.length > 0);
  }
  return [
    {
      region: resolveRegion(region).label,
      markets: rows.map(({ group, ...m }) => m),
    },
  ];
}

async function buildWatchlist(
  symbols: { symbol: string; name: string }[],
): Promise<WorldData["watchlist"] | null> {
  if (!symbols.length) return null;
  const settled = await Promise.allSettled(symbols.map((w) => fetchLiveQuote(w.symbol)));
  const out: WorldData["watchlist"] = [];
  settled.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const change = r.value.price - r.value.prev;
    const pct = r.value.prev !== 0 ? (change / r.value.prev) * 100 : 0;
    const positive = change >= 0;
    out.push({
      ticker: symbols[i].symbol,
      name: symbols[i].name,
      price: fmt(r.value.price, 2),
      change: (positive ? "+" : "") + pct.toFixed(2) + "%",
      positive,
      volume: r.value.volume,
    });
  });
  return out.length >= Math.min(5, symbols.length) ? out : null;
}

// ── Google News RSS (keyless) ───────────────────────────────────────────────
// Keyless and tolerant of normal traffic (unlike GDELT's 1-req/5s throttle).
// Returns RSS XML with no images — that's fine, news imagery comes from the
// allowlisted category map (safeImage) so CSP / next/image never break.

interface RawArticle {
  url: string;
  title: string;
  ms: number;
  domain?: string;
}

const decodeEntities = (s: string): string =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // &amp; must be decoded LAST so ampersands produced by the replacements
    // above are not re-interpreted as the start of another entity (e.g. the
    // literal text "&amp;lt;" must decode to "&lt;", not "<").
    .replace(/&amp;/g, "&")
    .trim();

export async function googleNews(query: string, max: number): Promise<RawArticle[]> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query + " when:2d",
    )}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
    next: { revalidate: CMS_FEED_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`googlenews ${res.status}`);
  const xml = await res.text();
  const out: RawArticle[] = [];
  const seen = new Set<string>();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const item of items) {
    const rawTitle = /<title>([\s\S]*?)<\/title>/.exec(item)?.[1];
    const link = /<link>([\s\S]*?)<\/link>/.exec(item)?.[1];
    const pub = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(item)?.[1];
    const src = /<source[^>]*>([\s\S]*?)<\/source>/.exec(item)?.[1];
    if (!rawTitle || !link) continue;
    let title = decodeEntities(rawTitle);
    const source = src ? decodeEntities(src) : undefined;
    // Google News titles are "Headline - Publisher" — strip the trailing source.
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim();
    }
    const ms = pub ? Date.parse(pub) : NaN;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    out.push({
      title,
      url: decodeEntities(link),
      ms: Number.isFinite(ms) ? ms : Date.now(),
      domain: source,
    });
    if (out.length >= max) break;
  }
  return out;
}

const REGION_QUERY: Record<RegionId, string> = {
  world: "world stock market economy",
  us: "wall street stock market economy",
  europe: "european stock market economy",
  asia: "asia stock market economy",
  china: "china stock market economy",
  emerging: "emerging markets stocks economy",
};

/**
 * The 13 editorial topic categories the World/News/Market-News sections are
 * organized under (matches the CMS category slugs editors assign articles to
 * and the section rails rendered on /world). Every classifier below (wire-news
 * keyword heuristic and CMS category-name mapper) must emit one of these.
 */
export const WORLD_CATEGORIES = [
  "MARKETS", "BUSINESS", "INVESTING", "TECH", "POLITICS", "WORLD",
  "FINANCE", "HEALTH & SCIENCE", "MEDIA", "REAL ESTATE", "ENERGY",
  "CLIMATE", "PERSONAL FINANCE",
] as const;

const SECTION_TITLES: Record<(typeof WORLD_CATEGORIES)[number], string> = {
  MARKETS: "Markets",
  BUSINESS: "Business",
  INVESTING: "Investing",
  TECH: "Technology",
  POLITICS: "Politics",
  WORLD: "World",
  FINANCE: "Finance",
  "HEALTH & SCIENCE": "Health & Science",
  MEDIA: "Media",
  "REAL ESTATE": "Real Estate",
  ENERGY: "Energy",
  CLIMATE: "Climate",
  "PERSONAL FINANCE": "Personal Finance",
};

// Result buckets, keyed by the category classifier, rendered as news sections.
// One section per topic category so admin-assigned categories map 1:1 to a rail.
const SECTION_DEFS: { section: string; cats: string[] }[] = WORLD_CATEGORIES.map((c) => ({
  section: SECTION_TITLES[c],
  cats: [c],
}));

export function relativeTime(ms: number): string {
  if (!Number.isFinite(ms)) return "recently";
  const diffMin = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// next/image + the app CSP only allow a short list of image hosts. Article
// thumbnails come from arbitrary news domains (or third-party placeholder
// services like picsum.photos), so we never hotlink them — we fall back to
// real, self-hosted category photography instead (and pass through a remote
// image only when its host is already allowlisted, e.g. the CMS's own CDN).

/** Pass a remote image through only if its host is allowlisted, else fall
 * back to a real, self-hosted category photo (public/images/world/categories)
 * so next/image + CSP never break and no third-party image is ever hotlinked. */
function safeImage(url: string | null | undefined, category: string, _title: string): string {
  return safeImageUrl(url, categoryImage(category));
}

export function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  // Order matters — most specific checks first, "MARKETS" is the catch-all default.
  if (/housing|mortgage|home price|real estate|property|homebuyer/.test(t)) return "REAL ESTATE";
  if (/climate|emissions|carbon|warming|wildfire|drought|net zero/.test(t)) return "CLIMATE";
  if (/oil|opec|crude|energy|renewable|solar|wind power|pipeline|gas price/.test(t)) return "ENERGY";
  if (/health|medical|drug|disease|vaccine|hospital|\bfda\b|nasa|space|scientist|research/.test(t)) return "HEALTH & SCIENCE";
  if (/streaming|film|hollywood|box office|advertising|publisher|broadcast|media company/.test(t)) return "MEDIA";
  if (/bitcoin|crypto|ethereum|token|\bai\b|chip|nvidia|apple|tech|software|semiconductor/.test(t)) return "TECH";
  if (/election|senate|policy|government|president|trump|biden|congress|regulator/.test(t)) return "POLITICS";
  if (/savings|budget|credit score|student loan|401k|retirement account|tax filing|debt payoff/.test(t)) return "PERSONAL FINANCE";
  if (/portfolio|dividend|\betf\b|mutual fund|brokerage|bond yield/.test(t)) return "INVESTING";
  if (/fed|inflation|gdp|jobs report|interest rate|\becb\b|central bank|monetary policy/.test(t)) return "FINANCE";
  if (/layoff|acquisition|merger|\bceo\b|startup|ipo|revenue|quarterly earnings|bankruptcy/.test(t)) return "BUSINESS";
  if (/war|conflict|diplomat|united nations|geopolit|global summit/.test(t)) return "WORLD";
  return "MARKETS";
}

function classifyPositive(title: string): boolean | null {
  const t = title.toLowerCase();
  if (/surge|jump|gain|rise|rally|soar|climb|beat|record high|rebound|up \d/.test(t))
    return true;
  if (/fall|drop|slump|plunge|sink|loss|miss|sell-?off|tumble|slide|down \d/.test(t))
    return false;
  return null;
}

interface NewsBundle {
  featured: FeaturedStory[];
  latest: WorldData["latest"];
  sections: WorldData["sections"];
}

/** Shared by every wire-style source (news-service, Google News RSS): buckets
 * a flat article list into the hero/latest/sectioned-grid shape the World
 * page renders. */
function bundleFromArticles(arts: RawArticle[]): NewsBundle | null {
  if (arts.length < 4) return null;

  const featured: FeaturedStory[] = arts.slice(0, 3).map((a, i) => {
    const category = classifyCategory(a.title);
    return {
      id: 1000 + i,
      category,
      headline: a.title,
      summary: a.domain ? `Latest from ${a.domain}.` : "",
      image: safeImage(undefined, category, a.title),
      time: relativeTime(a.ms),
      author: a.domain ?? "Newswire",
      tag: i === 0 ? "BREAKING" : null,
      // Wire content has no owned article page -- link out to the original source.
      href: a.url,
    };
  });

  const latest: WorldData["latest"] = arts.slice(3, 16).map((a, i) => ({
    id: 2000 + i,
    time: relativeTime(a.ms),
    category: classifyCategory(a.title),
    headline: a.title,
    positive: classifyPositive(a.title),
    href: a.url,
  }));

  // Bucket the remaining articles by category into topical sections.
  const buckets = new Map<string, RawArticle[]>();
  for (const a of arts.slice(3)) {
    const c = classifyCategory(a.title);
    (buckets.get(c) ?? buckets.set(c, []).get(c)!).push(a);
  }
  const sections: WorldData["sections"] = SECTION_DEFS.map((def, idx) => {
    const items = def.cats
      .flatMap((c) => buckets.get(c) ?? [])
      .slice(0, 4)
      .map((a, i) => ({
        id: 3000 + idx * 10 + i,
        headline: a.title,
        time: relativeTime(a.ms),
        image: safeImage(undefined, classifyCategory(a.title), a.title),
        href: a.url,
      }));
    return { section: def.section, color: "#0a2463", items };
  }).filter((s) => s.items.length > 0);

  return { featured, latest, sections };
}

async function buildNews(region: RegionId): Promise<NewsBundle | null> {
  // ONE Google News RSS call per region (cached), bucketed below.
  const arts = await googleNews(REGION_QUERY[region], 50);
  return bundleFromArticles(arts);
}

// ── news-service (real-time wire ingestion: TechCrunch, BBC, MarketWatch, ──
// Wired, MIT News, Krebs, NASA, etc.) — the dedicated wire-ingestion backend
// at Backend/services/knowledge/news-service, polled every 15 min via BullMQ.
// Preferred over the inline Google News RSS scrape below: it's deduped,
// persisted, and query-able by category/region rather than re-fetched per
// request. Falls back to null (→ googleNews) if the service or its DB is
// unreachable, so a news-service outage never breaks the World page.

const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL || "http://localhost:3045";
const NEWS_SERVICE_INTERNAL_KEY = process.env.NEWS_SERVICE_INTERNAL_KEY || "";

const REGION_WIRE_KEYWORD: Record<RegionId, string | undefined> = {
  world: undefined,
  us: "wall street",
  europe: "europe",
  asia: "asia",
  china: "china",
  emerging: "emerging markets",
};

interface WireArticle {
  title: string;
  url: string;
  published_at: string;
  source?: { name?: string } | null;
}

async function buildWireNews(region: RegionId): Promise<NewsBundle | null> {
  if (!NEWS_SERVICE_INTERNAL_KEY) return null;
  const q = new URLSearchParams({ limit: "50" });
  const keyword = REGION_WIRE_KEYWORD[region];
  if (keyword) q.set("keyword", keyword);
  const res = await fetch(`${NEWS_SERVICE_URL}/internal/v1/news?${q.toString()}`, {
    headers: { "X-Internal-Key": NEWS_SERVICE_INTERNAL_KEY },
    next: { revalidate: CMS_FEED_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`news-service ${res.status}`);
  const env = (await res.json()) as { data?: WireArticle[] };
  const arts: RawArticle[] = (env.data ?? []).map((a) => ({
    title: a.title,
    url: a.url,
    ms: Date.parse(a.published_at) || Date.now(),
    domain: a.source?.name,
  }));
  return bundleFromArticles(arts);
}

// ── CMS as the PRIMARY, admin-controlled news source ────────────────────────
// Whatever editors publish in the admin panel (cms-service) drives the World
// feed. Region targeting is by category: create a CMS category whose slug
// matches the region id (us, europe, asia, china, emerging) and assign content
// to it. Anything published also flows into the general feed.

// Live CMS read (own copy of the client). This is NOT only reached from the
// force-dynamic World pages: getWorldDataLive also backs <TrendingNowModule>,
// which sits in the sidebar of every article page. `cache: 'no-store'` here was
// therefore opting the whole article template (/[...slug],
// /financial-intelligence/[slug], /world/../[...rest]) out of static rendering —
// a full React render plus ~20 upstream fetches on every single request, for
// every article, forever. It reads the same CMS as cms-public.ts, so it shares
// that module's window and cache tag: the publish webhook's revalidateTag()
// drops it, which is what "shows up immediately" actually needs.
// Localhost is dev-only (port aligned with the rest of the app: 3018); production
// resolves to the public API gateway, same default cms-public.ts's own CMS_PUBLIC_URL
// uses — an empty string here silently 500s every server-side fetch below.
const CMS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL ||
  (process.env.NODE_ENV === "production" ? "https://api.baalvion.com/api/v1/public" : "http://localhost:3018/api/v1/public");
const CMS_SITE = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || "imperialpedia";

async function cmsList(params: {
  contentType?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<CmsContent[]> {
  const q = new URLSearchParams();
  if (params.contentType) q.set("contentType", params.contentType);
  if (params.categorySlug) q.set("categorySlug", params.categorySlug);
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE}/content?${q.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: CMS_FEED_REVALIDATE_SECONDS, tags: [CMS_CACHE_TAG] },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`cms ${res.status}`);
  const env = (await res.json()) as { data?: CmsContent[] };
  return env.data ?? [];
}

const CMS_TIME = (c: CmsContent): string =>
  c.publishedAt ? relativeTime(Date.parse(c.publishedAt)) : "recently";

// Maps an assigned CMS category's name/slug directly onto the 13-topic taxonomy —
// editors just need a category named/slugged to match (e.g. "Real Estate",
// "real-estate", "Health & Science") for content to land in the right rail.
function mapCmsCategory(name: string | null | undefined, title: string): string {
  const n = (name ?? "").toLowerCase();
  if (/real.?estate|housing|mortgage|property/.test(n)) return "REAL ESTATE";
  if (/climate/.test(n)) return "CLIMATE";
  if (/energy|oil|renewable/.test(n)) return "ENERGY";
  if (/health|science|medical/.test(n)) return "HEALTH & SCIENCE";
  if (/media|entertainment|streaming/.test(n)) return "MEDIA";
  if (/crypto|bitcoin|\btech(nology)?\b|software|ai\b/.test(n)) return "TECH";
  if (/politic|policy|government/.test(n)) return "POLITICS";
  if (/personal.?finance|budget|saving|credit.?score/.test(n)) return "PERSONAL FINANCE";
  if (/invest|portfolio|\betf\b|brokers?\b|bonds?\b|stocks?\b/.test(n)) return "INVESTING";
  if (/econom|inflation|\bfed\b|banking|monetary/.test(n)) return "FINANCE";
  if (/business|company.?news|earnings/.test(n)) return "BUSINESS";
  if (/^world$|geopolit/.test(n)) return "WORLD";
  if (/market/.test(n)) return "MARKETS";
  return classifyCategory(title);
}

/** Newest published CMS content for the region (region category first, then general). */
async function fetchCmsItems(region: RegionId): Promise<CmsContent[]> {
  const calls = [
    cmsList({ contentType: "news", limit: 30 }).catch(() => [] as CmsContent[]),
    cmsList({ contentType: "article", limit: 30 }).catch(() => [] as CmsContent[]),
  ];
  // Region-targeted content (if a matching category exists) is prioritized.
  if (region !== "world") {
    calls.unshift(cmsList({ categorySlug: region, limit: 30 }).catch(() => [] as CmsContent[]));
  }
  const results = await Promise.all(calls);
  const seen = new Set<string>();
  const merged: CmsContent[] = [];
  for (const items of results) {
    for (const it of items) {
      if (it.id && !seen.has(it.id)) {
        seen.add(it.id);
        merged.push(it);
      }
    }
  }
  merged.sort(
    (a, b) =>
      Date.parse(b.publishedAt ?? b.updatedAt ?? "") -
      Date.parse(a.publishedAt ?? a.updatedAt ?? ""),
  );
  return merged;
}

async function buildCmsNews(region: RegionId): Promise<NewsBundle | null> {
  const items = await fetchCmsItems(region);
  if (items.length < 4) return null;

  const featured: FeaturedStory[] = items.slice(0, 3).map((c, i) => {
    const category = mapCmsCategory(c.category?.name, c.title);
    return {
      id: 1000 + i,
      category,
      headline: c.title,
      summary: c.excerpt ?? "",
      image: safeImage(c.featuredImage, category, c.title),
      time: CMS_TIME(c),
      author: "Imperialpedia",
      tag: i === 0 ? "EXCLUSIVE" : null,
      // Owned editorial content -- links to the real article page via storyHref().
      slug: c.slug,
      dateISO: c.publishedAt ?? undefined,
    };
  });

  const latest: WorldData["latest"] = items.slice(3, 16).map((c, i) => ({
    id: 2000 + i,
    time: CMS_TIME(c),
    category: mapCmsCategory(c.category?.name, c.title),
    headline: c.title,
    positive: classifyPositive(c.title),
    slug: c.slug,
    dateISO: c.publishedAt ?? undefined,
  }));

  const buckets = new Map<string, CmsContent[]>();
  for (const c of items.slice(3)) {
    const k = mapCmsCategory(c.category?.name, c.title);
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(c);
  }
  const sections: WorldData["sections"] = SECTION_DEFS.map((def, idx) => {
    const its = def.cats
      .flatMap((k) => buckets.get(k) ?? [])
      .slice(0, 4)
      .map((c, i) => ({
        id: 3000 + idx * 10 + i,
        headline: c.title,
        time: CMS_TIME(c),
        image: safeImage(c.featuredImage, mapCmsCategory(c.category?.name, c.title), c.title),
        slug: c.slug,
        dateISO: c.publishedAt ?? undefined,
      }));
    return { section: def.section, color: "#0a2463", items: its };
  }).filter((s) => s.items.length > 0);

  return { featured, latest, sections };
}

// ── minimum live news floor ─────────────────────────────────────────────────
// The World page must always carry a healthy, real, dynamically-fetched feed
// (Google News approval for imperialpedia.com / lawelitenetwork.com depends on
// active, non-static publishing). CMS content published from the main admin
// panel always stays first/prioritized; wire/Google News only tops up the
// remainder so the total never falls below MIN_LIVE_NEWS_ITEMS. No photos or
// videos are ever pulled from these top-up sources — every item here is
// text-only (headline/time/category), and any image field elsewhere already
// resolves through safeImage()/categoryImage() to self-hosted placeholder
// photography rather than hotlinking real third-party media.

const MIN_LIVE_NEWS_ITEMS = 10;

function newsCount(b: NewsBundle): number {
  return b.featured.length + b.latest.length;
}

async function topUpNews(
  primary: NewsBundle,
  region: RegionId,
  target: number,
): Promise<NewsBundle> {
  if (newsCount(primary) >= target) return primary;

  const supplement =
    (await safe(() => buildWireNews(region))) ?? (await safe(() => buildNews(region)));
  if (!supplement) return primary;

  const seen = new Set(
    [...primary.featured, ...primary.latest].map((i) => i.headline.toLowerCase()),
  );
  const pool: WorldData["latest"] = [
    ...supplement.latest,
    ...supplement.featured.map((f, i) => ({
      id: 4900 + i,
      time: f.time,
      category: f.category,
      headline: f.headline,
      positive: null as boolean | null,
      slug: f.slug,
      dateISO: f.dateISO,
      href: f.href,
    })),
  ].filter((i) => !seen.has(i.headline.toLowerCase()));

  const need = Math.max(0, target - newsCount(primary));
  return { ...primary, latest: [...primary.latest, ...pool.slice(0, need)] };
}

// ── timestamp ───────────────────────────────────────────────────────────────

function nowEt(): string {
  try {
    const formatted = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `As of ${formatted} ET`;
  } catch {
    return `As of ${new Date().toUTCString()}`;
  }
}

// ── public API ──────────────────────────────────────────────────────────────

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Region-scoped World data: REAL live markets (Yahoo) + admin-controlled news.
 *
 * News precedence:
 *   1. CMS (admin panel) — the source of truth once editors publish content.
 *   2. Google News — automatic fallback so the page is never empty pre-launch.
 *   3. Static demo set — last-resort fallback if every upstream is down.
 *
 * Markets, watchlist and timestamp are always live (Yahoo), falling back to the
 * static set only if Yahoo is unavailable.
 */
export async function getWorldDataLive(raw?: string | null): Promise<WorldData> {
  const fallback = getWorldData(raw);
  const region = fallback.region;

  // Admin World Control config (markets, watchlist, settings). Falls back to
  // the shipped defaults per-field if absent.
  const config = await safe(() => getWorldConfig());
  const cfgRegion = config?.regions?.find((r) => r.id === region.id);
  const cfgDefs = (cfgRegion?.indices?.map(coerceDef).filter(Boolean) ?? []) as SymbolDef[];
  const defs = cfgDefs.length ? cfgDefs : YAHOO_SYMBOLS[region.id];
  const watch =
    config?.watchlist?.length
      ? config.watchlist.map((w) => ({ symbol: String(w.symbol), name: String(w.name) }))
      : WATCHLIST_SYMBOLS;
  const newsFallbackEnabled = config?.settings?.newsFallback !== false;
  const enabledRegions = config?.regions
    ? (config.regions.filter((r) => r.enabled !== false).map((r) => r.id) as RegionId[])
    : undefined;

  const [indicators, watchlist, cmsNews] = await Promise.all([
    safe(() => buildIndicators(defs)),
    safe(() => buildWatchlist(watch)),
    safe(() => buildCmsNews(region.id)),
  ]);

  // Admin/CMS wins. When it's empty and the admin left the wire fallback
  // enabled, prefer the dedicated news-service wire (real, deduped, persisted
  // ingestion) over the inline Google News RSS scrape, which is now just the
  // last-resort fallback if news-service itself is unreachable.
  let news = cmsNews;
  if (news && newsFallbackEnabled) {
    // CMS is live but thin — top up from wire/Google News so the page always
    // carries at least MIN_LIVE_NEWS_ITEMS real, dynamically-fetched items.
    // Admin-published CMS content stays first; this only fills the remainder.
    news = await topUpNews(news, region.id, MIN_LIVE_NEWS_ITEMS);
  }
  if (!news && newsFallbackEnabled) {
    news = await safe(() => buildWireNews(region.id));
    if (!news) news = await safe(() => buildNews(region.id));
  }

  const markets = indicators ? buildMarkets(region.id, indicators, defs) : fallback.markets;

  return {
    region,
    asOf: indicators ? nowEt() : fallback.asOf,
    indicators: indicators ?? fallback.indicators,
    markets,
    featured: news?.featured?.length ? news.featured : fallback.featured,
    latest: news?.latest?.length ? news.latest : fallback.latest,
    sections: news?.sections?.length ? news.sections : fallback.sections,
    watchlist: watchlist ?? fallback.watchlist,
    enabledRegions,
  };
}
