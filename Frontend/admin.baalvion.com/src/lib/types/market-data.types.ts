export interface MarketQuote {
  price?: number;
  value?: number;
  change: number | null;
  changePercent?: number | null;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
  asOf: string;
  fetchedAt: string;
  nextRefreshAt: string;
}

export interface RelatedNewsItem {
  id: string;
  title: string;
  publishedAt: string | null;
}

export interface MarketInstrument {
  symbol?: string;
  canonicalSymbol: string;
  id?: string;
  fn?: string;
  series?: string;
  label: string;
  region?: string;
  newsKeyword?: string;
  relatedNews?: RelatedNewsItem[];
  source: string;
  quote: MarketQuote | null;
}

export interface MoverEntry {
  symbol?: string;
  label: string;
  changePercent: number;
  price?: number;
}

export interface EconomicCalendarEvent {
  date: string;
  releaseName: string;
}

export interface ExchangeStatus {
  code: string;
  name: string;
  isOpen: boolean;
}

export type ProviderHealthStatus = 'ok' | 'rate_limited' | 'error' | 'unconfigured' | 'unknown';

export interface ProviderHealth {
  status: ProviderHealthStatus;
  message: string | null;
  checkedAt: string | null;
}

export interface MarketDataProviders {
  finnhub: boolean;
  twelveData: boolean;
  alphaVantage: boolean;
  fred: boolean;
  binance: boolean;
}

export interface MarketDataOverview {
  exchangeStatus: ExchangeStatus[];
  usIndices: MarketInstrument[];
  globalIndices: MarketInstrument[];
  stocks: MarketInstrument[];
  sectors: MarketInstrument[];
  crypto: MarketInstrument[];
  forex: MarketInstrument[];
  commodities: MarketInstrument[];
  bonds: MarketInstrument[];
  movers: { gainers: MoverEntry[]; losers: MoverEntry[] };
  economicCalendar: EconomicCalendarEvent[];
  providers: MarketDataProviders;
  health: Record<string, ProviderHealth>;
  generatedAt: string;
}

export interface QuoteChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface QuoteFundamentals {
  marketCap: number | null;
  peRatio: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividendYield: number | null;
  industry: string | null;
}

export interface QuoteVolume {
  volume: number | null;
  averageVolume: number | null;
}

export interface PerformanceSummary {
  today: number | null;
  week: number | null;
  month: number | null;
  ytd: number | null;
  oneYear: number | null;
  fiveYear: number | null;
}

export interface MacdResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macd: MacdResult | null;
}

export type AssetMarketStatus = 'open' | 'pre-market' | 'after-hours' | 'closed';

export interface QuoteMarketStatus {
  status: AssetMarketStatus;
  isOpen: boolean;
  label: string;
}

export interface RelatedCompany {
  symbol: string;
  name: string;
}

export const CHART_RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

export interface AssetQuote {
  symbol: string;
  name: string;
  type: string;
  exchange: string | null;
  currency: string;
  logoUrl: string | null;
  source: string;
  marketStatus: QuoteMarketStatus;
  quote: MarketQuote | null;
  volume: QuoteVolume | null;
  chart: QuoteChartPoint[];
  historical: QuoteChartPoint[];
  performance: PerformanceSummary;
  indicators: TechnicalIndicators | null;
  fundamentals: QuoteFundamentals | null;
  relatedCompanies: RelatedCompany[];
  relatedNews: RelatedNewsItem[];
}
