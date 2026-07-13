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
    articles: "/financial-intelligence",
    glossary: "/terms",
    calculators: "/financial-tools",
    creators: "/creators",
    learningPaths: "/learning-paths",
  },
  premium: {
    subscribe: "/premium/subscribe",
    backtesting: "/premium/backtesting",
    reports: "/premium/reports",
  },
};
