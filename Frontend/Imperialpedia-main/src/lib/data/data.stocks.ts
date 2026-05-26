import { NewsAuthor, NewsBodyBlock, RelatedLink } from "../data.news";
import { StocksCategory } from "@/app/stocks/components/stocks-tab";

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
  featured: StocksArticle;
  latest: StocksArticle[];
  trendingStocks: StockItem[];
  guides: StocksArticle[];
  popularTags: string[];
}
export const stocksPageData: StockPageData = {
  featured: {
    id: "stock-featured-1",
    title: "NVIDIA Leads AI Rally as Chip Stocks Surge to New Highs",
    excerpt:
      "AI demand continues to push semiconductor stocks higher, with NVIDIA and AMD leading the charge.",
    category: "Growth Stocks",
    related: [
      {
        label: "All the Ways the Iran War Is Draining Your Wallet",
        href: "#",
      },
      {
        label:
          "Forget About A Fed Rate Cut—A Hike Seems More Likely By The Day",
        href: "#",
      },
      {
        label:
          "Personal Loans Surge As Consumers Struggle To Keep Up With Inflation",
        href: "#",
      },
    ],
    author: { name: "Lisa Tran", title: "Tech Stocks Reporter" },
    publishedAt: "2026-03-16T10:00:00Z",
    readTimeMinutes: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1200&q=80",
    slug: "nvidia-ai-rally",
    featured: true,
    tags: ["NVIDIA", "AI Stocks", "Semiconductors"],
    keyTakeaways: [
      "AI demand is driving massive growth in chip stocks.",
      "NVIDIA remains dominant in GPU market.",
      "Analysts warn about high valuations.",
    ],
    body: [
      {
        type: "paragraph",
        text: "AI demand continues to reshape the stock market landscape...",
      },
    ],
  },

  latest: [
    {
      id: "stock-1",
      title: "Tesla Shares Jump 6% After Strong Delivery Forecast",
      excerpt: "Tesla stock surged after optimistic production guidance.",
      category: "Trending Stocks",
      author: { name: "Elon Desk" },
      publishedAt: "2026-03-16T08:00:00Z",
      readTimeMinutes: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=80",
      slug: "tesla-stock-jump",
      body: [
        {
          type: "paragraph",
          text: "Tesla shares jumped after new forecasts...",
        },
      ],
    },
    {
      id: "stock-2",
      title: "Apple Stock Holds Steady Ahead of Product Launch",
      excerpt: "Investors await Apple's next big reveal event.",
      category: "Value Stocks",
      author: { name: "Market Watcher" },
      publishedAt: "2026-03-16T07:00:00Z",
      readTimeMinutes: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=1200&q=80",
      slug: "apple-stock-steady",
      body: [{ type: "paragraph", text: "Apple stock remains stable..." }],
    },
    {
      id: "stock-3",
      title: "Amazon Gains as Cloud Revenue Beats Expectations",
      excerpt: "AWS growth continues to drive Amazon stock.",
      category: "Tech Stocks",
      author: { name: "Cloud Analyst" },
      publishedAt: "2026-03-15T18:00:00Z",
      readTimeMinutes: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80",
      slug: "amazon-cloud-growth",
      body: [
        { type: "paragraph", text: "Amazon reported strong cloud revenue..." },
      ],
    },
    {
      id: "stock-4",
      title: "Google Gains as Cloud Revenue Beats Expectations",
      excerpt: "AWS growth continues to drive Google stock.",
      category: "Tech Stocks",
      author: { name: "Cloud Analyst" },
      publishedAt: "2026-03-15T18:00:00Z",
      readTimeMinutes: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80",
      slug: "amazon-cloud-growth",
      body: [
        { type: "paragraph", text: "Amazon reported strong cloud revenue..." },
      ],
    },
  ],

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
      imageUrl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80",
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
      imageUrl:
        "https://images.unsplash.com/photo-1569025690938-a00729c9e1df?w=1200&q=80",
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
