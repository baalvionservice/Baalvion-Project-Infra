import {
  featuredNews,
  latestNews,
  marketIndicators,
  newsGridSections,
  watchlistItems,
  worldMarkets,
} from "./worldData";

/**
 * Region-aware data for the CNBC-style World page
 * (imperialpedia.com/world/?region=world).
 *
 * Each region scopes the markets ticker, the dark "Markets Overview" strip,
 * the hero featured stories, and the World Markets panel. The live "Latest
 * News" rail and the sectioned news grid are shared across regions.
 */

export type RegionId =
  | "world"
  | "us"
  | "europe"
  | "asia"
  | "china"
  | "emerging";

export interface RegionConfig {
  id: RegionId;
  /** Full label shown in the breadcrumb / heading. */
  label: string;
  /** Compact label for the tab bar on small screens. */
  short: string;
}

export interface Indicator {
  name: string;
  value: string;
  change: string;
  percent: string;
  positive: boolean;
}

export interface FeaturedStory {
  id: number;
  category: string;
  headline: string;
  summary: string;
  image: string;
  time: string;
  author: string;
  tag: string | null;
}

export interface MarketRow {
  name: string;
  value: string;
  change: string;
  positive: boolean;
}

export interface MarketRegionGroup {
  region: string;
  markets: MarketRow[];
}

export interface WorldData {
  region: RegionConfig;
  asOf: string;
  indicators: Indicator[];
  featured: FeaturedStory[];
  markets: MarketRegionGroup[];
  latest: typeof latestNews;
  sections: typeof newsGridSections;
  watchlist: typeof watchlistItems;
  /** Region ids enabled in the admin World Control panel (undefined = all). */
  enabledRegions?: RegionId[];
}

export const REGIONS: RegionConfig[] = [
  { id: "world", label: "World", short: "World" },
  { id: "us", label: "U.S.", short: "U.S." },
  { id: "europe", label: "Europe", short: "Europe" },
  { id: "asia", label: "Asia-Pacific", short: "Asia" },
  { id: "china", label: "China", short: "China" },
  { id: "emerging", label: "Emerging Markets", short: "EM" },
];

const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

/** Resolve a raw `?region=` value to a known region, defaulting to World. */
export function resolveRegion(raw?: string | null): RegionConfig {
  const key = (raw ?? "world").toLowerCase();
  return REGION_BY_ID.get(key as RegionId) ?? REGIONS[0];
}

const AS_OF = "As of Apr 8, 2026 12:45 PM ET";

// Known-good finance imagery reused from the base dataset so nothing 404s.
const IMG = {
  markets: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  economy: "https://images.unsplash.com/photo-1521790945508-bf2a36314e85?w=800&q=80",
  tech: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
  energy: "https://images.unsplash.com/photo-1606159068539-43f36b99d1b2?w=800&q=80",
  policy: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80",
} as const;

const ind = (
  name: string,
  value: string,
  change: string,
  percent: string,
  positive: boolean,
): Indicator => ({ name, value, change, percent, positive });

const mkt = (
  name: string,
  value: string,
  change: string,
  positive: boolean,
): MarketRow => ({ name, value, change, positive });

