import type { NewsCategory } from "@/lib/data.news";

/**
 * Maps each NewsCategory to its existing CMS-backed topic page slug —
 * Partial because several newsroom categories (Business, Tech, Finance,
 * HealthScience, Media, Energy, Climate) don't have a dedicated topic page
 * yet. Callers must handle the missing case (hide the "View all" link)
 * rather than linking to a route that 404s.
 */
export const CATEGORY_TOPIC_SLUG: Partial<Record<NewsCategory, string>> = {
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
  Investing: "investing",
  Politics: "politics",
  World: "world",
};
