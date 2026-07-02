/**
 * @fileOverview Local fallback content for the public Glossary.
 *
 * `glossary.ts` has no fallback when imperialpedia-service is unreachable —
 * `listGlossaryTerms()` returns `[]` and `getGlossaryTermBySlug()` returns
 * `undefined`, which sends every `/glossary/[slug]` request straight to
 * `notFound()`. This file gives those functions something real to fall back
 * to, the same pattern already used for `/terms/*` via `terms.ts`.
 */

import type { GlossaryListItem, GlossaryTerm } from './glossary';

export const glossaryFallbackTerms: GlossaryTerm[] = [
  {
    term: 'Compound Interest',
    slug: 'compound-interest',
    short_def:
      'Interest calculated on both the initial principal and the accumulated interest from prior periods.',
    full_def:
      'Compound interest is the addition of interest to the principal sum of a loan or deposit — interest on interest. It makes a balance grow faster than simple interest, which is calculated only on the principal.\n\nThe effect compounds more powerfully the more frequently interest is added and the longer the money stays invested, which is why starting early has an outsized impact on long-term growth.',
    formula_latex: 'A = P\\left(1 + \\frac{r}{n}\\right)^{nt}',
    aliases: ['compounding'],
    difficulty: 'beginner',
    category: 'Investing Basics',
    references: [
      { title: 'U.S. SEC — Compound Interest Calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', kind: 'web' },
    ],
    examples: [
      { title: '$1,000 at 7% for 30 years', body: 'Investing $1,000 at a 7% annual rate compounded monthly grows to roughly $8,100 after 30 years — versus about $3,100 with simple interest.' },
    ],
    relations: [
      { relation: 'contrast', related: { term: 'Simple Interest', slug: 'simple-interest-glossary', difficulty: 'beginner' } },
      { relation: 'related', related: { term: 'Dollar-Cost Averaging', slug: 'dollar-cost-averaging-glossary', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Inflation',
    slug: 'inflation-glossary',
    short_def:
      'The rate at which the general level of prices for goods and services rises, eroding purchasing power.',
    full_def:
      'Inflation measures how much more expensive a basket of goods and services has become over a period, usually a year. Moderate inflation is typically a sign of a growing economy, but high or persistent inflation erodes the real value of savings and fixed incomes.\n\nCentral banks generally target a low, stable inflation rate — often cited around 2% — using interest-rate policy as their primary tool.',
    aliases: ['CPI inflation'],
    difficulty: 'beginner',
    category: 'Economics',
    references: [],
    examples: [
      { title: 'Purchasing power', body: 'At 6% annual inflation, $100 today buys about what $74 would buy in five years.' },
    ],
    relations: [
      { relation: 'related', related: { term: 'Yield Curve', slug: 'yield-curve-glossary', difficulty: 'intermediate' } },
    ],
  },
  {
    term: 'Diversification',
    slug: 'diversification-glossary',
    short_def: 'Spreading investments across assets to reduce exposure to any single risk.',
    full_def:
      'Diversification is a risk-management strategy that mixes a wide variety of investments within a portfolio so that no single holding, sector, or region can sink the whole portfolio.\n\nIt reduces unsystematic (asset-specific) risk — the risk tied to one company or sector — but does far less to reduce systematic, market-wide risk, since a broad downturn can still affect most diversified portfolios.',
    aliases: ["don't put all your eggs in one basket"],
    difficulty: 'beginner',
    category: 'Portfolio Management',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Exchange-Traded Fund', slug: 'etf-glossary', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Price-to-Earnings Ratio',
    slug: 'pe-ratio-glossary',
    short_def: 'A valuation metric comparing a company’s share price to its earnings per share.',
    full_def:
      'The price-to-earnings (P/E) ratio measures the price an investor pays for each dollar of a company’s annual earnings. A high P/E can mean a stock is expensive, or that investors expect strong future growth; a low P/E can signal undervaluation, or it can reflect real concerns about the business.\n\nP/E is most meaningful when comparing companies within the same industry, since average P/E levels vary significantly across sectors.',
    formula_latex: 'P/E = \\frac{\\text{Market Price per Share}}{\\text{Earnings per Share}}',
    aliases: ['PE', 'P/E', 'price earnings ratio'],
    difficulty: 'intermediate',
    category: 'Valuation',
    references: [],
    examples: [
      { title: 'Worked example', body: 'A stock trading at $50 with $5 in annual earnings per share has a P/E of 10 — investors are paying $10 for every $1 of annual earnings.' },
    ],
    relations: [],
  },
  {
    term: 'Exchange-Traded Fund',
    slug: 'etf-glossary',
    short_def: 'A basket of securities that trades on an exchange like a single stock.',
    full_def:
      'An exchange-traded fund (ETF) pools investor money to buy a basket of assets — stocks, bonds, or commodities — and issues shares that trade on an exchange throughout the day, just like an individual stock.\n\nETFs offer instant diversification, typically low fees, and intraday liquidity, which is why they have become a popular building block for both index investing and more targeted sector or thematic strategies.',
    aliases: ['ETFs'],
    difficulty: 'beginner',
    category: 'Investment Vehicles',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Diversification', slug: 'diversification-glossary', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Liquidity',
    slug: 'liquidity-glossary',
    short_def: 'How quickly and cheaply an asset can be converted to cash without affecting its price.',
    full_def:
      'Liquidity describes the ease of buying or selling an asset at a price close to its fair value. Cash is the most liquid asset; real estate and thinly traded stocks are comparatively illiquid.\n\nHigh market liquidity typically means tight bid-ask spreads and stable prices; a liquidity crunch — when even normally liquid assets become hard to sell without a discount — can cause sharp, sudden price swings during periods of market stress.',
    aliases: ['market liquidity'],
    difficulty: 'intermediate',
    category: 'Markets',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Diversification', slug: 'diversification-glossary', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Simple Interest',
    slug: 'simple-interest-glossary',
    short_def: 'Interest calculated only on the original principal amount, producing steady, linear growth.',
    full_def:
      'Simple interest is calculated only on the original principal, without factoring in interest that has already accumulated, so a balance grows in a straight line rather than an accelerating curve.\n\nIt is calculated as principal × rate × time. Over long periods, compound interest pulls meaningfully ahead of an equivalent simple-interest rate, which is why the distinction matters most for long-term savings and debt.',
    formula_latex: 'I = P \\times r \\times t',
    aliases: [],
    difficulty: 'beginner',
    category: 'Investing Basics',
    references: [],
    examples: [],
    relations: [
      { relation: 'contrast', related: { term: 'Compound Interest', slug: 'compound-interest', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Dollar-Cost Averaging',
    slug: 'dollar-cost-averaging-glossary',
    short_def: 'Investing a fixed amount on a regular schedule, regardless of price.',
    full_def:
      'Dollar-cost averaging (DCA) means investing the same fixed amount at regular intervals — for example, monthly — no matter what the price is at the time. This buys more units when prices are low and fewer when prices are high, smoothing the average cost paid over time.\n\nIts main benefit is behavioral: it removes the pressure of trying to time the market and keeps an investor contributing through both downturns and rallies.',
    aliases: ['DCA'],
    difficulty: 'beginner',
    category: 'Investing Basics',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Compound Interest', slug: 'compound-interest', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Yield Curve',
    slug: 'yield-curve-glossary',
    short_def: 'A plot of interest rates across bond maturities of equal credit quality.',
    full_def:
      'The yield curve plots interest rates for bonds of equal credit quality — most commonly U.S. Treasuries — across a range of maturities from short-term to long-term.\n\nUnder normal conditions it slopes upward, since lenders demand extra compensation for tying up money longer. An inverted curve, where short-term yields exceed long-term yields, has historically preceded most U.S. recessions, often by many months.',
    aliases: [],
    difficulty: 'intermediate',
    category: 'Fixed Income',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Inflation', slug: 'inflation-glossary', difficulty: 'beginner' } },
    ],
  },
  {
    term: 'Volatility',
    slug: 'volatility-glossary',
    short_def: 'A measure of how much and how quickly an asset’s price fluctuates.',
    full_def:
      'Volatility measures the size of an asset’s price swings over a given period, in either direction. A highly volatile asset can move sharply up or down; a low-volatility asset tends to move in smaller, steadier increments.\n\nVolatility is commonly used as a proxy for risk, though it technically captures the magnitude of price movement rather than the direction of loss specifically.',
    aliases: [],
    difficulty: 'intermediate',
    category: 'Markets',
    references: [],
    examples: [],
    relations: [],
  },
  {
    term: 'Net Worth',
    slug: 'net-worth-glossary',
    short_def: 'Total assets minus total liabilities — everything you own minus everything you owe.',
    full_def:
      'Net worth is a snapshot of financial position at a single point in time: the value of all assets (cash, investments, real estate, and other property) minus all liabilities (mortgages, loans, and other debt).\n\nTracking net worth over time is generally a more meaningful gauge of financial progress than income alone, since a high income paired with heavy debt can produce a lower net worth than a modest income paired with consistent saving.',
    aliases: [],
    difficulty: 'beginner',
    category: 'Personal Finance',
    references: [],
    examples: [],
    relations: [],
  },
  {
    term: 'Fiduciary',
    slug: 'fiduciary-glossary',
    short_def: 'A legal duty to act in a client’s best interest, stricter than a suitability standard.',
    full_def:
      'A fiduciary is legally and ethically obligated to act in the best interest of their client, ahead of their own interests. This is a meaningfully stricter standard than "suitability," which only requires a recommendation to be reasonably appropriate, not necessarily the best or lowest-cost option available.\n\nRegistered Investment Advisers are generally held to a fiduciary standard; not every financial professional is, which is why it is reasonable to ask directly whether an advisor is acting as a fiduciary for a given account.',
    aliases: [],
    difficulty: 'intermediate',
    category: 'Personal Finance',
    references: [],
    examples: [],
    relations: [],
  },
  {
    term: 'Opportunity Cost',
    slug: 'opportunity-cost-glossary',
    short_def: 'The value of the next-best alternative given up when making a choice.',
    full_def:
      'Opportunity cost is the value of what you give up when you choose one option over another. Every financial decision has an opportunity cost equal to what the same money or time could have achieved if used differently.\n\nIt is a useful lens for comparing paying off low-interest debt early versus investing extra cash, or choosing between two competing uses of a limited budget.',
    aliases: [],
    difficulty: 'beginner',
    category: 'Personal Finance',
    references: [],
    examples: [],
    relations: [],
  },
  {
    term: 'Bear Market',
    slug: 'bear-market-glossary',
    short_def: 'A sustained decline of 20% or more in a broad market index from its recent high.',
    full_def:
      'A bear market describes a decline of 20% or more in a broad market index, such as the S&P 500, from its most recent high, typically accompanied by widespread investor pessimism and weak economic data.\n\nA smaller decline of 10% to 20% is generally classified as a "correction" instead. Historically, bear markets have eventually been followed by recovery and new highs, though the timing cannot be predicted in advance.',
    aliases: [],
    difficulty: 'beginner',
    category: 'Markets',
    references: [],
    examples: [],
    relations: [],
  },
  {
    term: 'Quantitative Easing',
    slug: 'quantitative-easing-glossary',
    short_def: 'A central bank tool of buying large quantities of securities to inject liquidity and lower long-term rates.',
    full_def:
      'Quantitative easing (QE) is a monetary policy tool in which a central bank purchases large quantities of government bonds or other securities, adding liquidity to the financial system and pushing down long-term interest rates.\n\nIt is typically used when short-term interest rates are already near zero and a central bank needs additional tools to stimulate a weak economy.',
    aliases: ['QE'],
    difficulty: 'advanced',
    category: 'Economics',
    references: [],
    examples: [],
    relations: [
      { relation: 'related', related: { term: 'Yield Curve', slug: 'yield-curve-glossary', difficulty: 'intermediate' } },
    ],
  },
];

export const glossaryFallbackListItems: GlossaryListItem[] = glossaryFallbackTerms.map((t) => ({
  id: t.slug,
  term: t.term,
  slug: t.slug,
  short_def: t.short_def,
  difficulty: t.difficulty,
  category: t.category,
  status: 'published',
}));

export function getFallbackGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryFallbackTerms.find((t) => t.slug === slug);
}