const INDICATORS: Record<RegionId, Indicator[]> = {
  world: marketIndicators,
  us: [
    ind("Dow Jones", "39,118.86", "+263.71", "+0.68%", true),
    ind("S&P 500", "5,248.49", "+59.88", "+1.15%", true),
    ind("Nasdaq", "16,428.82", "+245.33", "+1.52%", true),
    ind("Russell 2000", "2,071.38", "-12.44", "-0.60%", false),
    ind("10-Yr Bond", "4.317%", "+0.029", "+0.68%", false),
    ind("VIX", "13.26", "-0.82", "-5.83%", false),
    ind("Gold", "2,331.40", "+18.60", "+0.81%", true),
    ind("Crude (WTI)", "83.17", "-0.43", "-0.51%", false),
  ],
  europe: [
    ind("FTSE 100", "8,044.81", "+20.94", "+0.26%", true),
    ind("DAX", "18,161.01", "+151.42", "+0.84%", true),
    ind("CAC 40", "8,106.50", "+44.20", "+0.55%", true),
    ind("IBEX 35", "11,015.30", "-19.80", "-0.18%", false),
    ind("STOXX 600", "508.40", "+2.38", "+0.47%", true),
    ind("FTSE MIB", "34,210.00", "+180.00", "+0.53%", true),
    ind("EUR/USD", "1.0745", "-0.0012", "-0.11%", false),
    ind("Brent", "87.43", "-0.38", "-0.43%", false),
  ],
  asia: [
    ind("Nikkei 225", "38,460.08", "+907.92", "+2.42%", true),
    ind("Hang Seng", "17,651.15", "+305.26", "+1.76%", true),
    ind("Shanghai", "3,074.22", "+8.90", "+0.29%", true),
    ind("Kospi", "2,676.63", "-5.89", "-0.22%", false),
    ind("ASX 200", "7,791.20", "+37.10", "+0.48%", true),
    ind("Sensex", "74,248.22", "+495.06", "+0.67%", true),
    ind("USD/JPY", "151.62", "+0.18", "+0.12%", true),
    ind("Nifty 50", "22,514.65", "+152.30", "+0.68%", true),
  ],
  china: [
    ind("Shanghai", "3,074.22", "+8.90", "+0.29%", true),
    ind("Shenzhen", "9,512.30", "+44.10", "+0.47%", true),
    ind("Hang Seng", "17,651.15", "+305.26", "+1.76%", true),
    ind("CSI 300", "3,545.62", "+12.40", "+0.35%", true),
    ind("China A50", "12,180.00", "+95.00", "+0.79%", true),
    ind("ChiNext", "1,845.20", "-6.30", "-0.34%", false),
    ind("HS Tech", "3,498.40", "+72.10", "+2.11%", true),
    ind("USD/CNY", "7.2360", "+0.0042", "+0.06%", false),
  ],
  emerging: [
    ind("Bovespa", "127,842", "-432.00", "-0.34%", false),
    ind("Sensex", "74,248.22", "+495.06", "+0.67%", true),
    ind("Shanghai", "3,074.22", "+8.90", "+0.29%", true),
    ind("Hang Seng", "17,651.15", "+305.26", "+1.76%", true),
    ind("MOEX", "3,318.40", "+14.20", "+0.43%", true),
    ind("JSE Top 40", "68,920", "+210.00", "+0.31%", true),
    ind("USD/BRL", "5.0420", "-0.0120", "-0.24%", true),
    ind("USD/INR", "83.31", "+0.04", "+0.05%", false),
  ],
};

