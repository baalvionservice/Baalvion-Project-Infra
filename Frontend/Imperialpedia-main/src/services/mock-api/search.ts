import {
  ApiResponse,
  SearchResult,
  SearchSuggestion,
  AdvancedSearchFilters,
  TopicRecommendation,
} from "@/types/search";

/**
 * @fileOverview Mock service for the Global Search System.
 * Expanded with diverse entity types, dates, and view counts for sorting and pagination.
 */

const mockSearchData: SearchResult[] = [
  {
    id: "art-1",
    type: "article",
    title: "Understanding Yield Curve Inversion",
    snippet:
      "A deep dive into what the yield curve tells us about future recessions and market signals.",
    route: "/articles/understanding-yield-curve-inversion",
    category: "Economics",
    author: "The Market Maven",
    tags: ["Macro", "Yield Curve", "Recession"],
    date: "2024-03-01T10:00:00Z",
    views: 45200,
  },
  {
    id: "art-2",
    type: "article",
    title: "The Power of Compound Interest",
    snippet:
      "Why starting early is the most important factor in wealth building and long-term capital growth.",
    route: "/articles/the-power-of-compound-interest",
    category: "Investing",
    author: "Julian Wealth",
    tags: ["Wealth", "Basics", "Savings"],
    date: "2024-02-15T09:00:00Z",
    views: 38900,
  },
  {
    id: "art-3",
    type: "article",
    title: "Macro Trends in 2026",
    snippet:
      "Anticipating the structural shifts in global fiscal policy and the next interest rate super-cycle.",
    route: "/articles/macro-trends-2026",
    category: "Economics",
    author: "Eleanor Vance",
    tags: ["Macro", "Future", "Policy"],
    date: "2024-03-05T14:00:00Z",
    views: 31200,
  },
  {
    id: "art-4",
    type: "article",
    title: "DeFi Liquidity Pools Explained",
    snippet:
      "A technical guide to how automated market makers (AMMs) operate in the decentralized landscape.",
    route: "/articles/defi-liquidity-pools",
    category: "Crypto",
    author: "Sarah Crypto",
    tags: ["DeFi", "Web3", "Liquidity"],
    date: "2024-03-08T11:00:00Z",
    views: 28400,
  },
  {
    id: "art-5",
    type: "article",
    title: "Passive Income with Dividends",
    snippet:
      "Building a sustainable cash flow engine using high-quality dividend growth stocks.",
    route: "/articles/dividend-income",
    category: "Investing",
    author: "Dan Income",
    tags: ["Dividends", "Wealth", "Passive Income"],
    date: "2024-01-20T09:00:00Z",
    views: 42500,
  },
  {
    id: "art-6",
    type: "article",
    title: "ESG Investing Strategies",
    snippet:
      "How to align your portfolio with environmental, social, and governance principles without sacrificing yield.",
    route: "/articles/esg-strategies",
    category: "Investing",
    author: "Julian Wealth",
    tags: ["ESG", "Strategy", "Investing"],
    date: "2024-02-10T10:30:00Z",
    views: 15600,
  },
  {
    id: "art-7",
    type: "article",
    title: "The Future of Central Banking",
    snippet:
      "Evaluating the transition to digital currencies and algorithmic monetary policy.",
    route: "/articles/future-of-central-banking",
    category: "Economics",
    author: "The Market Maven",
    tags: ["Macro", "Banking", "CBDC"],
    date: "2024-03-12T08:00:00Z",
    views: 52000,
  },
  {
    id: "creator-1",
    type: "author",
    title: "The Market Maven",
    snippet:
      "Expert in macro-economic trends and fixed income markets. Former hedge fund analyst.",
    route: "/creator/marketmaven",
    tags: ["Macro", "Bonds", "Economics"],
    date: "2023-01-15T00:00:00Z",
    views: 850000,
  },
  {
    id: "creator-4",
    type: "author",
    title: "Eleanor Vance",
    snippet:
      "Lead Administrator and Content Strategist at Imperialpedia. Expert in programmatic SEO.",
    route: "/creator/creator-4",
    tags: ["pSEO", "Strategy", "Growth"],
    date: "2022-12-01T00:00:00Z",
    views: 4500000,
  },
  {
    id: "calc-compound",
    type: "calculator",
    title: "Compound Interest Engine",
    snippet:
      "Precision instrument for modeling exponential growth and periodic contributions.",
    route: "/financial-tools/compound-interest",
    category: "Wealth Building",
    tags: ["Savings", "Growth", "Wealth"],
    date: "2023-11-01T10:00:00Z",
    views: 120000,
  },
  {
    id: "calc-retirement",
    type: "calculator",
    title: "Nest Egg Architect",
    snippet:
      "Project your retirement corpus based on savings, rates, and time horizons.",
    route: "/financial-tools/retirement",
    category: "Retirement",
    tags: ["Retirement", "Strategy", "Future"],
    date: "2023-11-05T14:30:00Z",
    views: 95000,
  },
  {
    id: "term-1",
    type: "glossary",
    title: "Bull Market",
    snippet:
      "A financial market where prices are rising or are expected to rise with widespread optimism.",
    route: "/glossary/bull-market",
    category: "Markets",
    tags: ["Markets", "Optimism", "Growth"],
    date: "2024-01-10T08:00:00Z",
    views: 3200,
  },
  {
    id: "term-2",
    type: "glossary",
    title: "Quantitative Easing",
    snippet:
      "A form of monetary policy where a central bank purchases at-scale government bonds.",
    route: "/glossary/quantitative-easing",
    category: "Economics",
    tags: ["Macro", "Fed", "Policy"],
    date: "2024-03-05T11:00:00Z",
    views: 15400,
  },
  {
    id: "topic-1",
    type: "topic",
    title: "Macroeconomics Matrix",
    snippet:
      "Primary taxonomy node for global economic trends, fiscal policy, and monetary indicators.",
    route: "/tags/macro",
    category: "Economics",
    tags: ["Macro", "Taxonomy", "Economics"],
    date: "2023-05-20T10:00:00Z",
    views: 120000,
  },
];

