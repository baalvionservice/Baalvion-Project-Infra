/**
 * Central configuration for the CMS-driven topic ("category") pages.
 *
 * Each topic route (e.g. /banking, /investing) renders the shared <CategoryFeed>,
 * which pulls *published* content for that category from cms-service and falls back
 * to the bundled static set while the CMS fills up. This file owns the per-topic
 * heading copy + SEO, and maps each topic onto the closest static NewsCategory so
 * the fallback shows relevant articles instead of the whole archive.
 */

import type { NewsCategory } from '@/lib/data.news';

export interface TopicCopy {
  /** Small uppercase eyebrow above the title. */
  tag: string;
  /** Page H1 / hero title. */
  title: string;
  /** Hero description sentence. */
  description: string;
  /** SEO <title> — defaults to `${title} — News & Analysis`. */
  metaTitle?: string;
  /** SEO meta description — defaults to `description`. */
  metaDescription?: string;
}

/** Title-case a kebab slug: "auto-loans" → "Auto Loans". */
function titleize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Curated copy for the flagship categories; everything else uses sensible defaults. */
const OVERRIDES: Record<string, TopicCopy> = {
  banking: {
    tag: 'BANKING',
    title: 'Banking & Financial Services',
    description:
      'Navigate the banking landscape with insights on savings accounts, loans, credit products, and financial services to optimize your banking experience.',
    metaTitle: 'Banking News and Financial Services',
    metaDescription:
      'The latest banking news, financial services updates, and industry analysis — savings, loans, credit cards, and banking regulation.',
  },
  investing: {
    tag: 'INVESTING',
    title: 'Investing & Markets',
    description:
      'Build long-term wealth with research-backed coverage of stocks, funds, asset allocation, and the strategies that move portfolios.',
    metaTitle: 'Investing News, Strategy & Market Analysis',
  },
  economy: {
    tag: 'ECONOMY',
    title: 'The Economy',
    description:
      'Macro forces explained — growth, inflation, employment, central-bank policy, and what the data means for your money.',
    metaTitle: 'Economy News & Macroeconomic Analysis',
  },
  crypto: {
    tag: 'CRYPTO',
    title: 'Cryptocurrency & Digital Assets',
    description:
      'Bitcoin, Ethereum, DeFi, and the infrastructure of digital money — coverage that separates signal from hype.',
    metaTitle: 'Crypto News & Digital Asset Analysis',
  },
  cryptocurrency: {
    tag: 'CRYPTO',
    title: 'Cryptocurrency',
    description:
      'The latest on digital assets, blockchain protocols, tokens, and the markets that trade them.',
    metaTitle: 'Cryptocurrency News & Analysis',
  },
  'personal-finance': {
    tag: 'PERSONAL FINANCE',
    title: 'Personal Finance',
    description:
      'Practical money guidance — budgeting, saving, debt, credit, and the decisions that compound over a lifetime.',
    metaTitle: 'Personal Finance News, Tips & Guides',
  },
  stocks: {
    tag: 'STOCKS',
    title: 'Stocks',
    description:
      'Equity research, earnings, sector moves, and the company news that drives share prices.',
    metaTitle: 'Stock Market News & Equity Analysis',
  },
  bonds: {
    tag: 'BONDS',
    title: 'Bonds & Fixed Income',
    description:
      'Yields, duration, credit, and the fixed-income markets that anchor diversified portfolios.',
    metaTitle: 'Bond Market News & Fixed Income Analysis',
  },
  etfs: {
    tag: 'ETFS',
    title: 'ETFs',
    description:
      'Exchange-traded funds explained — strategies, flows, costs, and how to use them in a portfolio.',
    metaTitle: 'ETF News & Fund Analysis',
  },
  'real-estate': {
    tag: 'REAL ESTATE',
    title: 'Real Estate',
    description:
      'Housing, mortgages, REITs, and property investing — the trends shaping the market.',
    metaTitle: 'Real Estate News & Property Investing',
  },
  retirement: {
    tag: 'RETIREMENT',
    title: 'Retirement Planning',
    description:
      'Build and protect your nest egg — 401(k)s, IRAs, withdrawal strategy, and retiring on your terms.',
    metaTitle: 'Retirement Planning News & Strategy',
  },
  taxes: {
    tag: 'TAXES',
    title: 'Taxes',
    description:
      'Tax planning, brackets, deductions, and filing strategy to keep more of what you earn.',
    metaTitle: 'Tax News, Planning & Filing Guides',
  },
};

