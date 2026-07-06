import type { NewsCategory } from "@/lib/data.news";

/** Maps each finance NewsCategory to its existing CMS-backed topic page slug. */
export const CATEGORY_TOPIC_SLUG: Record<NewsCategory, string> = {
  Markets: "market-news",
  Economy: "economy",
  Stocks: "stocks",
  Crypto: "crypto",
  PersonalFinance: "personal-finance",
  RealEstate: "real-estate",
  ETFs: "etfs",
  Bonds: "bonds",
  Guides: "financial-calculators",
  Editorial: "news",
};
