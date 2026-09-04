import type { KeyTermItem } from "@/components/pages/InvestopediaKeyTerms";

/**
 * Topic-specific, unique financial key terms for each hub.
 * Matching the exact Investopedia interactive glossary architecture.
 */
export const TOPIC_KEY_TERMS: Record<string, KeyTermItem[]> = {
  // ── 1. BANKING & CREDIT ──
  banking: [
    {
      term: "Deposit",
      definition: "A deposit with a bank refers to money held by the financial institution in a customer account for safekeeping, typically earning interest depending on the account type.",
      href: "/savings",
    },
    {
      term: "Checking Account",
      definition: "A transactional account held at a financial institution that permits withdrawals, deposits, debit card transactions, and online bill payments on a daily basis.",
      href: "/checking",
    },
    {
      term: "Federal Deposit Insurance Corporation (FDIC)",
      definition: "An independent federal agency insuring bank deposits up to $250,000 per depositor, per insured institution to protect consumers in the event of a bank failure.",
      href: "/banking",
    },
    {
      term: "Bank Statement",
      definition: "An official monthly document sent from a financial institution detailing transactions, deposits, withdrawals, and account balances.",
      href: "/banking",
    },
    {
      term: "Underbanked",
      definition: "Individuals who have a basic bank account but frequently rely on alternative financial services like check cashers, money orders, and payday lenders.",
      href: "/banking",
    },
  ],

  savings: [
    {
      term: "High-Yield Savings Account (HYSA)",
      definition: "A deposit account—typically offered by online banks with low overhead—that pays an interest rate substantially higher than the national traditional bank average.",
      href: "/savings",
    },
    {
      term: "Annual Percentage Yield (APY)",
      definition: "The real annualized rate of return earned on a deposit balance, accounting for the exponential effects of compound interest over a 12-month period.",
      href: "/savings",
    },
    {
      term: "Compound Interest",
      definition: "Interest calculated on both the initial principal deposit and all accumulated interest from previous compounding cycles (e.g. daily or monthly).",
      href: "/financial-tools/compound-interest",
    },
    {
      term: "Emergency Fund",
      definition: "A dedicated cash reserve of 3 to 6 months of essential living expenses kept in liquid, FDIC-insured accounts to cushion against unexpected life shocks.",
      href: "/emergency-fund",
    },
    {
      term: "Regulation D",
      definition: "A federal banking rule that previously restricted certain savings withdrawals to six per month; while suspended, some banks still maintain monthly transaction limits.",
      href: "/savings",
    },
  ],

  checking: [
    {
      term: "Overdraft Protection",
      definition: "A service provided by banks that covers transactions when account balances fall below zero, either via a linked savings account or an overdraft line of credit.",
      href: "/checking",
    },
    {
      term: "Automated Clearing House (ACH)",
      definition: "An electronic network used by U.S. financial institutions to process batches of debit and credit transactions, such as direct deposits and bill payments.",
      href: "/checking",
    },
    {
      term: "Debit Card",
      definition: "A payment card that deducts money directly from a consumer's checking account to pay for purchases, requiring no credit check but offering limited rewards.",
      href: "/checking",
    },
    {
      term: "Direct Deposit",
      definition: "The electronic transfer of a payment (such as wages, dividends, or government benefits) directly from the payer's bank into the payee's checking account.",
      href: "/checking",
    },
    {
      term: "Routing Transit Number (ABA)",
      definition: "A unique nine-digit numerical code used in the United States to identify the specific financial institution where an account is held during electronic transfers.",
      href: "/checking",
    },
  ],

  "credit-cards": [
    {
      term: "Annual Percentage Rate (APR)",
      definition: "The annualized cost of borrowing money expressed as a percentage rate, including standard interest and unavoidable fees charged on carried balances.",
      href: "/credit-cards",
    },
    {
      term: "Credit Utilization Ratio",
      definition: "The percentage of your total revolving credit limit that you are currently using, heavily influencing credit scores (recommended to stay below 30%).",
      href: "/credit",
    },
    {
      term: "Grace Period",
      definition: "The window of time between the end of a credit card billing cycle and the payment due date during which no interest is charged on new purchases if paid in full.",
      href: "/credit-cards",
    },
    {
      term: "Balance Transfer",
      definition: "The process of moving existing debt from one high-interest credit card to another card, often offering an introductory 0% APR promotional rate.",
      href: "/credit-cards",
    },
    {
      term: "Cash Back & Rewards",
      definition: "An incentive program where card issuers return a percentage of spending in cash, points, or miles on qualifying purchases.",
      href: "/credit-cards",
    },
  ],

  "cd-rates": [
    {
      term: "Certificate of Deposit (CD)",
      definition: "A time-deposit account that offers a guaranteed fixed interest rate in exchange for locking up funds for a predetermined duration (e.g. 6 months to 5 years).",
      href: "/cd-rates",
    },
    {
      term: "Early Withdrawal Penalty",
      definition: "A fee charged by a bank (often equivalent to several months of interest) if a customer withdraws funds from a CD before its scheduled maturity date.",
      href: "/cd-rates",
    },
    {
      term: "CD Ladder",
      definition: "A strategy of dividing a sum of money into multiple CDs with staggered maturity dates to maintain regular liquidity while capturing higher long-term yields.",
      href: "/cd-rates",
    },
    {
      term: "Maturity Date",
      definition: "The designated date when a certificate of deposit term concludes and the principal deposit plus all earned interest become accessible without penalty.",
      href: "/cd-rates",
    },
    {
      term: "Brokered CD",
      definition: "A certificate of deposit issued by a bank and purchased through a brokerage firm, offering easy secondary market trading before maturity.",
      href: "/cd-rates",
    },
  ],

  "money-market": [
    {
      term: "Money Market Deposit Account (MMDA)",
      definition: "An interest-bearing, FDIC-insured bank account that typically pays higher interest than regular savings and offers check-writing or debit card capabilities.",
      href: "/money-market",
    },
    {
      term: "Tiered Interest Rate",
      definition: "A pricing structure where accounts with higher account balance brackets earn progressively higher interest rates.",
      href: "/money-market",
    },
    {
      term: "Money Market Fund (MMF)",
      definition: "A low-risk mutual fund investing in short-term debt securities (like Treasury bills); distinct from MMDAs because MMFs are investment products and not FDIC-insured.",
      href: "/money-market",
    },
    {
      term: "Liquidity",
      definition: "The ease and speed with which an asset or account balance can be converted into ready cash without losing its market value.",
      href: "/money-market",
    },
  ],

  loans: [
    {
      term: "Principal",
      definition: "The original sum of money borrowed in a loan, separate from the interest and financing charges accrued over time.",
      href: "/loans",
    },
    {
      term: "Origination Fee",
      definition: "An upfront processing fee charged by a lender to process, underwrite, and close a new personal loan application (usually 1% to 8% of the loan amount).",
      href: "/loans",
    },
    {
      term: "Amortization",
      definition: "The process of spreading out a loan into a series of equal, periodic payments over time, where early payments cover interest and later ones pay down principal.",
      href: "/financial-tools/loan",
    },
    {
      term: "Unsecured Loan",
      definition: "A loan issued and supported solely by the borrower's creditworthiness rather than by any type of collateral (such as a vehicle or home).",
      href: "/loans",
    },
    {
      term: "Debt-to-Income (DTI) Ratio",
      definition: "The percentage of your gross monthly income that goes toward paying your recurring monthly debt obligations, used by lenders to evaluate risk.",
      href: "/loans",
    },
  ],

  mortgages: [
    {
      term: "Fixed-Rate Mortgage",
      definition: "A home loan where the interest rate and monthly principal-and-interest payment remain identical throughout the entire lifespan of the loan (e.g. 15 or 30 years).",
      href: "/mortgages",
    },
    {
      term: "Adjustable-Rate Mortgage (ARM)",
      definition: "A mortgage loan with an interest rate that remains fixed for an initial period and then resets periodically based on benchmark market interest indices.",
      href: "/mortgages",
    },
    {
      term: "Private Mortgage Insurance (PMI)",
      definition: "Insurance required by conventional lenders when a homebuyer puts down less than 20% of the purchase price, protecting the lender against default.",
      href: "/mortgages",
    },
    {
      term: "Escrow Account",
      definition: "A neutral holding account managed by a mortgage servicer to accumulate funds for annual property taxes and homeowners insurance premiums.",
      href: "/mortgages",
    },
    {
      term: "Closing Costs",
      definition: "The processing fees paid at the final closing of a real estate transaction (usually 2% to 5% of the loan amount), covering appraisal, title, and lender charges.",
      href: "/mortgages",
    },
  ],

  "auto-loans": [
    {
      term: "Loan-to-Value (LTV) Ratio",
      definition: "The ratio of the amount borrowed compared to the actual appraised cash value of the vehicle, determining lender risk and interest rates.",
      href: "/auto-loans",
    },
    {
      term: "GAP Insurance",
      definition: "Guaranteed Asset Protection insurance that covers the difference between what your vehicle is worth and how much you owe on the auto loan if totaled.",
      href: "/auto-loans",
    },
    {
      term: "Pre-Approval",
      definition: "A conditional commitment from a bank or credit union stating the maximum loan amount, interest rate, and terms you qualify for before visiting a dealership.",
      href: "/auto-loans",
    },
    {
      term: "Dealer Financing",
      definition: "An auto loan arranged directly through the dealership, often processed through captive finance companies or third-party partner lending networks.",
      href: "/auto-loans",
    },
    {
      term: "Negative Equity (Underwater)",
      definition: "When you owe more money on your car loan than the actual market trade-in value of the vehicle.",
      href: "/auto-loans",
    },
  ],

  "student-loans": [
    {
      term: "Federal vs. Private Student Loans",
      definition: "Federal student loans are funded by the government with fixed rates and income-driven protections, while private loans are issued by banks and rely on credit scores.",
      href: "/student-loans",
    },
    {
      term: "Income-Driven Repayment (IDR)",
      definition: "Federal repayment plans (like SAVE or PAYE) that calculate your monthly student loan payment based on your discretionary income and family size.",
      href: "/student-loans",
    },
    {
      term: "FAFSA",
      definition: "The Free Application for Federal Student Aid: the official government form required to qualify for federal grants, work-study, and federal student loans.",
      href: "/student-loans",
    },
    {
      term: "Capitalized Interest",
      definition: "Unpaid accrued interest that gets added directly to the principal loan balance, causing future interest to be calculated on a larger total amount.",
      href: "/student-loans",
    },
    {
      term: "Public Service Loan Forgiveness (PSLF)",
      definition: "A federal program forgiving the remaining balance on Direct Loans after 120 qualifying monthly payments while working full-time for a qualifying public employer.",
      href: "/student-loans",
    },
  ],

  credit: [
    {
      term: "FICO Score",
      definition: "A three-digit credit score ranging from 300 to 850 created by Fair Isaac Corporation that lenders use to assess a borrower's likelihood of repaying debt.",
      href: "/credit",
    },
    {
      term: "Credit Bureau",
      definition: "An agency (the primary three being Equifax, Experian, and TransUnion) that collects and researches individual credit reports and sells them to creditors.",
      href: "/credit",
    },
    {
      term: "Hard Inquiry",
      definition: "A credit check performed when you apply for credit that can temporarily lower your credit score by a few points for up to 12 months.",
      href: "/credit",
    },
    {
      term: "Payment History",
      definition: "A record demonstrating whether bills and credit obligations have been paid on time, representing the single largest factor (35%) in FICO scoring models.",
      href: "/credit",
    },
  ],

  debt: [
    {
      term: "Debt Avalanche Method",
      definition: "A debt payoff strategy where extra money is directed toward paying off the balance with the highest interest rate first, minimizing overall interest paid.",
      href: "/debt",
    },
    {
      term: "Debt Snowball Method",
      definition: "A debt payoff strategy where extra funds target the smallest balance first regardless of interest rate, building psychological momentum with quick wins.",
      href: "/debt",
    },
    {
      term: "Debt Consolidation",
      definition: "The act of taking out a single new loan or balance transfer card to pay off multiple smaller, high-interest debts into one predictable monthly payment.",
      href: "/debt",
    },
    {
      term: "Credit Counseling",
      definition: "A service provided by certified nonprofit organizations to help consumers create manageable budgets, negotiate lower rates, and set up Debt Management Plans.",
      href: "/debt",
    },
  ],

  // ── 2. INVESTING & MARKETS ──
  investing: [
    {
      term: "Asset Allocation",
      definition: "An investment strategy that aims to balance risk versus reward by dividing a portfolio among major asset categories such as equities, fixed income, and cash.",
      href: "/investing",
    },
    {
      term: "Dollar-Cost Averaging (DCA)",
      definition: "An investment strategy where a fixed dollar amount is invested on a regular schedule regardless of market prices, lowering the average cost per share over time.",
      href: "/investing",
    },
    {
      term: "Capital Gains",
      definition: "The profit realized from the sale of an investment or property when the sale price exceeds the original purchase cost basis.",
      href: "/investing",
    },
    {
      term: "Diversification",
      definition: "A risk management strategy that mixes a wide variety of investments within a portfolio to limit exposure to any single asset or sector.",
      href: "/investing",
    },
    {
      term: "Dividend",
      definition: "A distribution of a portion of a company's earnings paid out to shareholders on a quarterly or annual basis.",
      href: "/investing",
    },
  ],

  stocks: [
    {
      term: "Market Capitalization",
      definition: "The total dollar market value of a company's outstanding shares of stock, calculated by multiplying total shares by the current share price.",
      href: "/stocks",
    },
    {
      term: "Price-to-Earnings (P/E) Ratio",
      definition: "A fundamental valuation metric comparing a company's current share price to its per-share earnings over the past twelve months.",
      href: "/stocks",
    },
    {
      term: "Bull vs. Bear Market",
      definition: "A bull market refers to a period of rising asset prices (+20% or more), while a bear market is marked by prolonged declines (-20% from recent highs).",
      href: "/stocks",
    },
    {
      term: "Earnings Per Share (EPS)",
      definition: "A key indicator of corporate profitability calculated by dividing net profit by total common shares outstanding.",
      href: "/stocks",
    },
    {
      term: "Stock Split",
      definition: "A corporate action in which a company increases the number of its shares to boost liquidity without changing its total market valuation.",
      href: "/stocks",
    },
  ],

  etfs: [
    {
      term: "Exchange-Traded Fund (ETF)",
      definition: "A pooled investment security that holds a basket of stocks, bonds, or commodities and trades on major stock exchanges throughout the trading day like an individual stock.",
      href: "/etfs",
    },
    {
      term: "Expense Ratio",
      definition: "The annual fee charged by mutual funds and ETFs to cover operating management costs, expressed as a percentage of total invested assets.",
      href: "/etfs",
    },
    {
      term: "Index Tracking",
      definition: "A passive investment strategy where an ETF mirrors the performance and composition of a specific benchmark index (e.g. S&P 500 or Nasdaq-100).",
      href: "/etfs",
    },
    {
      term: "Net Asset Value (NAV)",
      definition: "The per-share value of an ETF's or mutual fund's total assets minus its liabilities, calculated at the close of every trading day.",
      href: "/etfs",
    },
  ],

  "mutual-funds": [
    {
      term: "Mutual Fund",
      definition: "An investment vehicle made up of a pool of money collected from many investors to invest in securities like stocks, bonds, and short-term debt, priced once daily after market close.",
      href: "/mutual-funds",
    },
    {
      term: "Active vs. Passive Management",
      definition: "Active funds employ portfolio managers aiming to beat benchmark index returns, while passive funds replicate an index with lower operating fees.",
      href: "/mutual-funds",
    },
    {
      term: "Load vs. No-Load Fund",
      definition: "A load fund charges an upfront or deferred sales commission when buying or selling shares, whereas a no-load fund carries no transaction sales commission.",
      href: "/mutual-funds",
    },
  ],

  bonds: [
    {
      term: "Yield to Maturity (YTM)",
      definition: "The total expected annualized return on a bond if held until its scheduled maturity date, factoring in coupon payments and price discount/premium.",
      href: "/bonds",
    },
    {
      term: "Coupon Rate",
      definition: "The annual nominal interest rate paid by the bond issuer on the bond's face (par) value, typically disbursed semiannually.",
      href: "/bonds",
    },
    {
      term: "Credit Rating",
      definition: "An evaluation of the credit risk of a prospective debtor (such as corporate or municipal bond issuers) published by agencies like Moody's or S&P.",
      href: "/bonds",
    },
    {
      term: "Treasury Securities",
      definition: "Government debt obligations backed by the full faith and credit of the U.S. government, including Treasury Bills (T-Bills), Notes, and Bonds.",
      href: "/bonds",
    },
  ],

  crypto: [
    {
      term: "Blockchain",
      definition: "A decentralized, distributed digital ledger technology that records transactions across thousands of computers securely without a central intermediary.",
      href: "/crypto",
    },
    {
      term: "Bitcoin (BTC)",
      definition: "The original decentralized digital cryptocurrency created in 2009 by the pseudonymous Satoshi Nakamoto, operating with a hard cap of 21 million coins.",
      href: "/crypto",
    },
    {
      term: "Proof of Stake (PoS)",
      definition: "A consensus mechanism where blockchain network participants stake crypto assets to validate transactions and secure the network, consuming minimal energy.",
      href: "/crypto",
    },
    {
      term: "Smart Contract",
      definition: "Self-executing digital contracts with the terms of the agreement directly written into lines of code on a blockchain network like Ethereum.",
      href: "/crypto",
    },
  ],

  options: [
    {
      term: "Call Option",
      definition: "A financial contract giving the buyer the right, but not the obligation, to buy an underlying asset at a specified strike price within a specific timeframe.",
      href: "/options",
    },
    {
      term: "Put Option",
      definition: "A financial contract giving the buyer the right, but not the obligation, to sell an underlying asset at a specified strike price within a specific timeframe.",
      href: "/options",
    },
    {
      term: "Strike Price",
      definition: "The set fixed price at which an option contract owner can buy (call) or sell (put) the underlying stock.",
      href: "/options",
    },
    {
      term: "Implied Volatility (IV)",
      definition: "The market's forecast of a likely movement in a security's price, serving as a key component in calculating options option premiums.",
      href: "/options",
    },
  ],

  commodities: [
    {
      term: "Commodity Futures",
      definition: "Standardized exchange-traded contracts to buy or sell a specific quantity of a physical commodity (crude oil, gold, wheat) at a predetermined price on a future date.",
      href: "/commodities",
    },
    {
      term: "Spot Price",
      definition: "The current immediate market price at which a given physical asset (like spot gold or silver) can be bought or sold for instant delivery.",
      href: "/commodities",
    },
    {
      term: "Hard vs. Soft Commodities",
      definition: "Hard commodities are mined or extracted natural resources (energy, precious metals), while soft commodities are agricultural products or livestock.",
      href: "/commodities",
    },
  ],

  "real-estate": [
    {
      term: "Real Estate Investment Trust (REIT)",
      definition: "A company that owns, operates, or finances income-generating real estate properties, legally required to distribute at least 90% of taxable income to shareholders.",
      href: "/real-estate",
    },
    {
      term: "Cap Rate (Capitalization Rate)",
      definition: "A real estate valuation metric calculated by dividing a property's Net Operating Income (NOI) by its current asset value to evaluate return on investment.",
      href: "/real-estate",
    },
    {
      term: "Home Equity",
      definition: "The current market appraisal value of a property minus the total balance of all outstanding mortgage liens and home equity lines of credit.",
      href: "/real-estate",
    },
  ],

  "market-news": [
    {
      term: "Market Sentiment",
      definition: "The overall prevailing attitude and psychological consensus of investors toward a particular financial security or broader market indices.",
      href: "/market-news",
    },
    {
      term: "Earnings Season",
      definition: "The period several weeks following the end of each fiscal quarter when publicly traded corporations release their quarterly earnings reports.",
      href: "/market-news",
    },
    {
      term: "Volatility Index (VIX)",
      definition: "A real-time market index representing the market's expectations for 30-day forward volatility calculated from S&P 500 index options (the 'fear gauge').",
      href: "/market-news",
    },
  ],

  // ── 3. PERSONAL FINANCE & BUDGETING ──
  "personal-finance": [
    {
      term: "Net Worth",
      definition: "The quantitative measure of total financial health, calculated as all owned assets (cash, property, investments) minus all liabilities (debts, mortgages).",
      href: "/personal-finance",
    },
    {
      term: "Budget",
      definition: "A comprehensive spending plan based on income and expenses that guides saving, investing, and debt management over specific calendar cycles.",
      href: "/budgeting",
    },
    {
      term: "Compound Interest",
      definition: "Interest earned on both principal capital and accrued interest, creating exponential growth over long multi-decade horizons.",
      href: "/personal-finance",
    },
    {
      term: "Emergency Fund",
      definition: "A dedicated liquid reserve of 3 to 6 months of essential living expenses parked in an FDIC-insured account for unexpected shocks.",
      href: "/emergency-fund",
    },
  ],

  budgeting: [
    {
      term: "50/30/20 Budgeting Rule",
      definition: "A personal finance framework allocating 50% of after-tax income to Needs, 30% to Wants, and 20% to Savings and Debt Repayment.",
      href: "/budget-rules",
    },
    {
      term: "Zero-Based Budgeting",
      definition: "A budgeting method where every single dollar of monthly income is assigned a specific job (expenses, savings, debt) until remaining unallocated income equals zero.",
      href: "/budgeting-basics",
    },
    {
      term: "Envelope System",
      definition: "A cash budgeting technique where designated amounts of cash are placed in physical envelopes labeled for specific spending categories each pay period.",
      href: "/budgeting",
    },
    {
      term: "Fixed vs. Variable Expenses",
      definition: "Fixed expenses stay the same each month (like rent or mortgage), while variable expenses fluctuate based on consumption and lifestyle choices (like groceries or dining).",
      href: "/monthly-budget",
    },
    {
      term: "Sinking Fund",
      definition: "A strategic savings category dedicated to gradually accumulating money for known, periodic upcoming expenses like car insurance, holidays, or home repairs.",
      href: "/budgeting",
    },
  ],

  "budgeting-basics": [
    {
      term: "Discretionary Spending",
      definition: "Non-essential expenses that a consumer chooses to make after covering core living essentials (such as luxury goods, dining out, and entertainment).",
      href: "/budgeting-basics",
    },
    {
      term: "Gross vs. Net Income",
      definition: "Gross income is total earnings before taxes and deductions; net income is take-home pay available for budgeting after payroll deductions.",
      href: "/budgeting-basics",
    },
    {
      term: "Cash Flow",
      definition: "The net balance of cash moving into and out of your household accounts over a specific month or year.",
      href: "/budgeting-basics",
    },
  ],

  "budget-rules": [
    {
      term: "50/30/20 Rule",
      definition: "Allocating 50% of net income to Needs (housing, utilities), 30% to Wants (dining, hobbies), and 20% to Savings/Debt payoff.",
      href: "/budget-rules",
    },
    {
      term: "70/20/10 Rule",
      definition: "A variation allocating 70% to living expenses, 20% to savings and investments, and 10% to debt payoff or charitable giving.",
      href: "/budget-rules",
    },
    {
      term: "Pay Yourself First (Reverse Budgeting)",
      definition: "Automatically transferring money to savings and investments the moment you get paid, before spending on any living expenses.",
      href: "/budget-rules",
    },
  ],

  "monthly-budget": [
    {
      term: "Recurring Subscriptions",
      definition: "Monthly auto-renewing expenses (streaming, software, memberships) that can silently erode monthly savings if left unmonitored.",
      href: "/monthly-budget",
    },
    {
      term: "Budget Variance",
      definition: "The mathematical difference between what you projected to spend in a given month and what you actually spent.",
      href: "/monthly-budget",
    },
  ],

  "emergency-fund": [
    {
      term: "Liquidity Buffer",
      definition: "Cash and cash equivalents kept in immediately accessible, risk-free accounts to handle unexpected life emergencies without selling investments or taking on debt.",
      href: "/emergency-fund",
    },
    {
      term: "Core Living Expenses",
      definition: "The baseline monthly dollar amount required to sustain non-negotiable necessities (housing, utilities, basic groceries, minimum debt payments) during an emergency.",
      href: "/emergency-fund",
    },
    {
      term: "Tiered Emergency Reserves",
      definition: "Holding 1 month of cash in checking, 2 to 5 months in a High-Yield Savings Account, and secondary reserves in short-term Treasury bills.",
      href: "/emergency-fund",
    },
  ],

  "financial-independence": [
    {
      term: "FIRE Movement",
      definition: "Financial Independence, Retire Early: a lifestyle movement focused on extreme savings and aggressive investing to retire decades earlier than traditional ages.",
      href: "/financial-independence",
    },
    {
      term: "4% Safe Withdrawal Rate",
      definition: "The empirical rule of thumb (Trinity Study) estimating the percentage a retiree can safely withdraw from an investment portfolio annually without running out of money.",
      href: "/financial-independence",
    },
    {
      term: "Savings Rate",
      definition: "The percentage of take-home income saved and invested each month, serving as the single most critical variable determining how fast you reach financial freedom.",
      href: "/financial-independence",
    },
    {
      term: "Coast FIRE",
      definition: "The milestone where you have invested enough money early in life that compounding alone will fund a comfortable traditional retirement without further contributions.",
      href: "/financial-independence",
    },
  ],

  "money-management": [
    {
      term: "Net Worth",
      definition: "The total value of everything you own (assets: cash, real estate, investments) minus everything you owe (liabilities: debts, loans, credit cards).",
      href: "/money-management",
    },
    {
      term: "Opportunity Cost",
      definition: "The potential financial gain or value forgone when choosing one alternative over another (such as spending cash today versus investing it for 20 years).",
      href: "/money-management",
    },
    {
      term: "Automated Finances",
      definition: "Setting up recurring automated transfers for direct deposits, bills, emergency savings, and retirement investing to eliminate manual friction and late fees.",
      href: "/money-management",
    },
  ],

  retirement: [
    {
      term: "401(k) / Employer Match",
      definition: "An employer-sponsored tax-advantaged retirement account allowing pre-tax salary deferrals, often accompanied by dollar-for-dollar employer matching funds.",
      href: "/retirement",
    },
    {
      term: "Traditional vs. Roth IRA",
      definition: "A Traditional IRA provides tax-deductible contributions today with taxable retirement withdrawals; a Roth IRA uses after-tax contributions to generate 100% tax-free growth and withdrawals.",
      href: "/retirement",
    },
    {
      term: "Required Minimum Distributions (RMDs)",
      definition: "The minimum amount that federal law requires retirees to withdraw annually from traditional retirement accounts starting at age 73 or 75.",
      href: "/retirement",
    },
  ],

  "saving-money": [
    {
      term: "Pay Yourself First",
      definition: "A reverse budgeting philosophy where savings and investment contributions are automatically routed into savings accounts before any discretionary spending occurs.",
      href: "/saving-money",
    },
    {
      term: "High-Yield Cash Accounts",
      definition: "Accounts earning competitive yields well above traditional bank averages, ensuring purchasing power isn't completely eroded by inflation.",
      href: "/savings",
    },
    {
      term: "Lifestyle Creep",
      definition: "The tendency for discretionary spending to expand in tandem with income increases, preventing higher earnings from translating into greater wealth accumulation.",
      href: "/saving-money",
    },
  ],

  planning: [
    {
      term: "Asset Allocation",
      definition: "An investment strategy that aims to balance risk versus reward by adjusting the percentage of each asset (stocks, bonds, cash, real estate) in an investment portfolio.",
      href: "/planning",
    },
    {
      term: "Estate Planning",
      definition: "The preparation of tasks and legal documents (wills, trusts, powers of attorney) that manage an individual's asset base in the event of incapacitation or death.",
      href: "/planning",
    },
    {
      term: "Tax-Advantaged Accounts",
      definition: "Special financial accounts (such as 401(k)s, IRAs, and HSAs) designed to offer tax deferral or tax-free growth to incentivize long-term savings.",
      href: "/planning",
    },
  ],

  "family-budget": [
    {
      term: "529 College Savings Plan",
      definition: "A state-sponsored tax-advantaged investment plan designed to encourage saving for future higher education costs, offering tax-free growth and distributions for qualified expenses.",
      href: "/family-budget",
    },
    {
      term: "Term Life Insurance",
      definition: "A life insurance policy providing coverage for a set period (e.g. 20 or 30 years) to protect dependents against loss of household income in the event of premature death.",
      href: "/family-budget",
    },
  ],

  // ── 4. ECONOMY & POLICY ──
  economy: [
    {
      term: "Gross Domestic Product (GDP)",
      definition: "The total monetary market value of all finished goods and services produced within a country during a specific timeframe, measuring economic health.",
      href: "/gdp",
    },
    {
      term: "Consumer Price Index (CPI)",
      definition: "A principal economic metric published by the BLS measuring the average monthly change in prices paid by urban consumers for a market basket of goods and services.",
      href: "/inflation",
    },
    {
      term: "Fiscal vs. Monetary Policy",
      definition: "Fiscal policy is managed by Congress and the Treasury through taxation and government spending; monetary policy is conducted by the Federal Reserve via interest rates and money supply.",
      href: "/economy",
    },
    {
      term: "Recession",
      definition: "A significant, widespread, and prolonged downturn in economic activity, historically defined as two consecutive quarters of negative real GDP growth.",
      href: "/economy",
    },
  ],

  inflation: [
    {
      term: "Purchasing Power",
      definition: "The financial value of a currency expressed in terms of the number of goods or services that one unit of money can buy, which decreases as inflation rises.",
      href: "/inflation",
    },
    {
      term: "Core CPI vs. Headline CPI",
      definition: "Headline CPI measures all consumer goods, while Core CPI strips out volatile food and energy prices to provide a cleaner read on underlying inflationary trends.",
      href: "/inflation",
    },
    {
      term: "Personal Consumption Expenditures (PCE)",
      definition: "The Federal Reserve's preferred measure of consumer inflation, capturing shifts in consumer spending habits and broader medical coverage costs.",
      href: "/inflation",
    },
  ],

  "interest-rates": [
    {
      term: "Federal Funds Rate",
      definition: "The target interest rate set by the Federal Open Market Committee (FOMC) at which commercial banks borrow and lend overnight reserves to one another.",
      href: "/interest-rates",
    },
    {
      term: "Prime Rate",
      definition: "The benchmark interest rate that commercial banks charge their most creditworthy corporate customers, directly influencing credit card APRs and HELOCs.",
      href: "/interest-rates",
    },
    {
      term: "Yield Curve Inversion",
      definition: "A market condition where short-term debt instruments pay higher yields than long-term bonds, historically serving as a reliable leading indicator of recessions.",
      href: "/interest-rates",
    },
  ],

  gdp: [
    {
      term: "Real GDP vs. Nominal GDP",
      definition: "Nominal GDP measures economic output using current market prices, while Real GDP adjusts for inflation to reflect true volume growth.",
      href: "/gdp",
    },
    {
      term: "Per Capita GDP",
      definition: "A nation's total economic output divided by its total population, serving as a useful gauge for standard of living across different countries.",
      href: "/gdp",
    },
  ],

  unemployment: [
    {
      term: "U-3 Unemployment Rate",
      definition: "The official headline national unemployment rate, defined as jobless individuals who are actively seeking work as a percentage of the civilian labor force.",
      href: "/unemployment",
    },
    {
      term: "Non-Farm Payrolls (NFP)",
      definition: "A closely-watched monthly report released by the Bureau of Labor Statistics representing the total number of paid U.S. workers excluding farm and non-profit employees.",
      href: "/unemployment",
    },
    {
      term: "Labor Force Participation Rate",
      definition: "The percentage of the civilian working-age population (16+) that is either currently employed or actively looking for work.",
      href: "/unemployment",
    },
  ],

  fed: [
    {
      term: "Federal Open Market Committee (FOMC)",
      definition: "The monetary policymaking body of the Federal Reserve System responsible for setting interest rate targets and conducting open market operations.",
      href: "/fed",
    },
    {
      term: "Quantitative Easing (QE) / Tightening (QT)",
      definition: "QE is the central bank purchase of longer-term securities to inject liquidity; QT is the reduction of balance sheet assets to withdraw excess liquidity.",
      href: "/fed",
    },
    {
      term: "Dual Mandate",
      definition: "The statutory congressional objective assigned to the Federal Reserve: achieving maximum sustainable employment while maintaining price stability (target 2% inflation).",
      href: "/fed",
    },
  ],

  "monetary-policy": [
    {
      term: "Hawkish vs. Dovish",
      definition: "Hawkish policy favors raising interest rates to fight inflation; dovish policy favors lowering interest rates to stimulate job growth and economic activity.",
      href: "/monetary-policy",
    },
    {
      term: "Open Market Operations",
      definition: "The buying and selling of government securities in the open market by a central bank to expand or contract the amount of money in the banking system.",
      href: "/monetary-policy",
    },
  ],

  indicators: [
    {
      term: "Leading vs. Lagging Indicators",
      definition: "Leading indicators (stock market, building permits, yield curve) anticipate future economic direction; lagging indicators (unemployment, CPI) confirm established trends.",
      href: "/indicators",
    },
    {
      term: "Purchasing Managers' Index (PMI)",
      definition: "An economic indicator derived from monthly surveys of private-sector manufacturing and service supply managers, where numbers above 50 signal expansion.",
      href: "/indicators",
    },
  ],

  "fraud-protection": [
    {
      term: "Pig Butchering",
      definition: "A long-con scam that combines a fabricated romantic or friendly relationship with a fake investment platform, gradually escalating deposits over weeks or months before the scammer disappears with the funds.",
      href: "/fraud-protection/pig-butchering-scam-explained",
    },
    {
      term: "Business Email Compromise (BEC)",
      definition: "A scam in which a criminal gains access to, or convincingly spoofs, a real business email account to redirect a legitimate payment or invoice to a fraudulent account.",
      href: "/fraud-protection/fake-bank-documents-canva-scams",
    },
    {
      term: "SIM Swap",
      definition: "A fraud technique where a criminal convinces or bribes a mobile carrier employee to transfer a victim's phone number onto a SIM card the criminal controls, intercepting SMS-based verification codes.",
      href: "/fraud-protection/sim-swap-fraud-explained",
    },
    {
      term: "Data Broker",
      definition: "A company that collects personal information — often from browser cookies, tracking pixels, and app permissions — and sells or licenses it to advertisers, lead generators, or other third parties.",
      href: "/fraud-protection/tracking-cookies-scam-targeting",
    },
  ],
};

/** Retrieves curated key terms for a slug, falling back to general banking terms if not defined. */
export function getKeyTermsForTopic(slug: string): KeyTermItem[] {
  return TOPIC_KEY_TERMS[slug] || TOPIC_KEY_TERMS.banking;
}