/** Map a topic slug to the closest static NewsCategory for the fallback feed. */
export const STATIC_CATEGORY_MAP: Record<string, NewsCategory> = {
  // Markets
  investing: 'Markets',
  options: 'Markets',
  'mutual-funds': 'Markets',
  commodities: 'Markets',
  'market-news': 'Markets',
  'live-market-news': 'Markets',
  'company-news': 'Markets',
  earnings: 'Markets',
  global: 'Markets',
  portfolio: 'Markets',
  // Stocks
  stocks: 'Stocks',
  // Crypto
  crypto: 'Crypto',
  cryptocurrency: 'Crypto',
  // Bonds / ETFs
  bonds: 'Bonds',
  etfs: 'ETFs',
  // Real estate
  'real-estate': 'RealEstate',
  mortgages: 'RealEstate',
  // Economy
  economy: 'Economy',
  gdp: 'Economy',
  inflation: 'Economy',
  unemployment: 'Economy',
  fed: 'Economy',
  'fiscal-policy': 'Economy',
  'monetary-policy': 'Economy',
  'interest-rates': 'Economy',
  indicators: 'Economy',
  government: 'Economy',
  // Personal finance
  banking: 'PersonalFinance',
  'personal-finance': 'PersonalFinance',
  budgeting: 'PersonalFinance',
  'budgeting-apps': 'PersonalFinance',
  debt: 'PersonalFinance',
  credit: 'PersonalFinance',
  'credit-cards': 'PersonalFinance',
  savings: 'PersonalFinance',
  checking: 'PersonalFinance',
  'cd-rates': 'PersonalFinance',
  'money-market': 'PersonalFinance',
  'emergency-fund': 'PersonalFinance',
  income: 'PersonalFinance',
  taxes: 'PersonalFinance',
  'tax-software': 'PersonalFinance',
  'estate-planning': 'PersonalFinance',
  planning: 'PersonalFinance',
  retirement: 'PersonalFinance',
  loans: 'PersonalFinance',
  'student-loans': 'PersonalFinance',
  'auto-loans': 'PersonalFinance',
  insurance: 'PersonalFinance',
  // Reviews / guides
  'advisor-reviews': 'Guides',
  'app-reviews': 'Guides',
  'bank-reviews': 'Guides',
  'banking-reviews': 'Guides',
  'broker-reviews': 'Guides',
  'credit-card-reviews': 'Guides',
  'insurance-reviews': 'Guides',
  'loan-reviews': 'Guides',
  'robo-advisors': 'Guides',
  'financial-calculators': 'Guides',
  calendar: 'Guides',
  'moratage-gates': 'Guides',
};

export function topicCopy(slug: string): TopicCopy {
  const o = OVERRIDES[slug];
  if (o) return o;
  const title = titleize(slug);
  return {
    tag: slug.replace(/-/g, ' ').toUpperCase(),
    title,
    description: `Latest ${title} news, analysis, and expert insight from the Imperialpedia newsroom.`,
  };
}

export function topicMeta(slug: string): {
  title: string;
  description: string;
  canonical: string;
  keywords: string[];
} {
  const c = topicCopy(slug);
  return {
    title: c.metaTitle ?? `${c.title} — News & Analysis`,
    description: c.metaDescription ?? c.description,
    // Clean, self-referential canonical so each topic indexes to one URL.
    canonical: `/${slug}`,
    keywords: [
      c.title,
      `${c.title} news`,
      `${c.title} analysis`,
      'finance',
      'investing',
    ],
  };
}

export function staticCategoryFor(slug: string): NewsCategory | undefined {
  return STATIC_CATEGORY_MAP[slug];
}
