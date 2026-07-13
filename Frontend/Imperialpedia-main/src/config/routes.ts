/**
 * @fileOverview Centralized route definitions for the entire application.
 * Mapped for full system integration.
 */

export const routes = {
  public: {
    home: "/",
    news: "/news",
    stocks: "/stocks",
    brokers: "/brokers",
    reviews: "/imperialpedia-review-board",
    articles: "/financial-intelligence",
    glossary: "/glossary",
    calculators: "/financial-tools",
    creators: "/creators",
    learningPaths: "/learning-paths",
    market: "/market",
    community: "/community",
    aiTools: "/ai-analyst",
    outline: "/ai-analyst/content-outline",
  },
  premium: {
    subscribe: "/premium/subscribe",
    heatmap: "/premium/market-heatmap",
    screener: "/premium/screener",
    backtesting: "/premium/backtesting",
    reports: "/premium/reports",
  },
};
