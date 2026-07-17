/**
 * Public Markets data loader — imperialpedia-service's /assets (synced from
 * cms-service's live pipeline) is the single source of truth. Server-side only.
 */

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
  sentiment: "bullish" | "bearish" | "neutral";
  last_updated_at: string | null;
}

export async function getAllMarketAssets(): Promise<MarketAssetRow[]> {
  try {
    const res = await fetch(`${IMP_API}/assets?limit=100`, { next: { revalidate: 30 } });
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
