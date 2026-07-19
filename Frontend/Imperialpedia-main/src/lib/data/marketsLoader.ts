/**
 * Public Markets data loader — imperialpedia-service's /assets (synced from
 * cms-service's live pipeline) is the primary source of truth. Server-side only.
 *
 * Resilience: unlike worldFeed.ts's per-symbol fetchLiveQuote() (which already
 * falls back to keyless Yahoo Finance), this file's getAllMarketAssets() used
 * to have NO fallback — any outage of imperialpedia-service's sync pipeline
 * (see marketSyncService.js) meant every MarketsBreakdown panel rendered a
 * blank "No data" state, confirmed live in production 2026-07-19. It now fills
 * any symbol missing from the primary response with a Yahoo-derived row,
 * reusing the same keyless fetch already proven live via worldFeed.ts rather
 * than inventing a second fallback mechanism.
 */
import { fetchYahooQuote, CANONICAL_SYMBOL_MAP } from "./worldFeed";

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3004/api/v1");

export interface MarketAssetRow {
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string | null;
  current_price: number | string | null;
  change_pct_24h: number | string | null;
  market_cap: number | string | null;
  volume_24h: number | string | null;
  ai_summary: string | null;
  sentiment: "bullish" | "bearish" | "neutral";
  last_updated_at: string | null;
}

async function fetchPrimaryAssets(): Promise<MarketAssetRow[]> {
  try {
    const res = await fetch(`${IMP_API}/assets?limit=100`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.items ?? []) as MarketAssetRow[];
  } catch {
    return [];
  }
}

// Symbol groupings — must match cms-service's canonicalSymbol values exactly.
export const MARKET_GROUPS = {
  usIndices: ["DJI", "SPX", "IXIC", "RUT", "VIX"],
  europe: ["EUROPE", "FTSE100", "DAX", "CAC40", "IBEX35", "FTSEMIB"],
  asiaPacific: ["APAC", "NIKKEI", "KOSPI", "ASX200"],
  china: ["CHINA", "HANGSENG", "SHANGHAI"],
  emergingMarkets: ["EM", "BOVESPA", "SENSEX"],
  crypto: ["BTC", "ETH", "SOL"],
  commodities: ["XAUUSD", "WTI", "BRENT", "NATGAS", "COPPER"],
  currencies: ["EURUSD", "GBPUSD", "USDJPY", "USDINR", "USDCNY", "USDBRL"],
  sectors: ["XLK", "XLE", "XLV", "XLF", "XLY"],
  bonds: ["DGS3MO", "DGS2", "DGS10", "DGS30"],
  stocks: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "AMD", "META", "NFLX", "JPM", "BRKB", "INTC", "TSM"],
} as const;

// Exported (not just module-local) so the sitemap generator and
// `generateStaticParams` on the quote page can submit/pre-render exactly the
// symbols this site actually supports a quote page for — one source of truth
// instead of a second hardcoded symbol list that could drift out of sync.
export const ALL_TRACKED_SYMBOLS: string[] = Object.values(MARKET_GROUPS).flat();

// Reverse of worldFeed.ts's Yahoo→canonical map (canonical→Yahoo), so this
// file doesn't hand-duplicate ~30 symbol pairs a second time — one source of
// truth for the mapping, two consumers. First Yahoo symbol wins where several
// map to the same canonical (e.g. SENSEX has both ^BSESN and ^NSEI upstream).
const CANONICAL_TO_YAHOO: Record<string, string> = {};
for (const [yahoo, canonical] of Object.entries(CANONICAL_SYMBOL_MAP)) {
  if (!(canonical in CANONICAL_TO_YAHOO)) CANONICAL_TO_YAHOO[canonical] = yahoo;
}
// A handful of instruments worldFeed.ts never needed a mapping for (it has no
// /world section that surfaces them), but Yahoo supports them directly under
// a slightly different ticker than our canonical symbol.
Object.assign(CANONICAL_TO_YAHOO, {
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  NATGAS: "NG=F",
  COPPER: "HG=F",
  GBPUSD: "GBPUSD=X",
  BRKB: "BRK-B",
});

const FALLBACK_NAMES: Record<string, string> = {
  DJI: "Dow Jones", SPX: "S&P 500", IXIC: "Nasdaq", RUT: "Russell 2000", VIX: "VIX",
  EUROPE: "STOXX 600", FTSE100: "FTSE 100", DAX: "DAX", CAC40: "CAC 40", IBEX35: "IBEX 35", FTSEMIB: "FTSE MIB",
  NIKKEI: "Nikkei 225", KOSPI: "Kospi", ASX200: "ASX 200",
  HANGSENG: "Hang Seng", SHANGHAI: "Shanghai Composite",
  BOVESPA: "Bovespa", SENSEX: "Sensex",
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana",
  XAUUSD: "Gold", WTI: "Crude Oil (WTI)", BRENT: "Brent Crude", NATGAS: "Natural Gas", COPPER: "Copper",
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", USDJPY: "USD/JPY", USDINR: "USD/INR", USDCNY: "USD/CNY", USDBRL: "USD/BRL",
  XLK: "Technology Sector", XLE: "Energy Sector", XLV: "Health Care Sector", XLF: "Financials Sector", XLY: "Consumer Discretionary Sector",
  AAPL: "Apple", MSFT: "Microsoft", GOOGL: "Alphabet", AMZN: "Amazon", TSLA: "Tesla", NVDA: "Nvidia",
  AMD: "AMD", META: "Meta", NFLX: "Netflix", JPM: "JPMorgan Chase", BRKB: "Berkshire Hathaway", INTC: "Intel", TSM: "Taiwan Semiconductor",
};

