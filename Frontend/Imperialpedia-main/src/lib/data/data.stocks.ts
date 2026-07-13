import { NewsAuthor, NewsBodyBlock, RelatedLink } from "../data.news";
import { StocksCategory } from "@/app/stocks/components/stocks-tab";
import { articleArtDataUri } from "@baalvion/illustrations";

export interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StocksArticle {
  id: string;
  title: string;
  excerpt: string;
  category: StocksCategory;
  author: NewsAuthor;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  imageUrl: string;
  imageCaption?: string;
  slug: string;
  related?: RelatedLink[];
  featured?: boolean;
  keyTakeaways?: string[];
  body: NewsBodyBlock[];
  tags?: string[];
}

export interface StockPageData {
  featured?: StocksArticle;
  latest: StocksArticle[];
  trendingStocks: StockItem[];
  guides: StocksArticle[];
  popularTags: string[];
}

type RawStocksArticle = Omit<StocksArticle, "imageUrl">;
interface RawStockPageData {
  featured?: RawStocksArticle;
  latest: RawStocksArticle[];
  trendingStocks: StockItem[];
  guides: RawStocksArticle[];
  popularTags: string[];
}

const rawStocksPageData: RawStockPageData = {
  featured: undefined,

  latest: [],

  trendingStocks: [
    {
      symbol: "NVDA",
      name: "NVIDIA",
      price: 920,
      change: 25,
      changePercent: 2.8,
    },
    {
      symbol: "TSLA",
      name: "Tesla",
      price: 240,
      change: 14,
      changePercent: 6.1,
    },
    {
      symbol: "AAPL",
      name: "Apple",
      price: 182,
      change: -1.2,
      changePercent: -0.6,
    },
    {
      symbol: "AMZN",
      name: "Amazon",
      price: 178,
      change: 3.5,
      changePercent: 2.0,
    },
    {
      symbol: "MSFT",
      name: "Microsoft",
      price: 410,
      change: 5.2,
      changePercent: 1.3,
    },
  ],

  guides: [
    {
      id: "guide-1",
      title: "How to Start Investing in Stocks for Beginners",
      excerpt: "A simple guide to entering the stock market.",
      category: "Top Stocks",
      author: { name: "Finance Guide" },
      publishedAt: "2026-03-10T10:00:00Z",
      readTimeMinutes: 6,
      slug: "investing-for-beginners",
      body: [
        {
          type: "paragraph",
          text: "Getting started with stocks is easier than you think...",
        },
      ],
    },
    {
      id: "guide-2",
      title: "What Is a Stock? Definition and Examples",
      excerpt: "Understand what stocks are and how they work.",
      category: "Growth Stocks",
      author: { name: "Finance Guide" },
      publishedAt: "2026-03-09T10:00:00Z",
      readTimeMinutes: 5,
      slug: "what-is-stock",
      body: [
        {
          type: "paragraph",
          text: "Stocks represent ownership in a company...",
        },
      ],
    },
  ],

  popularTags: [
    "Tech Stocks",
    "Dividend Stocks",
    "Growth Stocks",
    "Value Investing",
    "Stock Market Basics",
    "Day Trading",
  ],
};

// Original, deterministic artwork per stocks article (no stock/placeholder images) —
// generated from each article's own title/category/tags, computed after the literal
// above since object literals can't reference their own sibling properties.
function withArt(article: RawStocksArticle): StocksArticle {
  return {
    ...article,
    imageUrl: articleArtDataUri({
      title: article.title,
      category: article.category,
      tags: article.tags,
      excerpt: article.excerpt,
      seed: article.slug,
    }),
  };
}

export const stocksPageData: StockPageData = {
  ...rawStocksPageData,
  featured: rawStocksPageData.featured ? withArt(rawStocksPageData.featured) : undefined,
  latest: rawStocksPageData.latest.map(withArt),
  guides: rawStocksPageData.guides.map(withArt),
};
