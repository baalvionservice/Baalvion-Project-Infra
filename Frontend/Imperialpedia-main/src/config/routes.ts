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
    articles: "/articles",
    glossary: "/glossary",
    calculators: "/financial-tools",
    creators: "/creators",
    learningPaths: "/learning-paths",
    market: "/market",
    community: "/community",
    aiTools: "/ai-analyst",
    outline: "/ai-analyst/content-outline",
  },
  platform: {
    dashboard: "/dashboard",
    recommendations: "/dashboard/recommendations",
    portfolio: "/dashboard/portfolio",
    alerts: "/dashboard/alerts",
  },
  premium: {
    subscribe: "/premium/subscribe",
    heatmap: "/premium/market-heatmap",
    screener: "/premium/screener",
    backtesting: "/premium/backtesting",
    reports: "/premium/reports",
  },
  admin: {
    dashboard: "/admin/dashboard",
    analytics: "/admin/analytics/command-center",
    quality: "/admin/analytics/content-quality",
    moderation: "/admin/control/moderation/ai-hub",
    infrastructure: "/admin/control/infrastructure",
  },
};