/** Shapes a Yahoo quote into a MarketAssetRow — same price/change math as
 * worldFeed.ts's toIndicator(), so fallback rows read identically to primary
 * ones. Sector/stock tickers pass straight through (bare US ticker == Yahoo
 * symbol); everything else goes through CANONICAL_TO_YAHOO. Symbols with no
 * Yahoo equivalent at all (the 4 FRED bond-yield series) are never attempted. */
async function fetchYahooAsMarketAssetRow(canonicalSymbol: string): Promise<MarketAssetRow | null> {
  if ((MARKET_GROUPS.bonds as readonly string[]).includes(canonicalSymbol)) return null;
  const yahooSymbol = CANONICAL_TO_YAHOO[canonicalSymbol] ?? canonicalSymbol;
  try {
    const q = await fetchYahooQuote(yahooSymbol);
    const change = q.price - q.prev;
    const changePct = q.prev !== 0 ? (change / q.prev) * 100 : 0;
    return {
      symbol: canonicalSymbol,
      name: FALLBACK_NAMES[canonicalSymbol] ?? canonicalSymbol,
      asset_type: (MARKET_GROUPS.stocks as readonly string[]).includes(canonicalSymbol)
        ? "stock"
        : (MARKET_GROUPS.crypto as readonly string[]).includes(canonicalSymbol)
          ? "crypto"
          : (MARKET_GROUPS.currencies as readonly string[]).includes(canonicalSymbol)
            ? "forex"
            : (MARKET_GROUPS.commodities as readonly string[]).includes(canonicalSymbol)
              ? "commodity"
              : "index",
      exchange: null,
      current_price: q.price,
      change_pct_24h: changePct,
      market_cap: null,
      volume_24h: q.volume ?? null,
      ai_summary: null,
      sentiment: change >= 0 ? "bullish" : "bearish",
      last_updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAllMarketAssets(): Promise<MarketAssetRow[]> {
  const primary = await fetchPrimaryAssets();
  const bySymbol = new Map(primary.map((a) => [a.symbol, a]));
  const missing = ALL_TRACKED_SYMBOLS.filter((s) => !bySymbol.has(s));
  if (missing.length) {
    const settled = await Promise.allSettled(missing.map((s) => fetchYahooAsMarketAssetRow(s)));
    settled.forEach((r) => {
      if (r.status === "fulfilled" && r.value) bySymbol.set(r.value.symbol, r.value);
    });
  }
  return [...bySymbol.values()];
}

export function groupAssets(assets: MarketAssetRow[]): Record<keyof typeof MARKET_GROUPS, MarketAssetRow[]> {
  const bySymbol = new Map(assets.map((a) => [a.symbol, a]));
  const result = {} as Record<keyof typeof MARKET_GROUPS, MarketAssetRow[]>;
  for (const [group, symbols] of Object.entries(MARKET_GROUPS)) {
    result[group as keyof typeof MARKET_GROUPS] = symbols
      .map((s) => bySymbol.get(s))
      .filter((a): a is MarketAssetRow => !!a);
  }
  return result;
}

export interface QuoteChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface AssetDetail extends MarketAssetRow {
  marketStatus: { status: string; isOpen: boolean; label: string } | null;
  volume: { volume: number | null; averageVolume: number | null } | null;
  chart: QuoteChartPoint[];
  historical: QuoteChartPoint[];
  performance: {
    today: number | null; week: number | null; month: number | null;
    ytd: number | null; oneYear: number | null; fiveYear: number | null;
  } | null;
  indicators: {
    sma20: number | null; sma50: number | null; sma200: number | null; rsi14: number | null;
    macd: { macdLine: number; signalLine: number; histogram: number } | null;
  } | null;
  fundamentals: {
    marketCap: number | null; peRatio: number | null; week52High: number | null;
    week52Low: number | null; dividendYield: number | null; industry: string | null;
  } | null;
  relatedCompanies: { symbol: string; name: string }[];
  relatedArticles: { id: number; title: string; slug: string; published_at: string | null }[];
}

export async function getAssetDetail(symbol: string, range: string): Promise<AssetDetail | null> {
  try {
    const res = await fetch(`${IMP_API}/assets/${encodeURIComponent(symbol)}/detail?range=${encodeURIComponent(range)}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as AssetDetail | null;
  } catch {
    return null;
  }
}

export function computeMovers(stocks: MarketAssetRow[]) {
  const withPrice = stocks.filter((s) => s.current_price != null && s.change_pct_24h != null);
  const sorted = [...withPrice].sort((a, b) => Number(b.change_pct_24h) - Number(a.change_pct_24h));
  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
  };
}
