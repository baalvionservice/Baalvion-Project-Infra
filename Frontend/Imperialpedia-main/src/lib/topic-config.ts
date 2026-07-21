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
    title: 'Banking',
    description:
      'Understand savings, checking accounts, credit cards, loans, mortgages, and banking products with clear explanations, comparisons, and practical financial guidance.',
    metaTitle: 'Banking Guide | Savings Accounts, Credit Cards, Loans & More',
    metaDescription:
      'Learn how banking products work, compare savings accounts, credit cards, loans, mortgages, and find smarter ways to manage your money.',
  },
  checking: {
    tag: 'CHECKING ACCOUNTS',
    title: 'Checking Accounts',
    description:
      'Compare checking account types, fees, and features, and learn how everyday banking accounts work.',
    metaTitle: 'Checking Accounts — Guides & Comparisons',
    metaDescription:
      'Understand checking account fees, features, and how to choose the right everyday banking account for your needs.',
  },
  'credit-cards': {
    tag: 'CREDIT CARDS',
    title: 'Credit Cards',
    description:
      'How credit cards work, interest and rewards explained, and how to use credit responsibly.',
    metaTitle: 'Credit Cards — Guides, Rewards & Interest Explained',
    metaDescription:
      'Learn how credit cards work, how interest and rewards are calculated, and how to choose and use a credit card wisely.',
  },
  loans: {
    tag: 'PERSONAL LOANS',
    title: 'Personal Loans',
    description:
      'How personal loans work, interest rates, fees, and when a loan makes sense versus other borrowing options.',
    metaTitle: 'Personal Loans — Rates, Fees & Guides',
    metaDescription:
      'Understand how personal loans work, what determines your interest rate, and how to compare loan offers.',
  },
  'auto-loans': {
    tag: 'AUTO LOANS',
    title: 'Auto Loans',
    description:
      'Car loan basics — rates, terms, and new-vs-used financing — to help you borrow smarter for a vehicle.',
    metaTitle: 'Auto Loans — Rates, Terms & Guides',
    metaDescription:
      'Learn how auto loans work, compare new vs. used car financing, and find ways to secure a better interest rate.',
  },
  'student-loans': {
    tag: 'STUDENT LOANS',
    title: 'Student Loans',
    description:
      'Federal and private student loans, repayment plans, and strategies for managing education debt.',
    metaTitle: 'Student Loans — Repayment & Guides',
    metaDescription:
      'Compare federal and private student loans, understand repayment plans, and learn strategies for managing student debt.',
  },
  'cd-rates': {
    tag: 'CDS',
    title: 'Certificates of Deposit (CDs)',
    description:
      'How CDs work, current rate trends, and CD ladder strategies for growing savings safely.',
    metaTitle: 'CD Rates — Certificates of Deposit Explained',
    metaDescription:
      'Learn how certificates of deposit work, compare CD rates, and explore CD ladder strategies for steady, low-risk returns.',
  },
  'money-market': {
    tag: 'MONEY MARKET',
    title: 'Money Market Accounts',
    description:
      'How money market accounts work and when they make sense versus savings accounts and CDs.',
    metaTitle: 'Money Market Accounts Explained',
    metaDescription:
      'Understand how money market accounts work and how they compare to savings accounts and CDs.',
  },
  'banking-reviews': {
    tag: 'BANKING REVIEWS',
    title: 'Banking Reviews',
    description:
      'Independent reviews of banks, credit cards, loans, and banking apps to help you compare real options.',
    metaTitle: 'Banking Reviews — Banks, Cards & Apps Compared',
    metaDescription:
      'Independent, editorially reviewed comparisons of banks, credit cards, loans, and banking apps.',
  },
  'bank-reviews': {
    tag: 'BANK REVIEWS',
    title: 'Bank Reviews',
    description:
      'In-depth reviews of banks and credit unions, covering fees, rates, features, and who each is best for.',
    metaTitle: 'Bank Reviews — Fees, Rates & Features Compared',
    metaDescription:
      'Independent bank reviews covering fees, interest rates, features, and who each bank is best suited for.',
  },
  'credit-card-reviews': {
    tag: 'CREDIT CARD REVIEWS',
    title: 'Credit Card Reviews',
    description:
      'Reviews of cashback, travel, and secured credit cards, with real pros, cons, and fee breakdowns.',
    metaTitle: 'Credit Card Reviews — Rewards, Fees & Ratings',
    metaDescription:
      'Independent credit card reviews covering rewards, fees, interest rates, and who each card is best for.',
  },
  'loan-reviews': {
    tag: 'LOAN REVIEWS',
    title: 'Loan Reviews',
    description:
      'Reviews of personal loan, auto loan, and mortgage lenders, comparing rates, fees, and eligibility.',
    metaTitle: 'Loan Reviews — Lenders Compared',
    metaDescription:
      'Independent lender reviews comparing rates, fees, and eligibility across personal, auto, and mortgage loans.',
  },
  'app-reviews': {
    tag: 'APP REVIEWS',
    title: 'Banking App Reviews',
    description:
      'Reviews of banking and budgeting apps, covering features, security, and ease of use.',
    metaTitle: 'Banking App Reviews — Features & Security Compared',
    metaDescription:
      'Independent reviews of banking and budgeting apps, covering features, security, fees, and usability.',
  },
  reviews: {
    tag: 'REVIEWS',
    title: 'Financial Reviews',
    description:
      'Independent reviews and comparisons of banks, brokers, credit cards, loans, investment platforms, apps, and financial services to help you make smarter money decisions.',
    metaTitle: 'Financial Product Reviews & Comparisons',
    metaDescription:
      'Independent reviews and comparisons of banks, brokers, credit cards, loans, robo-advisors, and financial apps to help you choose with confidence.',
  },
  'broker-reviews': {
    tag: 'BROKER REVIEWS',
    title: 'Broker Reviews',
    description:
      'Independent reviews of online brokers, comparing fees, platforms, investment options, and who each is best for.',
    metaTitle: 'Broker Reviews — Fees, Platforms & Ratings Compared',
    metaDescription:
      'Independent broker reviews covering fees, account types, investment options, and trading platforms.',
  },
  'insurance-reviews': {
    tag: 'INSURANCE REVIEWS',
    title: 'Insurance Reviews',
    description:
      'Independent reviews of life, auto, and home insurers, comparing coverage, pricing factors, and who each is best for.',
    metaTitle: 'Insurance Reviews — Coverage & Ratings Compared',
    metaDescription:
      'Independent insurance company reviews covering coverage options, policy types, and who each insurer is best suited for.',
  },
  'advisor-reviews': {
    tag: 'ADVISOR REVIEWS',
    title: 'Financial Advisor Reviews',
    description:
      'Independent reviews of financial advisory firms and services, comparing fees, minimums, and services offered.',
    metaTitle: 'Financial Advisor Reviews — Fees & Services Compared',
    metaDescription:
      'Independent reviews of financial advisory firms, comparing advisory fees, account minimums, and services offered.',
  },
  'robo-advisors': {
    tag: 'ROBO-ADVISOR REVIEWS',
    title: 'Robo-Advisor Reviews',
    description:
      'Independent reviews of automated investing platforms, comparing management fees, portfolio options, and tax features.',
    metaTitle: 'Robo-Advisor Reviews — Fees & Features Compared',
    metaDescription:
      'Independent robo-advisor reviews covering management fees, portfolio construction, tax-loss harvesting, and account minimums.',
  },
  'tax-software': {
    tag: 'TAX SOFTWARE REVIEWS',
    title: 'Tax Software Reviews',
    description:
      'Independent reviews of tax filing software, comparing pricing, ease of use, and support for complex tax situations.',
    metaTitle: 'Tax Software Reviews — Pricing & Features Compared',
    metaDescription:
      'Independent tax software reviews comparing pricing tiers, ease of use, and support for itemized deductions and self-employment income.',
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
      'Understand the forces shaping markets and everyday life — GDP, inflation, unemployment, interest rates, central banks, and global economic trends explained clearly.',
    metaTitle: 'Economy News & Macroeconomic Analysis',
    metaDescription:
      'Understand GDP, inflation, unemployment, interest rates, central banks, and global economic trends — explained clearly for beginners and investors alike.',
  },
  indicators: {
    tag: 'ECONOMIC INDICATORS',
    title: 'Economic Indicators',
    description:
      'CPI, PPI, retail sales, consumer confidence, PMI, and the data investors watch to read the health of the economy.',
    metaTitle: 'Economic Indicators Explained',
    metaDescription:
      'Learn how CPI, PPI, retail sales, consumer confidence, and other leading and lagging indicators reveal the direction of the economy.',
  },
  'fiscal-policy': {
    tag: 'FISCAL POLICY',
    title: 'Fiscal Policy',
    description:
      'Government spending, taxation, budget deficits, and the national debt — and how fiscal decisions ripple through the economy.',
    metaTitle: 'Fiscal Policy Explained',
    metaDescription:
      'Understand government spending, taxation, budget deficits, and national debt, and how fiscal policy decisions affect growth and inflation.',
  },
  'monetary-policy': {
    tag: 'MONETARY POLICY',
    title: 'Monetary Policy',
    description:
      'How central banks manage the money supply — interest rates, quantitative easing, and inflation targeting explained.',
    metaTitle: 'Monetary Policy Explained',
    metaDescription:
      'Learn how central banks use interest rates, quantitative easing, and inflation targeting to manage the money supply and the broader economy.',
  },
  global: {
    tag: 'GLOBAL ECONOMY',
    title: 'Global Economy',
    description:
      'International trade, currency exchange rates, supply chains, and how economies around the world affect each other.',
    metaTitle: 'Global Economy News & Analysis',
    metaDescription:
      'Coverage of international trade, currency exchange rates, global supply chains, and emerging markets shaping the world economy.',
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
  portfolio: {
    tag: 'PORTFOLIO',
    title: 'Portfolio Management',
    description:
      'Asset allocation, diversification, risk tolerance, and the ongoing discipline of managing an investment portfolio.',
    metaTitle: 'Portfolio Management Guides & Strategy',
    metaDescription:
      'Learn how to allocate assets, diversify, assess risk tolerance, and manage a portfolio for the long term.',
  },
  brokers: {
    tag: 'BROKERS',
    title: 'Brokers',
    description:
      'How brokers work, what separates full-service from discount platforms, and how to evaluate one before opening an account.',
    metaTitle: 'Broker Guides — Fees, Regulation & Account Types',
    metaDescription:
      'Independent guides to choosing a stock broker — fee structures, regulation, account types, and what beginners should look for.',
  },
  'personal-finance': {
    tag: 'PERSONAL FINANCE',
    title: 'Personal Finance',
    description:
      'Practical money guidance — budgeting, saving, debt, credit, retirement, and the decisions that compound over a lifetime.',
    metaTitle: 'Personal Finance Guide | Budgeting, Saving, Debt & More',
    metaDescription:
      'Learn how to budget, save, manage debt, build credit, and plan for retirement with clear, practical personal finance guidance.',
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
  budgeting: {
    tag: 'BUDGETING',
    title: 'Budgeting',
    description:
      'Master your money with practical budgeting strategies, expense tracking methods, saving plans, and financial habits that help you spend smarter and reach your goals.',
    metaTitle: 'Budgeting Tips, Templates & Strategies',
    metaDescription:
      'Learn practical budgeting methods, from the 50/30/20 rule to zero-based budgeting, and build a spending plan that actually sticks.',
  },
  'budgeting-basics': {
    tag: 'BUDGETING BASICS',
    title: 'Budgeting Basics',
    description:
      'What a budget actually is, why it matters, and how to build your very first spending plan without feeling overwhelmed.',
    metaTitle: 'Budgeting Basics — A Beginner’s Guide',
    metaDescription:
      'Learn what a budget is, why budgeting matters, and how to start budgeting for the first time with simple, practical steps.',
  },
  'monthly-budget': {
    tag: 'MONTHLY BUDGET',
    title: 'Monthly Budget',
    description:
      'Checklists, calendars, and review habits for building a monthly budget that keeps working month after month, even when income is irregular.',
    metaTitle: 'Monthly Budget Guides, Checklists & Calendars',
    metaDescription:
      'Build and maintain a monthly budget with practical checklists, a budgeting calendar, and a repeatable monthly review process.',
  },
  'saving-money': {
    tag: 'SAVING MONEY',
    title: 'Saving Money',
    description:
      'Practical, everyday ways to cut expenses and save more — from groceries and utilities to transportation and frugal living habits.',
    metaTitle: 'How to Save Money — Practical Tips & Strategies',
    metaDescription:
      'Save more every month with practical tips for cutting expenses on groceries, utilities, and transportation, plus frugal living strategies that stick.',
  },
  'family-budget': {
    tag: 'FAMILY BUDGET',
    title: 'Family Budget',
    description:
      'Budgeting for households, kids, single parents, and couples — practical frameworks for managing money as a family.',
    metaTitle: 'Family Budgeting Guides — Kids, Couples & Single Parents',
    metaDescription:
      'Learn how to build a family budget, manage money with kids, budget as a single parent, and coordinate finances as a couple.',
  },
  'student-budget': {
    tag: 'STUDENT BUDGET',
    title: 'Student Budget',
    description:
      'Budgeting for college, part-time income, and the everyday expenses that come with student life.',
    metaTitle: 'Student Budgeting Guides — College & Part-Time Income',
    metaDescription:
      'Practical budgeting guidance for college students, including part-time income budgets and managing everyday student expenses.',
  },
  'budgeting-apps': {
    tag: 'BUDGET APPS',
    title: 'Budgeting Apps',
    description:
      'Comparisons of budgeting apps, spreadsheets, and manual tracking methods to help you find the system you’ll actually stick with.',
    metaTitle: 'Best Budgeting Apps & Tracking Methods Compared',
    metaDescription:
      'Compare the best budgeting apps, spreadsheet templates, and manual tracking methods to find the budgeting system that fits how you actually manage money.',
  },
  'advanced-budgeting': {
    tag: 'ADVANCED BUDGETING',
    title: 'Advanced Budgeting',
    description:
      'Budgeting strategies for freelancers, small business owners, and navigating inflation, recessions, and annual financial planning.',
    metaTitle: 'Advanced Budgeting Strategies',
    metaDescription:
      'Advanced budgeting guidance for freelancers and small business owners, plus how to budget through inflation, recessions, and annual planning.',
  },
  fed: {
    tag: 'FEDERAL RESERVE',
    title: 'The Federal Reserve',
    description:
      "Fed policy decisions, interest-rate moves, and what the FOMC's actions mean for borrowing costs, savings yields, and the broader economy.",
    metaTitle: 'Federal Reserve News & Interest Rate Policy',
    metaDescription:
      'Track Federal Reserve interest-rate decisions, FOMC statements, and analysis of how monetary policy affects loans, savings, and markets.',
  },
  savings: {
    tag: 'SAVINGS',
    title: 'Savings',
    description:
      'Savings accounts, CDs, and strategies to grow your emergency fund and short-term cash while keeping pace with inflation.',
    metaTitle: 'Savings Accounts, Rates & Strategy',
    metaDescription:
      'Compare savings account types and APYs, and learn how to build an emergency fund that keeps pace with inflation.',
  },
  'market-news': {
    tag: 'MARKET NEWS',
    title: 'Market News',
    description:
      'Coverage of stocks, earnings, economic data, central banks, commodities, crypto, and global markets — explained in plain English.',
    metaTitle: 'Market News | Stocks, Economy, Earnings & Global Markets',
    metaDescription:
      'Latest market news covering stocks, earnings, Federal Reserve decisions, inflation, commodities, crypto, and global markets explained clearly.',
  },
  'live-market-news': {
    tag: 'LIVE MARKETS',
    title: 'Live Market News',
    description:
      'Real-time market updates and same-day analysis of the stories moving stocks, rates, and currencies.',
    metaTitle: 'Live Market News & Real-Time Analysis',
    metaDescription:
      'Follow live market-moving news as it happens, with same-day analysis of stocks, interest rates, and currency moves.',
  },
  calendar: {
    tag: 'ECONOMIC CALENDAR',
    title: 'Economic Calendar',
    description:
      'Key economic releases and how to read them — FOMC meetings, the jobs report, CPI, and earnings season.',
    metaTitle: 'Economic Calendar — Key Release Dates Explained',
    metaDescription:
      'A guide to the economic calendar — FOMC meeting dates, the jobs report, CPI releases, and earnings season, and why each moves markets.',
  },
  mortgages: {
    tag: 'MORTGAGES',
    title: 'Mortgages',
    description:
      "Fixed vs. adjustable rates, refinancing, and what today's mortgage market means for homebuyers and owners.",
    metaTitle: 'Mortgage Rates, Guides & Homebuying News',
    metaDescription:
      'Mortgage rate trends, fixed vs. adjustable comparisons, and refinancing guidance for homebuyers and current homeowners.',
  },
  'interest-rates': {
    tag: 'INTEREST RATES',
    title: 'Interest Rates',
    description:
      'How benchmark rates move, why they change, and what higher or lower rates mean for loans, savings, and investments.',
    metaTitle: 'Interest Rate News & Analysis',
    metaDescription:
      'Understand how interest rate changes affect mortgages, credit cards, savings yields, and investment returns.',
  },
  debt: {
    tag: 'DEBT',
    title: 'Debt Management',
    description:
      'Strategies for paying down credit cards, loans, and other debt — from the snowball method to consolidation and beyond.',
    metaTitle: 'Debt Payoff Strategies & Management Guides',
    metaDescription:
      'Practical strategies for paying down debt faster, including the snowball and avalanche methods, consolidation, and credit-card payoff plans.',
  },
  'emergency-fund': {
    tag: 'EMERGENCY FUND',
    title: 'Emergency Fund',
    description:
      'How much to save, where to keep it, and how to work a fully-funded emergency fund into your monthly budget.',
    metaTitle: 'Emergency Fund Guides — How Much to Save & Where',
    metaDescription:
      'Learn how much to keep in an emergency fund, how to build one into your budget, and when it makes sense to use it.',
  },
  credit: {
    tag: 'CREDIT SCORES',
    title: 'Credit Scores',
    description:
      'How credit scores are calculated, what moves them up or down, and how to build and protect your credit over time.',
    metaTitle: 'Credit Scores — How They Work & How to Improve Them',
    metaDescription:
      'Learn how credit scores are calculated, what factors help or hurt your score, and practical steps to build and protect your credit.',
  },
  gdp: {
    tag: 'GDP',
    title: 'GDP & Economic Growth',
    description:
      "What gross domestic product measures, how it's calculated, and what quarterly GDP data reveals about the health of the economy.",
    metaTitle: 'GDP News & Economic Growth Analysis',
    metaDescription:
      'Track GDP growth data and understand what quarterly economic output figures mean for jobs, inflation, and markets.',
  },
  unemployment: {
    tag: 'UNEMPLOYMENT',
    title: 'Unemployment & Jobs',
    description:
      'Labor market data, unemployment claims, and what hiring trends signal about the direction of the economy.',
    metaTitle: 'Unemployment & Jobs Market News',
    metaDescription:
      'Labor market coverage including unemployment claims, payroll data, and what hiring trends mean for the broader economy.',
  },
  options: {
    tag: 'OPTIONS',
    title: 'Options Trading',
    description:
      'Calls, puts, and strategy basics for investors using options to hedge risk or generate income.',
    metaTitle: 'Options Trading News & Strategy Guides',
    metaDescription:
      'Options trading explained — calls, puts, spreads, and how investors use options to hedge risk or generate income.',
  },
  'company-news': {
    tag: 'COMPANY NEWS',
    title: 'Company News',
    description:
      'Earnings, leadership changes, and corporate developments from the companies that move markets.',
    metaTitle: 'Company News & Corporate Earnings',
    metaDescription:
      'Corporate earnings, leadership changes, and company developments from the businesses driving stock market moves.',
  },
  news: {
    tag: 'NEWS',
    title: 'Financial News',
    description:
      'The latest financial and economic headlines, curated and explained for everyday investors.',
    metaTitle: 'Financial News & Market Headlines',
    metaDescription:
      'The latest financial news and market headlines, explained in plain language for everyday investors.',
  },
  inflation: {
    tag: 'INFLATION',
    title: 'Inflation',
    description:
      "What's driving prices higher or lower, how inflation is measured, and what it means for your budget and investments.",
    metaTitle: 'Inflation News & Analysis',
    metaDescription:
      'Understand what drives inflation, how CPI and PCE are measured, and what rising or falling prices mean for your money.',
  },
  earnings: {
    tag: 'EARNINGS',
    title: 'Earnings',
    description:
      'Quarterly earnings reports, guidance, and the numbers behind the companies driving market performance.',
    metaTitle: 'Earnings News & Quarterly Reports',
    metaDescription:
      'Quarterly earnings coverage — revenue, profit, and guidance from the companies that move the stock market.',
  },
  'wealth-building': {
    tag: 'WEALTH BUILDING',
    title: 'Wealth Building',
    description:
      'Long-term strategies for growing net worth — saving rate, investing discipline, income growth, and the habits that compound over decades.',
    metaTitle: 'Wealth Building Strategies & Guides',
    metaDescription:
      'Practical wealth-building strategies covering saving rate, investing discipline, income growth, and the habits that compound over a lifetime.',
  },
  'budget-rules': {
    tag: 'BUDGET RULES',
    title: 'Budget Rules',
    description:
      'Proven budgeting frameworks — from the 50/30/20 rule to zero-based budgeting — for allocating income with a clear system.',
    metaTitle: 'Budget Rules & Frameworks Explained',
    metaDescription:
      'Compare proven budget rules and frameworks, including the 50/30/20 rule and zero-based budgeting, to find the system that fits your income.',
  },
  'debt-repayment-strategies': {
    tag: 'DEBT REPAYMENT',
    title: 'Debt Repayment Strategies',
    description:
      'Side-by-side comparisons of debt payoff methods — snowball, avalanche, and consolidation — to help you pick the fastest path out of debt.',
    metaTitle: 'Debt Repayment Strategies Compared',
    metaDescription:
      'Compare debt repayment strategies including the snowball method, avalanche method, and consolidation to find the fastest path out of debt.',
  },
  planning: {
    tag: 'FINANCIAL PLANNING',
    title: 'Financial Planning',
    description:
      'Goal-based money planning — setting priorities, building a plan around income and life changes, and tracking progress over time.',
    metaTitle: 'Financial Planning Guides & Strategy',
    metaDescription:
      'Financial planning guides covering goal-setting, life-stage planning, and how to build a money plan that adapts as your income and priorities change.',
  },
  'financial-independence': {
    tag: 'FINANCIAL INDEPENDENCE',
    title: 'Financial Independence',
    description:
      'Building toward work-optional income — savings rate, investment growth, and the paths (including FIRE) people use to reach financial independence.',
    metaTitle: 'Financial Independence & FIRE Guides',
    metaDescription:
      'Guides to financial independence — savings rate, investment growth, and the different FIRE strategies people use to reach work-optional income.',
  },
  'money-management': {
    tag: 'MONEY MANAGEMENT',
    title: 'Money Management',
    description:
      'Everyday money habits and systems — tracking spending, organizing accounts, and building the discipline that keeps a financial plan on track.',
    metaTitle: 'Money Management Tips & Habits',
    metaDescription:
      'Practical money management tips covering spending trackers, account organization, and the everyday habits that keep a financial plan on track.',
  },
  'financial-calculators': {
    tag: 'CALCULATORS',
    title: 'Financial Calculators',
    description:
      'How compound interest, retirement, loan, mortgage, and budgeting calculators work — and how to read their results.',
    metaTitle: 'Financial Calculator Guides — How Each One Works',
    metaDescription:
      'Guides to using financial calculators for compound interest, retirement, loans, mortgages, and budgeting, and how to interpret the results.',
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
  'budgeting-basics': 'PersonalFinance',
  'monthly-budget': 'PersonalFinance',
  'saving-money': 'PersonalFinance',
  'family-budget': 'PersonalFinance',
  'student-budget': 'PersonalFinance',
  'advanced-budgeting': 'PersonalFinance',
  'budgeting-apps': 'PersonalFinance',
  debt: 'PersonalFinance',
  credit: 'PersonalFinance',
  'credit-cards': 'PersonalFinance',
  savings: 'PersonalFinance',
  checking: 'PersonalFinance',
  'cd-rates': 'PersonalFinance',
  'money-market': 'PersonalFinance',
  'emergency-fund': 'PersonalFinance',
  'wealth-building': 'PersonalFinance',
  'budget-rules': 'PersonalFinance',
  'debt-repayment-strategies': 'PersonalFinance',
  'financial-independence': 'PersonalFinance',
  'money-management': 'PersonalFinance',
  income: 'PersonalFinance',
  taxes: 'PersonalFinance',
  'estate-planning': 'PersonalFinance',
  planning: 'PersonalFinance',
  retirement: 'PersonalFinance',
  loans: 'PersonalFinance',
  'student-loans': 'PersonalFinance',
  'auto-loans': 'PersonalFinance',
  insurance: 'PersonalFinance',
  // Reviews / guides
  reviews: 'Guides',
  'advisor-reviews': 'Guides',
  'app-reviews': 'Guides',
  'bank-reviews': 'Guides',
  'banking-reviews': 'Guides',
  'broker-reviews': 'Guides',
  'credit-card-reviews': 'Guides',
  'insurance-reviews': 'Guides',
  'loan-reviews': 'Guides',
  'robo-advisors': 'Guides',
  'tax-software': 'Guides',
  'financial-calculators': 'Guides',
  calendar: 'Guides',
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

/**
 * Parent-category eyebrow groups (mirrors the nav hierarchy in Navbar.tsx's NAV,
 * plus the Budgeting hub's own sub-pages, which aren't in the top nav). Drives the
 * small blue "INVESTING" / "PERSONAL FINANCE" label shown above a subcategory
 * page's title, linking back to its parent category — e.g. /bonds shows "INVESTING"
 * linking to /investing, the same way Investopedia labels its category pages.
 *
 * A slug listed under more than one group (e.g. "retirement" is reachable from both
 * Investing and Personal Finance in the nav) resolves to whichever group is listed
 * first below — one canonical parent per page, since the eyebrow can only show one.
 */
interface CategoryGroup {
  label: string;
  href: string;
  children: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'INVESTING',
    href: '/investing',
    children: ['stocks', 'bonds', 'etfs', 'mutual-funds', 'options', 'commodities', 'cryptocurrency', 'real-estate', 'retirement', 'portfolio', 'brokers'],
  },
  {
    label: 'MARKETS',
    href: '/market-news',
    children: ['live-market-news', 'company-news', 'earnings', 'crypto', 'calendar'],
  },
  {
    label: 'BANKING',
    href: '/banking',
    children: ['savings', 'checking', 'cd-rates', 'money-market', 'credit-cards', 'loans', 'mortgages', 'auto-loans', 'student-loans', 'banking-reviews'],
  },
  {
    label: 'PERSONAL FINANCE',
    href: '/personal-finance',
    children: ['budgeting', 'debt', 'credit', 'planning', 'financial-independence', 'money-management', 'financial-calculators'],
  },
  {
    label: 'ECONOMY',
    href: '/economy',
    children: ['indicators', 'fed', 'inflation', 'gdp', 'unemployment', 'interest-rates', 'fiscal-policy', 'monetary-policy', 'global'],
  },
  {
    label: 'REVIEWS',
    href: '/reviews',
    children: ['broker-reviews', 'bank-reviews', 'credit-card-reviews', 'loan-reviews', 'insurance-reviews', 'robo-advisors', 'app-reviews', 'tax-software', 'advisor-reviews'],
  },
  {
    label: 'BUDGETING',
    href: '/budgeting',
    children: ['budgeting-basics', 'monthly-budget', 'saving-money', 'family-budget', 'student-budget', 'budgeting-apps', 'advanced-budgeting', 'budget-rules'],
  },
];

const PARENT_BY_SLUG: Record<string, { label: string; href: string }> = (() => {
  const map: Record<string, { label: string; href: string }> = {};
  for (const group of CATEGORY_GROUPS) {
    for (const child of group.children) {
      if (!(child in map)) map[child] = { label: group.label, href: group.href };
    }
  }
  return map;
})();

/** The parent category eyebrow for a subcategory page, or undefined for a top-level page. */
export function parentFor(slug: string): { label: string; href: string } | undefined {
  return PARENT_BY_SLUG[slug];
}

export interface SiblingTopic {
  slug: string;
  label: string;
}

/**
 * Sibling sub-topics within the same nav group as `slug` (including `slug` itself),
 * e.g. on /bonds this returns Stocks, Bonds, ETFs, Mutual Funds, Options, Commodities,
 * Cryptocurrency, Real Estate, Retirement, Portfolio, Brokers. Powers a tab strip so a
 * reader who lands on one sub-topic page can jump directly to a related one instead of
 * dead-ending on a single-topic silo — without collapsing these into fewer routes (each
 * keeps its own indexable URL). Returns undefined for a page with no group (e.g. a
 * top-level parent hub like /investing, which already has its own topic browser).
 */
export function siblingsFor(slug: string): SiblingTopic[] | undefined {
  const group = CATEGORY_GROUPS.find((g) => g.children.includes(slug));
  if (!group || group.children.length < 2) return undefined;
  return group.children.map((child) => ({ slug: child, label: topicCopy(child).title }));
}