const FEATURED: Record<RegionId, FeaturedStory[]> = {
  world: featuredNews as FeaturedStory[],
  us: [
    {
      id: 101,
      category: "MARKETS",
      headline:
        "S&P 500 climbs to a fresh record as megacap tech powers Wall Street higher",
      summary:
        "Strength in Nvidia, Microsoft and Apple lifted the benchmark to an all-time high as traders dialed back fears over the timing of Federal Reserve rate cuts.",
      image: IMG.markets,
      time: "1 hour ago",
      author: "Sarah Johnson",
      tag: "BREAKING",
    },
    {
      id: 102,
      category: "ECONOMY",
      headline:
        "U.S. payrolls smash forecasts with 303,000 jobs added; jobless rate dips to 3.8%",
      summary:
        "The labor market showed renewed strength in March, complicating the Fed's path toward easing later this year.",
      image: IMG.economy,
      time: "3 hours ago",
      author: "Michael Torres",
      tag: null,
    },
    {
      id: 103,
      category: "TECH",
      headline:
        "Nvidia adds $200 billion in market value as AI chip orders outpace supply",
      summary:
        "Analysts raised price targets again, citing data-center demand that continues to run well ahead of production.",
      image: IMG.tech,
      time: "4 hours ago",
      author: "Lisa Chen",
      tag: null,
    },
  ],
  europe: [
    {
      id: 111,
      category: "MARKETS",
      headline:
        "European stocks hit a record as the ECB signals a June rate cut is firmly on the table",
      summary:
        "The STOXX 600 closed at an all-time high after policymakers struck a dovish tone on the outlook for inflation across the euro zone.",
      image: IMG.markets,
      time: "2 hours ago",
      author: "Henrik Brandt",
      tag: "BREAKING",
    },
    {
      id: 112,
      category: "ECONOMY",
      headline:
        "Euro-zone inflation cools to 2.4%, clearing the path for summer easing",
      summary:
        "Headline prices fell closer to the ECB's 2% target, reinforcing market bets on a first cut as soon as June.",
      image: IMG.economy,
      time: "3 hours ago",
      author: "Camille Laurent",
      tag: null,
    },
    {
      id: 113,
      category: "ENERGY",
      headline:
        "Brent crude steadies near $87 as traders weigh OPEC+ cuts against soft demand",
      summary:
        "Oil held its gains as supply discipline from producers offset signs of weaker industrial activity in Germany.",
      image: IMG.energy,
      time: "5 hours ago",
      author: "Diego Fuentes",
      tag: null,
    },
  ],
  asia: [
    {
      id: 121,
      category: "MARKETS",
      headline:
        "Nikkei surges past 38,000 as a weak yen lifts Japanese exporters to record highs",
      summary:
        "Tokyo led regional gains as the currency's slide boosted the earnings outlook for automakers and electronics giants.",
      image: IMG.markets,
      time: "2 hours ago",
      author: "Kenji Nakamura",
      tag: "BREAKING",
    },
    {
      id: 122,
      category: "ECONOMY",
      headline:
        "China's exports rebound 5% in March, easing fears of a deeper slowdown",
      summary:
        "Stronger overseas shipments offered a tentative sign of stabilization for the world's second-largest economy.",
      image: IMG.economy,
      time: "4 hours ago",
      author: "Mei Ling",
      tag: null,
    },
    {
      id: 123,
      category: "TECH",
      headline:
        "TSMC jumps on blowout AI demand, lifting Asian chip suppliers across the board",
      summary:
        "The contract chipmaker's results rippled through the region, sending Samsung and SK Hynix higher in Seoul.",
      image: IMG.tech,
      time: "6 hours ago",
      author: "Park Ji-ho",
      tag: null,
    },
  ],
  china: [
    {
      id: 131,
      category: "MARKETS",
      headline:
        "Hang Seng leads Asia higher as Beijing unveils fresh stimulus for the property sector",
      summary:
        "Mainland and Hong Kong equities rallied after authorities outlined new measures to stabilize the troubled real-estate market.",
      image: IMG.markets,
      time: "1 hour ago",
      author: "Mei Ling",
      tag: "BREAKING",
    },
    {
      id: 132,
      category: "ECONOMY",
      headline:
        "China's GDP grows 5.3% in the first quarter, topping analyst expectations",
      summary:
        "The stronger-than-expected print eased concerns about momentum, though property remained a persistent drag.",
      image: IMG.economy,
      time: "3 hours ago",
      author: "Wang Hao",
      tag: null,
    },
    {
      id: 133,
      category: "TECH",
      headline:
        "Alibaba and Tencent rally as China's tech regulators signal a lighter touch",
      summary:
        "Internet heavyweights climbed after officials indicated the years-long crackdown on the sector was easing.",
      image: IMG.tech,
      time: "5 hours ago",
      author: "Lin Yu",
      tag: null,
    },
  ],
  emerging: [
    {
      id: 141,
      category: "MARKETS",
      headline:
        "Emerging-market stocks rally as the dollar eases and Fed rate-cut bets revive",
      summary:
        "A softer greenback drew investors back to higher-yielding assets, lifting equities from Mumbai to São Paulo.",
      image: IMG.markets,
      time: "2 hours ago",
      author: "Priya Nair",
      tag: "BREAKING",
    },
    {
      id: 142,
      category: "ECONOMY",
      headline:
        "India's Sensex tops 74,000 as foreign inflows return at a record pace",
      summary:
        "Overseas funds piled back into Indian equities, betting on resilient growth and a stable policy backdrop.",
      image: IMG.economy,
      time: "4 hours ago",
      author: "Priya Nair",
      tag: null,
    },
    {
      id: 143,
      category: "ENERGY",
      headline:
        "Brazil's Bovespa slips as commodity exporters weigh on the benchmark",
      summary:
        "Lower iron-ore and oil prices dragged on heavyweight miners and producers, snapping a three-day winning streak.",
      image: IMG.energy,
      time: "6 hours ago",
      author: "João Pereira",
      tag: null,
    },
  ],
};

