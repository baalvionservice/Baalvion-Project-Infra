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
import { fetchYahooQuote, fetchYahooChart, CANONICAL_SYMBOL_MAP, MARKET_DATA_REVALIDATE_SECONDS } from "./worldFeed";

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1"
    : "http://localhost:3004/api/v1");

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
      next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
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
  // Real Treasury-yield tickers Yahoo does carry (unlike DGS2 — no 2-year yield
  // series exists on Yahoo under any ticker, verified live 2026-08-26; that one
  // stays on the /bonds redirect in next.config.ts, nothing fabricated for it).
  DGS30: "^TYX", // Treasury Yield 30 Years
  DGS3MO: "^IRX", // 13-Week Treasury Bill (Yahoo's closest tracked equivalent to the 3-month CMT rate)
  // CHINA/EM/APAC (MARKET_GROUPS regional composites) were never individual
  // instruments — no single "the Asia-Pacific stock" exists to quote. These map
  // to real, widely-tracked ETF proxies for each region, same pattern EUROPE
  // already uses (^STOXX, via CANONICAL_SYMBOL_MAP above) — a genuine tradable
  // instrument that tracks the region, not a guess.
  CHINA: "FXI", // iShares China Large-Cap ETF
  EM: "EEM", // iShares MSCI Emerging Markets ETF
  APAC: "VPL", // Vanguard FTSE Pacific ETF
});

const FALLBACK_NAMES: Record<string, string> = {
  DJI: "Dow Jones", SPX: "S&P 500", IXIC: "Nasdaq", RUT: "Russell 2000", VIX: "VIX",
  EUROPE: "STOXX 600", FTSE100: "FTSE 100", DAX: "DAX", CAC40: "CAC 40", IBEX35: "IBEX 35", FTSEMIB: "FTSE MIB",
  NIKKEI: "Nikkei 225", KOSPI: "Kospi", ASX200: "ASX 200",
  HANGSENG: "Hang Seng", SHANGHAI: "Shanghai Composite",
  BOVESPA: "Bovespa", SENSEX: "Sensex",
  CHINA: "China Large-Cap (FXI)", EM: "Emerging Markets (EEM)", APAC: "Asia-Pacific (VPL)",
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana",
  XAUUSD: "Gold", WTI: "Crude Oil (WTI)", BRENT: "Brent Crude", NATGAS: "Natural Gas", COPPER: "Copper",
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", USDJPY: "USD/JPY", USDINR: "USD/INR", USDCNY: "USD/CNY", USDBRL: "USD/BRL",
  XLK: "Technology Sector", XLE: "Energy Sector", XLV: "Health Care Sector", XLF: "Financials Sector", XLY: "Consumer Discretionary Sector",
  AAPL: "Apple", MSFT: "Microsoft", GOOGL: "Alphabet", AMZN: "Amazon", TSLA: "Tesla", NVDA: "Nvidia",
  AMD: "AMD", META: "Meta", NFLX: "Netflix", JPM: "JPMorgan Chase", BRKB: "Berkshire Hathaway", INTC: "Intel", TSM: "Taiwan Semiconductor",
  DGS10: "10-Year Treasury Yield", DGS30: "30-Year Treasury Yield", DGS3MO: "3-Month Treasury Yield",
};

/** Shapes a Yahoo quote into a MarketAssetRow — same price/change math as
 * worldFeed.ts's toIndicator(), so fallback rows read identically to primary
 * ones. Sector/stock tickers pass straight through (bare US ticker == Yahoo
 * symbol); everything else goes through CANONICAL_TO_YAHOO, including DGS30
 * (^TYX), DGS3MO (^IRX), and the CHINA/EM/APAC region-composite ETF proxies
 * (FXI/EEM/VPL) added above. DGS2 is the one symbol genuinely left out: no
 * 2-year Treasury yield ticker exists on Yahoo under any name (verified live
 * 2026-08-26) — it stays on the /bonds redirect in next.config.ts rather than
 * getting a fabricated proxy. */
async function fetchYahooAsMarketAssetRow(canonicalSymbol: string): Promise<MarketAssetRow | null> {
  const UNSUPPORTED: readonly string[] = ["DGS2"];
  if (UNSUPPORTED.includes(canonicalSymbol)) return null;
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
              : (MARKET_GROUPS.bonds as readonly string[]).includes(canonicalSymbol)
                ? "bond"
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
    beta: number | null;
  } | null;
  relatedCompanies: { symbol: string; name: string }[];
  relatedArticles: { id: number; title: string; slug: string; published_at: string | null }[];
}

// Bare-bones AssetDetail built from the same Yahoo fallback row getAllMarketAssets()
// already uses — no indicators/fundamentals/performance (Yahoo's keyless endpoints don't
// carry those), but real price/change plus a real chart (via fetchYahooChart, same
// v8/finance/chart endpoint) instead of the empty chart this used to hardcode, which
// left every non-crypto quote page ("chart not coming") permanently chartless — verified
// live 2026-08-26, since imperialpedia-service's asset_summaries only has crypto synced.
function toFallbackDetail(row: MarketAssetRow, chart: QuoteChartPoint[]): AssetDetail {
  return {
    ...row,
    marketStatus: null,
    volume: row.volume_24h != null ? { volume: Number(row.volume_24h), averageVolume: null } : null,
    chart,
    historical: chart,
    performance: null,
    indicators: null,
    fundamentals: null,
    relatedCompanies: [],
    relatedArticles: [],
  };
}

export async function getAssetDetail(symbol: string, range: string): Promise<AssetDetail | null> {
  try {
    const res = await fetch(`${IMP_API}/assets/${encodeURIComponent(symbol)}/detail?range=${encodeURIComponent(range)}`, {
      next: { revalidate: MARKET_DATA_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      const detail = (json?.data ?? null) as AssetDetail | null;
      if (detail) {
        // cms-service only builds intraday chart/indicator series for
        // asset.type stock|index (see getQuote's hasIntradayChart gate) — crypto
        // rows come back OK with real price/quote but chart: [] always, which
        // used to render "No chart data" even though the primary call succeeded
        // (verified live for BTC/ETH/SOL 2026-08-26). Same Yahoo backfill as the
        // full-fallback path below, just layered on top of an otherwise-good response.
        if (detail.chart.length === 0) {
          const yahooSymbol = CANONICAL_TO_YAHOO[symbol] ?? symbol;
          const chart = await fetchYahooChart(yahooSymbol, range);
          if (chart.length > 0) return { ...detail, chart, historical: chart };
        }
        return detail;
      }
    }
  } catch {
    // fall through to Yahoo below
  }
  // imperialpedia-service unreachable, or the symbol hasn't synced into
  // asset_summaries yet — same failure mode getAllMarketAssets() already
  // guards against (see file header). Without this, any hiccup in that one
  // upstream call 404s the entire quote page instead of degrading gracefully.
  const fallback = await fetchYahooAsMarketAssetRow(symbol);
  if (!fallback) return null;
  const yahooSymbol = CANONICAL_TO_YAHOO[symbol] ?? symbol;
  const chart = await fetchYahooChart(yahooSymbol, range);
  return toFallbackDetail(fallback, chart);
}

export function computeMovers(stocks: MarketAssetRow[]) {
  const withPrice = stocks.filter((s) => s.current_price != null && s.change_pct_24h != null);
  const sorted = [...withPrice].sort((a, b) => Number(b.change_pct_24h) - Number(a.change_pct_24h));
  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
  };
}