const mockRecommendedTopics: TopicRecommendation[] = [
  {
    id: "rec-1",
    name: "Yield Curve Dynamics",
    slug: "interest-rates",
    icon: "TrendingUp",
    isTrending: true,
    category: "Economics",
  },
  {
    id: "rec-2",
    name: "Monetary Policy",
    slug: "macro",
    icon: "Landmark",
    isTrending: false,
    category: "Economics",
  },
  {
    id: "rec-3",
    name: "Dividend Growth",
    slug: "investing",
    icon: "BarChart3",
    isTrending: true,
    category: "Wealth",
  },
  {
    id: "rec-4",
    name: "DeFi Ecosystems",
    slug: "crypto",
    icon: "Layers",
    isTrending: false,
    category: "Web3",
  },
  {
    id: "rec-5",
    name: "Recession Hedging",
    slug: "recession",
    icon: "ShieldCheck",
    isTrending: true,
    category: "Strategy",
  },
];

export const globalSearch = async (
  query: string,
  filters?: AdvancedSearchFilters
): Promise<ApiResponse<SearchResult[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const normalizedQuery = query.toLowerCase().trim();

  let results = [...mockSearchData];

  // Apply Query Filter
  if (normalizedQuery) {
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.snippet.toLowerCase().includes(normalizedQuery) ||
        item.category?.toLowerCase().includes(normalizedQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  }

  // Apply Advanced Filters
  if (filters) {
    if (filters.category && filters.category !== "all") {
      results = results.filter((item) => item.category === filters.category);
    }
    if (filters.author && filters.author !== "all") {
      results = results.filter((item) => item.author === filters.author);
    }
  }

  // Apply Sorting
  const sortBy = filters?.sortBy || "relevance";
  switch (sortBy) {
    case "latest":
      results.sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
      break;
    case "popular":
      results.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case "relevance":
    default:
      // Keep mock initial order as relevance proxy
      break;
  }

  return {
    data: results,
    status: 200,
  };
};

export const getSearchSuggestions = async (
  query: string
): Promise<ApiResponse<SearchSuggestion[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { data: [], status: 200 };
  }

  const suggestions = mockSearchData
    .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      route: item.route,
    }))
    .slice(0, 5);

  return {
    data: suggestions,
    status: 200,
  };
};

export const getPopularContent = async (): Promise<
  ApiResponse<SearchResult[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // Sort by views and take top 6
  const popular = [...mockSearchData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);

  return {
    data: popular,
    status: 200,
  };
};

export const getRecommendedTopics = async (
  query?: string
): Promise<ApiResponse<TopicRecommendation[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockRecommendedTopics,
    status: 200,
  };
};

/**
 * Slices a result set based on pagination parameters.
 */
export const paginateResults = (
  results: SearchResult[],
  page: number,
  pageSize: number
): SearchResult[] => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return results.slice(start, end);
};