const AMERICAS: MarketRegionGroup = {
  region: "Americas",
  markets: [
    mkt("Dow", "39,118", "+0.68%", true),
    mkt("S&P 500", "5,248", "+1.15%", true),
    mkt("Nasdaq", "16,428", "+1.52%", true),
    mkt("Russell 2000", "2,071", "-0.60%", false),
    mkt("TSX", "22,108", "+0.22%", true),
    mkt("Bovespa", "127,842", "-0.34%", false),
  ],
};

const EUROPE: MarketRegionGroup = {
  region: "Europe",
  markets: [
    mkt("FTSE 100", "8,044", "+0.26%", true),
    mkt("DAX", "18,161", "+0.84%", true),
    mkt("CAC 40", "8,106", "+0.55%", true),
    mkt("IBEX 35", "11,015", "-0.18%", false),
    mkt("FTSE MIB", "34,210", "+0.53%", true),
    mkt("STOXX 600", "508", "+0.47%", true),
  ],
};

const ASIA: MarketRegionGroup = {
  region: "Asia-Pacific",
  markets: [
    mkt("Nikkei 225", "38,460", "+2.42%", true),
    mkt("Hang Seng", "17,651", "+1.76%", true),
    mkt("Shanghai", "3,074", "+0.29%", true),
    mkt("ASX 200", "7,791", "+0.48%", true),
    mkt("Kospi", "2,676", "-0.22%", false),
    mkt("Sensex", "74,248", "+0.67%", true),
  ],
};

const CHINA: MarketRegionGroup = {
  region: "Greater China",
  markets: [
    mkt("Shanghai", "3,074", "+0.29%", true),
    mkt("Shenzhen", "9,512", "+0.47%", true),
    mkt("Hang Seng", "17,651", "+1.76%", true),
    mkt("CSI 300", "3,545", "+0.35%", true),
    mkt("China A50", "12,180", "+0.79%", true),
    mkt("ChiNext", "1,845", "-0.34%", false),
  ],
};

const EMERGING: MarketRegionGroup = {
  region: "Emerging Markets",
  markets: [
    mkt("Sensex", "74,248", "+0.67%", true),
    mkt("Bovespa", "127,842", "-0.34%", false),
    mkt("Hang Seng", "17,651", "+1.76%", true),
    mkt("MOEX", "3,318", "+0.43%", true),
    mkt("JSE Top 40", "68,920", "+0.31%", true),
    mkt("Nifty 50", "22,514", "+0.68%", true),
  ],
};

const MARKETS: Record<RegionId, MarketRegionGroup[]> = {
  world: worldMarkets as MarketRegionGroup[],
  us: [AMERICAS],
  europe: [EUROPE],
  asia: [ASIA],
  china: [CHINA],
  emerging: [EMERGING],
};

/** Canonical clean path for a region: world → /world, others → /world/<id>. */
export function regionPath(id: RegionId): string {
  return id === "world" ? "/world" : `/world/${id}`;
}

/** Shared SEO metadata fields for a region's World page. */
export function worldSeo(raw?: string | null): {
  region: RegionConfig;
  canonical: string;
  title: string;
  description: string;
} {
  const region = resolveRegion(raw);
  return {
    region,
    canonical: regionPath(region.id),
    title: `${region.label} Markets & Business News | Imperialpedia World`,
    description: `Live ${region.label} markets, indices and the latest business, economy and financial news — updated continuously by Imperialpedia.`,
  };
}

/** Build the full region-scoped payload for the World page. */
export function getWorldData(raw?: string | null): WorldData {
  const region = resolveRegion(raw);
  return {
    region,
    asOf: AS_OF,
    indicators: INDICATORS[region.id],
    featured: FEATURED[region.id],
    markets: MARKETS[region.id],
    latest: latestNews,
    sections: newsGridSections,
    watchlist: watchlistItems,
  };
}
