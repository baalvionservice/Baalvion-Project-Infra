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
  /**
   * Longer educational primer paragraph (~100-150 words), rendered below the
   * article feed on <CategoryFeed> so the page has substantive, unique prose
   * independent of how many articles are currently published in the category.
   */
  intro?: string;
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
    intro:
      "Economic indicators are the data releases investors and policymakers use to gauge the direction of the economy, generally grouped into leading indicators (which tend to change before the economy does, like building permits or consumer confidence), lagging indicators (which confirm a trend already underway, like the unemployment rate), and coincident indicators (which move alongside the economy in real time, like industrial production). CPI and PPI measure price changes at the consumer and producer level respectively; PMI surveys gauge whether manufacturing and services activity is expanding or contracting. No single indicator tells the whole story, which is why economists and markets typically weigh several together rather than reacting to any one release in isolation.",
    metaTitle: 'Economic Indicators Explained',
    metaDescription:
      'Learn how CPI, PPI, retail sales, consumer confidence, and other leading and lagging indicators reveal the direction of the economy.',
  },
  'fiscal-policy': {
    tag: 'FISCAL POLICY',
    title: 'Fiscal Policy',
    description:
      'Government spending, taxation, budget deficits, and the national debt — and how fiscal decisions ripple through the economy.',
    intro:
      "Fiscal policy refers to government decisions about spending and taxation, distinct from the monetary policy set by central banks. Expansionary fiscal policy — higher spending or lower taxes — aims to stimulate a weak economy but can widen budget deficits and add to the national debt if not offset elsewhere; contractionary fiscal policy does the reverse to cool an overheating economy or rein in deficits. Because fiscal and monetary policy can work in tandem or in opposite directions — for example, government stimulus spending while a central bank simultaneously raises rates to fight inflation — understanding both together gives a fuller picture of the forces shaping growth and prices.",
    metaTitle: 'Fiscal Policy Explained',
    metaDescription:
      'Understand government spending, taxation, budget deficits, and national debt, and how fiscal policy decisions affect growth and inflation.',
  },
  'monetary-policy': {
    tag: 'MONETARY POLICY',
    title: 'Monetary Policy',
    description:
      'How central banks manage the money supply — interest rates, quantitative easing, and inflation targeting explained.',
    intro:
      "Monetary policy is how a central bank — the Federal Reserve in the U.S. — manages the money supply and credit conditions to pursue its mandates of stable prices and maximum employment. The primary tool is the federal funds rate, but central banks also use quantitative easing (large-scale asset purchases to inject liquidity) and quantitative tightening (letting those assets run off) to influence longer-term borrowing costs. Because monetary policy works with a lag — rate changes take months to fully show up in economic data — central banks act on forecasts and incoming data rather than waiting for problems to fully materialize, which is why FOMC statements are scrutinized as closely as the rate decisions themselves.",
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
    intro:
      "Cryptocurrency refers to digital assets secured by blockchain technology — a distributed, cryptographically verified ledger that records ownership and transactions without relying on a central bank or clearinghouse. Bitcoin, the first and largest cryptocurrency, was designed primarily as a store of value and medium of exchange; Ethereum and other smart-contract platforms extended the technology to support decentralized applications, lending protocols, and tokenized assets. The asset class remains considerably more volatile than traditional equities or bonds, trades continuously across a fragmented set of exchanges, and its regulatory treatment still varies significantly by country — all factors worth understanding before treating price moves in isolation.",
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
    intro:
      "An exchange-traded fund (ETF) is a basket of securities — stocks, bonds, commodities, or a mix — that trades on an exchange throughout the day like an individual stock, combining the diversification of a mutual fund with intraday liquidity. Most ETFs are passively managed, tracking an index like the S&P 500 at a low annual expense ratio, though actively managed and leveraged or inverse ETFs also exist with different risk profiles and costs. Because ETF shares are created and redeemed by authorized participants rather than the fund buying and selling securities directly for each investor, they're also generally more tax-efficient than traditional mutual funds in a taxable account.",
    metaTitle: 'ETF News & Fund Analysis',
  },
  'real-estate': {
    tag: 'REAL ESTATE',
    title: 'Real Estate',
    description:
      'Housing, mortgages, REITs, and property investing — the trends shaping the market.',
    intro:
      "Real estate coverage spans residential and commercial property markets, the mortgage financing that supports them, and real estate investment trusts (REITs) that let investors gain property exposure without directly owning buildings. Housing activity is unusually sensitive to interest rates, since most home purchases are financed — a rise in mortgage rates directly raises monthly payments and can cool both home prices and transaction volume even without any change in the underlying value of the properties themselves. REITs, by contrast, trade like stocks and are valued partly on property fundamentals and partly on the same interest-rate sensitivity that affects dividend-paying equities generally.",
    metaTitle: 'Real Estate News & Property Investing',
  },
  commodities: {
    tag: 'COMMODITIES',
    title: 'Commodities',
    description:
      'Oil, gold, natural gas, and the raw-material markets that move with global supply, demand, and the dollar.',
    intro:
      "Commodities are raw or primary economic goods — energy products like crude oil and natural gas, metals like gold and copper, and agricultural products — that trade in standardized units on global exchanges, largely interchangeable regardless of producer. Commodity prices are driven primarily by global supply and demand balances, geopolitical events affecting production regions, and currency moves, since most commodities are priced in U.S. dollars, so a weaker dollar tends to support commodity prices and vice versa. Because commodity price swings often show up in headline inflation data before they filter through to other parts of the economy, commodities coverage is closely tied to the broader inflation and monetary-policy conversation.",
    metaTitle: 'Commodities News & Analysis',
    metaDescription:
      'Track oil, gold, natural gas, and other commodity prices, and understand what drives supply, demand, and the raw-material markets.',
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
    intro:
      "A budget is simply a plan for how income will be spent, saved, and allocated over a given period — its purpose is to make spending intentional rather than reactive. Building a first budget generally starts with tracking actual income and expenses for a month to see where money currently goes, then setting category limits based on priorities rather than guesses. The most common reason budgets fail isn't the framework chosen but unrealistic category limits set without real spending data behind them, which is why tracking before restricting tends to produce a budget people can actually sustain.",
    metaTitle: 'Budgeting Basics — A Beginner’s Guide',
    metaDescription:
      'Learn what a budget is, why budgeting matters, and how to start budgeting for the first time with simple, practical steps.',
  },
  'monthly-budget': {
    tag: 'MONTHLY BUDGET',
    title: 'Monthly Budget',
    description:
      'Checklists, calendars, and review habits for building a monthly budget that keeps working month after month, even when income is irregular.',
    intro:
      "A monthly budget only stays useful if it's reviewed and adjusted on a regular cadence — most budgets that fail do so not from a bad initial plan but from never being revisited as actual spending diverges from it. A recurring monthly review (comparing planned versus actual spending by category, then adjusting the next month's limits) turns a static plan into a system that improves over time. For irregular income, basing the budget on a conservative baseline month rather than an average smooths out the risk of overcommitting spending in a leaner month.",
    metaTitle: 'Monthly Budget Guides, Checklists & Calendars',
    metaDescription:
      'Build and maintain a monthly budget with practical checklists, a budgeting calendar, and a repeatable monthly review process.',
  },
  'saving-money': {
    tag: 'SAVING MONEY',
    title: 'Saving Money',
    description:
      'Practical, everyday ways to cut expenses and save more — from groceries and utilities to transportation and frugal living habits.',
    intro:
      "Cutting expenses meaningfully usually comes from a handful of larger, recurring line items — housing, transportation, and food — rather than eliminating many small purchases, since a single large fixed cost typically outweighs dozens of small discretionary ones. Practical approaches include auditing recurring subscriptions, comparison-shopping for insurance and utilities on a regular schedule (rates change even when you don't switch providers), and separating genuine needs from wants before cutting. Frugal habits compound over time the same way investment returns do — an expense trimmed permanently saves money every month going forward, not just once.",
    metaTitle: 'How to Save Money — Practical Tips & Strategies',
    metaDescription:
      'Save more every month with practical tips for cutting expenses on groceries, utilities, and transportation, plus frugal living strategies that stick.',
  },
  'family-budget': {
    tag: 'FAMILY BUDGET',
    title: 'Family Budget',
    description:
      'Budgeting for households, kids, single parents, and couples — practical frameworks for managing money as a family.',
    intro:
      "Budgeting as a household introduces coordination that a single-person budget doesn't require — merging or tracking separate incomes, agreeing on shared versus individual spending categories, and planning around child-related costs that shift substantially by age, from childcare in early years to activities and food later on. Couples commonly use one of a few structures: fully joint finances, fully separate with agreed shared-expense splits, or a hybrid with joint accounts for shared costs and individual accounts for discretionary spending. Single parents managing a household budget alone face the same categories with less income-splitting flexibility, which often makes an emergency fund and childcare cost planning even higher priorities.",
    metaTitle: 'Family Budgeting Guides — Kids, Couples & Single Parents',
    metaDescription:
      'Learn how to build a family budget, manage money with kids, budget as a single parent, and coordinate finances as a couple.',
  },
  'student-budget': {
    tag: 'STUDENT BUDGET',
    title: 'Student Budget',
    description:
      'Budgeting for college, part-time income, and the everyday expenses that come with student life.',
    intro:
      "Budgeting during college typically means managing irregular, part-time, or seasonal income against costs that don't stay constant either — tuition and housing usually due in lump sums, while food and personal expenses are ongoing. Building a student budget generally starts by separating fixed costs already covered by financial aid, family contributions, or scholarships from costs the student is personally responsible for month to month, then setting spending limits against actual part-time or work-study income rather than projected totals. Student discounts, campus meal plans, and used or rented textbooks are common, practical levers for reducing costs during this specific life stage.",
    metaTitle: 'Student Budgeting Guides — College & Part-Time Income',
    metaDescription:
      'Practical budgeting guidance for college students, including part-time income budgets and managing everyday student expenses.',
  },
  'budgeting-apps': {
    tag: 'BUDGET APPS',
    title: 'Budgeting Apps',
    description:
      'Comparisons of budgeting apps, spreadsheets, and manual tracking methods to help you find the system you’ll actually stick with.',
    intro:
      "Budgeting apps generally fall into a few categories: automatic account-aggregation tools that pull in transactions and categorize spending with minimal manual entry, zero-based budgeting apps that require actively assigning every dollar a job, and simple expense trackers that log spending without enforcing a plan. Spreadsheets and manual tracking remain viable alternatives for people who want full control over categories and formulas without a subscription cost, though they require more discipline to keep updated. The most effective tool is rarely the one with the most features — it's the one whose friction level matches how much manual effort someone will realistically keep up with.",
    metaTitle: 'Best Budgeting Apps & Tracking Methods Compared',
    metaDescription:
      'Compare the best budgeting apps, spreadsheet templates, and manual tracking methods to find the budgeting system that fits how you actually manage money.',
  },
  'advanced-budgeting': {
    tag: 'ADVANCED BUDGETING',
    title: 'Advanced Budgeting',
    description:
      'Budgeting strategies for freelancers, small business owners, and navigating inflation, recessions, and annual financial planning.',
    intro:
      "Budgeting gets more complex once income is variable rather than a fixed salary — a common reality for freelancers and small business owners, who need to budget around irregular cash flow, separate business and personal expenses, and set aside for quarterly estimated taxes that a salaried budget doesn't require. Advanced budgeting also covers adapting a plan to changing conditions: building in a buffer for inflation eating into a fixed budget over time, adjusting spending during a recession or income disruption, and running an annual review to reset categories as income, goals, or life circumstances change rather than letting a static budget go stale.",
    metaTitle: 'Advanced Budgeting Strategies',
    metaDescription:
      'Advanced budgeting guidance for freelancers and small business owners, plus how to budget through inflation, recessions, and annual planning.',
  },
  fed: {
    tag: 'FEDERAL RESERVE',
    title: 'The Federal Reserve',
    description:
      "Fed policy decisions, interest-rate moves, and what the FOMC's actions mean for borrowing costs, savings yields, and the broader economy.",
    intro:
      "The Federal Reserve is the central bank of the United States, tasked by Congress with a dual mandate: stable prices and maximum sustainable employment. Its main policy tool, the federal funds rate, is set by the Federal Open Market Committee (FOMC) at regularly scheduled meetings throughout the year, with decisions accompanied by a statement and, at alternating meetings, updated economic projections and a press conference from the Fed Chair. Markets parse Fed communications closely — not just the rate decision itself but the tone of the statement and any forward guidance — because expectations about future rate moves are often already priced into markets well before the Fed actually acts.",
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
    intro:
      "An economic calendar tracks the scheduled release dates for the data points that most often move markets — the monthly jobs report, CPI and PCE inflation readings, FOMC rate decisions, GDP estimates, and corporate earnings during reporting season. Because these releases are scheduled well in advance, markets often price in expectations ahead of time, which means the reaction on release day is frequently driven more by how the actual number compares to consensus forecasts than by the number itself in isolation. Traders and long-term investors use an economic calendar differently — for short-term positioning around expected volatility, or simply to understand why markets moved sharply on a given day.",
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
    intro:
      "Interest rates represent the cost of borrowing money or the return earned on savings, and in the U.S. they're anchored by the federal funds rate — the rate the Federal Reserve sets for banks lending to each other overnight. Changes to that benchmark ripple outward to mortgage rates, credit card APRs, auto loans, savings account yields, and bond prices, though not always by the same amount or on the same timeline. The Fed raises rates to cool inflation by making borrowing more expensive and saving more attractive, and cuts rates to stimulate growth when the economy is slowing — a balancing act reflected in every FOMC meeting.",
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
    intro:
      "An emergency fund is cash set aside specifically for unplanned expenses — job loss, medical bills, urgent repairs — kept separate from everyday spending and investment accounts so it's available without having to sell investments at a bad time. Common guidance suggests three to six months of essential expenses, though the right target varies with job stability, whether a household has one income or two, and existing insurance coverage. Because the fund's job is availability rather than growth, it's typically held in a high-yield savings account or similar low-risk, liquid vehicle rather than invested in the market, where a downturn could coincide with exactly the moment the money is needed.",
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
    intro:
      "Gross Domestic Product (GDP) measures the total monetary value of all finished goods and services produced within a country over a specific period, and is the single most-watched gauge of economic size and growth. In the U.S., the Bureau of Economic Analysis reports GDP quarterly, first as an advance estimate that gets revised twice as more complete data arrives. Economists commonly define a recession as two consecutive quarters of negative GDP growth, though the official U.S. determination, made by the National Bureau of Economic Research, considers a broader set of indicators. Markets react most to whether GDP growth is accelerating, decelerating, or reversing relative to expectations, not just its absolute level.",
    metaTitle: 'GDP News & Economic Growth Analysis',
    metaDescription:
      'Track GDP growth data and understand what quarterly economic output figures mean for jobs, inflation, and markets.',
  },
  unemployment: {
    tag: 'UNEMPLOYMENT',
    title: 'Unemployment & Jobs',
    description:
      'Labor market data, unemployment claims, and what hiring trends signal about the direction of the economy.',
    intro:
      "The unemployment rate measures the share of the labor force that is jobless and actively seeking work, and is one of the Federal Reserve's two statutory mandates alongside price stability. In the U.S., the headline rate comes from the Bureau of Labor Statistics' monthly jobs report, alongside nonfarm payrolls (net jobs added or lost) and wage growth — together these three figures are among the most market-moving economic releases each month. A rising unemployment rate can signal a cooling economy and often precedes interest-rate cuts, while a very low rate can fuel wage-driven inflation pressure, which is why labor-market data is read alongside inflation figures rather than in isolation.",
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
    intro:
      "Inflation is the rate at which prices for goods and services rise over time, eroding the purchasing power of each dollar. In the United States, the two most closely watched gauges are the Consumer Price Index (CPI), which tracks a fixed basket of goods and services bought by urban consumers, and the Personal Consumption Expenditures (PCE) index, the Federal Reserve's preferred measure because it adjusts more quickly as spending habits shift. Moderate, stable inflation is considered normal in a growing economy; the concern is when it runs persistently above a central bank's target, prompting interest-rate responses that ripple through mortgages, savings yields, and stock valuations.",
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
  'budget-rules': {
    tag: 'BUDGET RULES',
    title: 'Budget Rules',
    description:
      'Proven budgeting frameworks — from the 50/30/20 rule to zero-based budgeting — for allocating income with a clear system.',
    intro:
      "Budgeting frameworks give structure to how income gets allocated, replacing guesswork with a repeatable system. The 50/30/20 rule splits after-tax income into needs, wants, and savings or debt repayment; zero-based budgeting assigns every dollar a job so income minus allocations equals zero; envelope budgeting allocates cash, physical or digital, to specific spending categories to enforce limits. No single framework is objectively best — the right one depends on how variable your income is, how many financial goals you're balancing at once, and simply which system you'll actually maintain consistently, since a budget only works if it's followed.",
    metaTitle: 'Budget Rules & Frameworks Explained',
    metaDescription:
      'Compare proven budget rules and frameworks, including the 50/30/20 rule and zero-based budgeting, to find the system that fits your income.',
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
  'budget-rules': 'PersonalFinance',
  'financial-independence': 'PersonalFinance',
  'money-management': 'PersonalFinance',
  income: 'PersonalFinance',
  taxes: 'PersonalFinance',
  planning: 'PersonalFinance',
  retirement: 'PersonalFinance',
  loans: 'PersonalFinance',
  'student-loans': 'PersonalFinance',
  'auto-loans': 'PersonalFinance',
  insurance: 'PersonalFinance',
  // Reviews / guides
  reviews: 'Guides',
  'app-reviews': 'Guides',
  'banking-reviews': 'Guides',
  'loan-reviews': 'Guides',
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
    children: ['live-market-news', 'earnings', 'crypto', 'calendar'],
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
    children: ['loan-reviews', 'app-reviews', 'tax-software'],
  },
  {
    label: 'BUDGETING',
    href: '/budgeting',
    children: ['budgeting-basics', 'monthly-budget', 'saving-money', 'family-budget', 'student-budget', 'budgeting-apps', 'advanced-budgeting', 'budget-rules', 'emergency-fund'],
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
