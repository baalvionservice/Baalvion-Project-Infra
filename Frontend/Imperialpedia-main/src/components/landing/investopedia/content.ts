import type { Article, TopicGroup } from "./types";

/**
 * Curated editorial content for the homepage. Every link points to a real
 * Imperialpedia route, so the homepage is fully navigable. Swap these arrays
 * for a CMS/API feed when live content is wired.
 */

export const LEAD_STORY: Article = {
  title: "Markets weigh the Fed's next move as inflation cools toward target",
  href: "/fed",
  category: "Markets",
  dek: "Investors are recalibrating rate-cut expectations after the latest CPI print. Here's what the data means for stocks, bonds, and your portfolio.",
  imageSeed: "fed-markets",
  author: "Imperialpedia Editorial",
};

export const TOP_STORIES: Article[] = [
  {
    title: "What a soft landing actually looks like for the U.S. economy",
    href: "/economy",
    category: "Economy",
    imageSeed: "soft-landing",
  },
  {
    title: "S&P 500 sectors to watch as earnings season kicks off",
    href: "/stocks",
    category: "Investing",
    imageSeed: "sp500-sectors",
  },
  {
    title: "Bitcoin's volatility returns: how to size a crypto position",
    href: "/cryptocurrency",
    category: "Crypto",
    imageSeed: "bitcoin-vol",
  },
  {
    title: "Mortgage rates dip — should you refinance now?",
    href: "/mortgages",
    category: "Banking",
    imageSeed: "mortgage-rates",
  },
  {
    title: "The Roth IRA move that can save you thousands in retirement",
    href: "/retirement",
    category: "Personal Finance",
    imageSeed: "roth-ira",
  },
];

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    title: "Investing",
    href: "/investing",
    articles: [
      {
        title: "How to build a diversified ETF portfolio from scratch",
        href: "/etfs",
        category: "ETFs",
        dek: "A step-by-step framework for low-cost, broad-market exposure.",
        imageSeed: "etf-portfolio",
      },
      {
        title: "Bonds 101: why yields move opposite to prices",
        href: "/bonds",
        category: "Fixed Income",
        dek: "The mechanics behind the most misunderstood asset class.",
        imageSeed: "bonds-yields",
      },
      {
        title: "Options strategies for income: covered calls explained",
        href: "/options",
        category: "Options",
        dek: "Generate yield on stock you already own.",
        imageSeed: "covered-calls",
      },
      {
        title: "Dividend investing: building a growing cash-flow machine",
        href: "/stocks",
        category: "Stocks",
        dek: "How compounding dividends quietly build wealth.",
        imageSeed: "dividend-growth",
      },
    ],
  },
  {
    title: "Economy",
    href: "/economy",
    articles: [
      {
        title: "Reading the inflation report: CPI vs. PCE explained",
        href: "/inflation",
        category: "Inflation",
        dek: "Which gauge the Fed actually watches — and why.",
        imageSeed: "cpi-pce",
      },
      {
        title: "GDP growth slows: what it signals for jobs and wages",
        href: "/gdp",
        category: "Growth",
        dek: "Breaking down the quarterly output numbers.",
        imageSeed: "gdp-growth",
      },
      {
        title: "How interest rates ripple through the whole economy",
        href: "/interest-rates",
        category: "Rates",
        dek: "From mortgages to corporate debt, the chain reaction.",
        imageSeed: "rates-ripple",
      },
      {
        title: "Unemployment data: the signals beneath the headline rate",
        href: "/unemployment",
        category: "Labor",
        dek: "Participation, wages, and what they reveal.",
        imageSeed: "unemployment-data",
      },
    ],
  },
  {
    title: "Personal Finance",
    href: "/personal-finance",
    articles: [
      {
        title: "Build a budget that actually survives the month",
        href: "/budgeting",
        category: "Budgeting",
        dek: "A realistic system that adapts to real life.",
        imageSeed: "budget-system",
      },
      {
        title: "The fastest, cheapest ways to crush high-interest debt",
        href: "/debt",
        category: "Debt",
        dek: "Avalanche vs. snowball, and when each wins.",
        imageSeed: "debt-payoff",
      },
      {
        title: "Tax moves to make before year-end",
        href: "/taxes",
        category: "Taxes",
        dek: "Deductions and credits people routinely miss.",
        imageSeed: "tax-moves",
      },
      {
        title: "High-yield savings: where to park your emergency fund",
        href: "/savings",
        category: "Banking",
        dek: "Earn real interest without locking up your cash.",
        imageSeed: "hysa-savings",
      },
    ],
  },
  {
    title: "Markets & AI",
    href: "/ai-analyst",
    articles: [
      {
        title: "Earnings season playbook: what moves a stock on report day",
        href: "/earnings",
        category: "Earnings",
        dek: "Beats, guidance, and the numbers that matter.",
        imageSeed: "earnings-playbook",
      },
      {
        title: "AI Analyst: get an instant bull and bear case on any asset",
        href: "/ai-analyst",
        category: "AI Tools",
        dek: "Two-sided analysis in seconds, not hours.",
        imageSeed: "ai-analyst-tool",
      },
      {
        title: "Live market news: tracking the moves as they happen",
        href: "/live-market-news",
        category: "Markets",
        dek: "Real-time coverage of the trading day.",
        imageSeed: "live-market",
      },
      {
        title: "Company news that actually moves valuations",
        href: "/company-news",
        category: "Companies",
        dek: "Cut through the noise to what changes the thesis.",
        imageSeed: "company-news",
      },
    ],
  },
];

export const TERM_OF_DAY = {
  term: "Compound Interest",
  definition:
    "Compound interest is the interest you earn on both your original principal and the interest that has already accumulated. Because each period's interest is added to the balance, growth accelerates over time — the engine behind long-term investing and the reason starting early matters so much.",
  href: "/financial-tools/compound-interest",
};
