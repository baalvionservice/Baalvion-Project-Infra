import { ArticleStatus } from "@/modules/content-engine/types";

export type NewsCategory =
  | "Markets"
  | "Economy"
  | "Stocks"
  | "Crypto"
  | "PersonalFinance"
  | "RealEstate"
  | "ETFs"
  | "Editorial"
  | "Guides"
  | "Bonds";

export interface NewsAuthor {
  name: string;
  title?: string;
  avatarUrl?: string;
}
export interface RelatedLink {
  label: string;
  href: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  author: NewsAuthor;
  related?: RelatedLink[];
  status?: ArticleStatus;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  imageUrl: string;
  imageCaption?: string;
  slug: string;
  featured?: boolean;
  keyTakeaways?: string[];
  body: NewsBodyBlock[];
  tags?: string[];
}

// ── Body block types ──────────────────────────────────────────────────────────

export type NewsBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "callout"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; url: string; caption?: string };

// ── Data ──────────────────────────────────────────────────────────────────────

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    title:
      "Federal Reserve Holds Rates Steady as Inflation Shows Signs of Cooling",
    excerpt:
      "The Federal Open Market Committee voted unanimously to keep the federal funds rate in the 5.25%–5.50% range, citing progress on inflation but warning that further data is needed before cuts.",
    category: "Economy",
    author: { name: "Rachel Kim", title: "Senior Economics Correspondent" },
    publishedAt: "2026-03-15T14:30:00Z",
    updatedAt: "2026-03-15T18:00:00Z",
    readTimeMinutes: 5,
    related: [
      {
        label: "All the Ways the Iran War Is Draining Your Wallet",
        href: "#",
      },
      {
        label:
          "Forget About A Fed Rate Cut—A Hike Seems More Likely By The Day",
        href: "#",
      },
      {
        label:
          "Personal Loans Surge As Consumers Struggle To Keep Up With Inflation",
        href: "#",
      },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
    imageCaption: "The Federal Reserve building in Washington, D.C.",
    slug: "fed-holds-rates-inflation-cooling",
    featured: true,
    tags: ["Federal Reserve", "Interest Rates", "Inflation", "FOMC"],
    keyTakeaways: [
      "The FOMC voted unanimously to hold rates at 5.25%–5.50% for the fourth consecutive meeting.",
      "Fed Chair Powell said inflation is 'moving in the right direction' but isn't yet at the 2% target.",
      "Markets now price in two rate cuts before year-end, down from three a month ago.",
      "The next meeting is scheduled for late April, with another data-dependent pause expected.",
    ],
    body: [
      {
        type: "paragraph",
        text: "The Federal Reserve kept its benchmark interest rate unchanged on Wednesday, maintaining its cautious stance as policymakers wait for more evidence that inflation is durably returning to the central bank's 2% target.",
      },
      {
        type: "paragraph",
        text: "The Federal Open Market Committee voted 12-0 to hold the federal funds rate in the 5.25% to 5.50% target range — the fourth consecutive meeting at which officials have chosen to stand pat after one of the most aggressive tightening cycles in the Fed's history.",
      },
      { type: "heading", text: "Powell: 'We Are Not There Yet'" },
      {
        type: "paragraph",
        text: "In a press conference following the decision, Fed Chair Jerome Powell struck a measured tone, acknowledging that inflation has fallen significantly from its peak while emphasizing that the job is not yet complete.",
      },
      {
        type: "quote",
        text: "Inflation has eased substantially from its peak. We want to be more confident that inflation is moving sustainably toward 2% before we begin to dial back our restrictive policy.",
        attribution: "Jerome Powell, Federal Reserve Chair",
      },
      {
        type: "paragraph",
        text: "The latest consumer price index showed inflation running at 2.8% annually in February, down sharply from the 9.1% peak recorded in June 2022, but still above the Fed's target. Core inflation, which strips out volatile food and energy prices, remained stickier at 3.2%.",
      },
      { type: "heading", text: "Market Reaction" },
      {
        type: "paragraph",
        text: "Equity markets rallied modestly after the announcement, with the S&P 500 gaining 0.4% and the Nasdaq Composite rising 0.6%. Treasury yields edged lower, with the 10-year note falling to 4.18% from 4.24% before the decision.",
      },
      {
        type: "callout",
        text: "The Fed's so-called 'dot plot' still shows a median expectation of two rate cuts in 2026, though several officials penciled in just one.",
      },
      { type: "heading", text: "What This Means for Consumers" },
      {
        type: "paragraph",
        text: "For everyday Americans, the Fed's decision to hold rates means borrowing costs will remain elevated for now. Credit card rates are still hovering near record highs above 20%, and the average 30-year fixed mortgage rate remains above 7%.",
      },
      {
        type: "list",
        items: [
          "Credit card APRs remain near record highs (~20.5% on average).",
          "30-year fixed mortgage rates are still above 7%.",
          "Auto loan rates for new vehicles average 7.1% for 60-month loans.",
          "High-yield savings accounts and CDs continue to offer attractive returns above 4.5%.",
        ],
      },
      {
        type: "paragraph",
        text: "The next Fed meeting is scheduled for April 29–30. Investors will be closely watching the March CPI report, due April 10, for clues on whether the path to rate cuts is opening up or closing further.",
      },
    ],
  },
  {
    id: "2",
    title: "S&P 500 Climbs to Fresh Record High on Strong Earnings Reports",
    excerpt:
      "The benchmark index surged 1.2% to close at an all-time high as a wave of better-than-expected corporate earnings boosted investor confidence across sectors.",
    category: "Economy",
    author: { name: "James Okafor", title: "Markets Reporter" },
    publishedAt: "2026-03-15T12:00:00Z",
    readTimeMinutes: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80",
    imageCaption:
      "Traders at the New York Stock Exchange react to earnings news.",
    slug: "sp500-record-high-earnings",
    tags: ["S&P 500", "Earnings", "Stock Market", "Equities"],
    keyTakeaways: [
      "The S&P 500 set a new intraday and closing record on Thursday.",
      "About 78% of S&P 500 companies that have reported have beaten EPS estimates.",
      "Technology and consumer discretionary were the top-performing sectors.",
      "Analysts now forecast full-year S&P 500 EPS growth of 12% for 2026.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Wall Street's benchmark index closed at a fresh all-time high on Thursday, powered by a string of better-than-expected quarterly earnings reports that lifted sentiment across nearly every sector of the market.",
      },
      {
        type: "paragraph",
        text: "The S&P 500 gained 1.2% to settle at 5,842, eclipsing its previous record close. The Dow Jones Industrial Average rose 0.9%, while the tech-heavy Nasdaq Composite outperformed with a 1.6% advance.",
      },
      { type: "heading", text: "Earnings Season Exceeds Expectations" },
      {
        type: "paragraph",
        text: "With about 70% of S&P 500 companies having reported first-quarter results, approximately 78% have beaten Wall Street's earnings-per-share estimates — well above the historical average of 67%, according to data from FactSet.",
      },
      {
        type: "callout",
        text: "Blended first-quarter earnings growth for the S&P 500 currently stands at 9.6% year-over-year, on pace for the strongest growth since Q4 2021.",
      },
      { type: "heading", text: "Sector Breakdown" },
      {
        type: "list",
        items: [
          "Technology: +2.1%, led by semiconductor and cloud software names.",
          "Consumer Discretionary: +1.8%, boosted by strong retail sales data.",
          "Financials: +1.4%, after several large banks reported solid net interest income.",
          "Energy: -0.3%, the only sector to close lower as oil prices slipped.",
        ],
      },
      {
        type: "paragraph",
        text: "Analysts have responded by revising their full-year earnings forecasts higher. The consensus estimate for S&P 500 EPS in 2026 has risen to $248, implying roughly 12% growth from last year.",
      },
      {
        type: "quote",
        text: "The breadth of this rally is what stands out. It's not just the Magnificent Seven dragging the index higher — mid-caps and cyclicals are participating, which is a healthy sign.",
        attribution:
          "Sarah Lennox, Chief Investment Strategist, Harmon Capital",
      },
      {
        type: "paragraph",
        text: "Despite the optimism, some strategists caution that the market is trading at elevated valuations. The S&P 500's forward P/E stands at around 21x, above its 10-year average of 17.8x, leaving limited margin for disappointment.",
      },
    ],
  },
  {
    id: "3",
    title: "Bitcoin Surges Past $95,000 Amid Renewed Institutional Demand",
    excerpt:
      "The world's largest cryptocurrency climbed more than 8% in 24 hours, driven by fresh inflows into spot Bitcoin ETFs and growing interest from hedge funds.",
    category: "Crypto",
    author: { name: "Priya Sharma", title: "Crypto & Digital Assets Editor" },
    publishedAt: "2026-03-15T10:15:00Z",
    readTimeMinutes: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&q=80",
    imageCaption: "A Bitcoin token alongside other cryptocurrencies.",
    slug: "bitcoin-surges-institutional-demand",
    tags: ["Bitcoin", "Crypto", "ETF", "Institutional Investing"],
    keyTakeaways: [
      "Bitcoin crossed $95,000 for the first time since January, gaining over 8% in 24 hours.",
      "Spot Bitcoin ETFs recorded their largest single-day inflow in three months.",
      "On-chain data shows long-term holders are accumulating, not selling.",
      "Ethereum and Solana also rallied sharply in sympathy.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Bitcoin surged past $95,000 for the first time in nearly two months on Saturday, as a combination of robust inflows into U.S.-listed spot Bitcoin ETFs and renewed buying from large institutional investors reignited bullish momentum.",
      },
      {
        type: "paragraph",
        text: "The world's largest cryptocurrency rose as much as 8.4% in the past 24 hours, touching an intraday high of $95,780. Other major digital assets also advanced, with Ethereum gaining 5.9% and Solana jumping 11.2%.",
      },
      { type: "heading", text: "ETF Inflows Fuel the Rally" },
      {
        type: "paragraph",
        text: "Spot Bitcoin ETFs recorded a combined net inflow of approximately $840 million on Friday, the largest single-day haul since early December, according to Bloomberg Intelligence.",
      },
      {
        type: "callout",
        text: "BlackRock's iShares Bitcoin Trust (IBIT) alone took in more than $500 million on Friday, pushing its total AUM above $28 billion.",
      },
      { type: "heading", text: "On-Chain Signals Are Bullish" },
      {
        type: "paragraph",
        text: "Data from blockchain analytics firms show that long-term holders — wallets that have held Bitcoin for more than 155 days — have been steadily accumulating rather than distributing, a pattern historically associated with the early stages of a bull run.",
      },
      {
        type: "quote",
        text: "The supply squeeze is real. Long-term holders are not selling into this rally, which means new demand is pushing prices up against a shrinking float.",
        attribution: "Carlos Mendes, Head of Research, Meridian Digital Assets",
      },
      {
        type: "paragraph",
        text: "Despite the positive momentum, analysts warn that Bitcoin remains a volatile asset and a pullback after a rapid run-up cannot be ruled out.",
      },
    ],
  },
  {
    id: "4",
    title: "Housing Market Cools as Mortgage Rates Tick Back Above 7%",
    excerpt:
      "Existing home sales fell 3.4% last month as rising mortgage rates squeezed affordability, with first-time buyers bearing the brunt of the slowdown.",
    category: "RealEstate",
    author: { name: "Marco Delgado", title: "Real Estate Correspondent" },
    publishedAt: "2026-03-14T16:45:00Z",
    readTimeMinutes: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
    imageCaption: "A suburban home listed for sale in the U.S.",
    slug: "housing-market-cools-mortgage-rates",
    tags: ["Housing Market", "Mortgage Rates", "Real Estate", "Fed"],
    keyTakeaways: [
      "Existing home sales dropped 3.4% month-over-month to a seasonally adjusted annual rate of 3.97 million units.",
      "The average 30-year fixed mortgage rate climbed back above 7% for the first time since November.",
      "Housing inventory rose 5.2% but remains well below pre-pandemic norms.",
      "Median home prices rose 4.1% year-over-year to $412,500.",
    ],
    body: [
      {
        type: "paragraph",
        text: "The U.S. housing market showed fresh signs of cooling in February as mortgage rates climbed back above 7%, pricing out many would-be buyers and dragging existing home sales to their lowest level in four months.",
      },
      {
        type: "paragraph",
        text: "The National Association of Realtors reported that existing home sales fell 3.4% from January to a seasonally adjusted annual rate of 3.97 million units — below the 4.1 million pace economists had expected.",
      },
      { type: "heading", text: "Rates Are the Culprit" },
      {
        type: "paragraph",
        text: "The average rate on a 30-year fixed mortgage climbed to 7.04% last week, according to Freddie Mac, reversing a modest decline seen at the start of the year when investors had hoped the Federal Reserve would begin cutting rates sooner.",
      },
      {
        type: "callout",
        text: "At today's rates, the monthly payment on a $400,000 mortgage is roughly $2,670 — about $800 more per month than three years ago when rates were near 4%.",
      },
      { type: "heading", text: "Inventory Ticks Up, but Not Enough" },
      {
        type: "paragraph",
        text: "The number of homes available for sale rose 5.2% from January to 1.08 million units, representing a 3.3-month supply — well below the 4-to-6 months typically considered a balanced market.",
      },
      {
        type: "list",
        items: [
          "Median existing home price: $412,500, up 4.1% year-over-year.",
          "First-time buyers accounted for 26% of sales, down from 28% a year ago.",
          "All-cash sales represented 33% of transactions, above the historical norm.",
          "Distressed sales remained low at 2% of total sales.",
        ],
      },
      {
        type: "quote",
        text: "Affordability conditions are still very challenging for first-time buyers. Until rates come down meaningfully or we see a significant surge in new listings, activity is going to remain subdued.",
        attribution:
          "Dr. Maria Santos, Chief Economist, National Housing Institute",
      },
    ],
  },
  {
    id: "5",
    title: "Tech Stocks Rally on AI Spending Boom — but Analysts Urge Caution",
    excerpt:
      "Shares of major AI infrastructure companies jumped after a string of upbeat outlooks, but some analysts warn valuations are stretched and a pullback could be overdue.",
    category: "Stocks",
    author: { name: "Lisa Tran", title: "Technology Stocks Reporter" },
    publishedAt: "2026-03-14T11:00:00Z",
    readTimeMinutes: 5,
    related: [
      {
        label: "All the Ways the Iran War Is Draining Your Wallet",
        href: "#",
      },
      {
        label:
          "Forget About A Fed Rate Cut—A Hike Seems More Likely By The Day",
        href: "#",
      },
      {
        label:
          "Personal Loans Surge As Consumers Struggle To Keep Up With Inflation",
        href: "#",
      },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1200&q=80",
    imageCaption: "A data center powering AI workloads.",
    slug: "tech-stocks-ai-spending-boom",
    tags: [
      "Tech Stocks",
      "Artificial Intelligence",
      "Semiconductors",
      "NVIDIA",
    ],
    keyTakeaways: [
      "Shares of major AI chipmakers and cloud providers surged 3–7% after upbeat capital expenditure guidance.",
      "Global AI infrastructure spending is forecast to exceed $300 billion in 2026.",
      "The Philadelphia Semiconductor Index hit a new 52-week high.",
      "Some strategists warn forward P/E ratios for AI plays are above 40x.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Technology stocks soared on Friday as the world's largest cloud computing companies signaled they would significantly increase their spending on artificial intelligence infrastructure this year, sending shares of chipmakers and data center operators to fresh highs.",
      },
      {
        type: "paragraph",
        text: "The Philadelphia Semiconductor Index jumped 3.8% to close at a new 52-week high. Cloud software names also rallied, with the BVP Nasdaq Emerging Cloud Index rising 2.9%.",
      },
      { type: "heading", text: "The AI Capex Supercycle" },
      {
        type: "paragraph",
        text: "During earnings calls this week, three of the five largest U.S. technology companies by market cap raised their full-year capital expenditure guidance, implying tens of billions of additional dollars flowing into AI servers, custom chips, and data center construction.",
      },
      {
        type: "callout",
        text: "Analysts at Goldman Sachs now estimate global AI infrastructure spending will top $300 billion in 2026 — a 20% upward revision from their estimate just six weeks ago.",
      },
      { type: "heading", text: "A Cautionary Note on Valuations" },
      {
        type: "paragraph",
        text: "Several strategists pointed out that many AI-adjacent stocks are trading at lofty valuations. Leading semiconductor stocks trade at an average forward P/E above 40x — more than double the S&P 500's overall multiple.",
      },
      {
        type: "quote",
        text: "The spending numbers are impressive, but at some point the market has to ask: when does all this AI investment translate into profits? Right now, investors are paying for a very optimistic future.",
        attribution: "Derek Howell, Portfolio Manager, Axiom Growth Partners",
      },
      {
        type: "list",
        items: [
          "NVIDIA: +5.2%, extending its year-to-date gain to over 30%.",
          "Broadcom: +4.7%, after raising its AI revenue forecast for fiscal 2026.",
          "AMD: +3.1%, as investors bet on server GPU market share gains.",
          "Super Micro Computer: +7.8%, on strong shipment data for AI servers.",
        ],
      },
    ],
  },
  {
    id: "6",
    title: "Treasury Yields Rise Amid Stronger-Than-Expected Jobs Data",
    excerpt:
      "The 10-year Treasury yield climbed to 4.72% after the latest payrolls report showed the economy added 275,000 jobs in February, well above consensus forecasts.",
    category: "Bonds",
    author: { name: "David Chen", title: "Fixed Income Reporter" },
    publishedAt: "2026-03-13T15:20:00Z",
    readTimeMinutes: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1554260570-e9689a3418b8?w=1200&q=80",
    imageCaption: "U.S. Treasury Department building, Washington, D.C.",
    slug: "treasury-yields-jobs-data",
    tags: ["Treasury Yields", "Jobs Report", "Bonds", "Economy"],
    keyTakeaways: [
      "Nonfarm payrolls rose by 275,000 in February, beating the 200,000 consensus estimate.",
      "The unemployment rate ticked up slightly to 3.9%.",
      "The 10-year Treasury yield jumped 12 basis points to 4.72%.",
      "Markets pushed back their expectations for the first Fed rate cut to September.",
    ],
    body: [
      {
        type: "paragraph",
        text: "U.S. Treasury yields surged on Friday after the government reported a significantly stronger-than-expected February jobs figure, pushing back market expectations for when the Federal Reserve might begin cutting interest rates.",
      },
      {
        type: "paragraph",
        text: "The economy added 275,000 nonfarm payroll jobs last month, well above the 200,000 that economists had forecast. The unemployment rate edged up to 3.9% from 3.7%, partly reflecting more people entering the labor force.",
      },
      { type: "heading", text: "Yields Jump, Rate-Cut Bets Fade" },
      {
        type: "paragraph",
        text: "The benchmark 10-year Treasury yield climbed 12 basis points to 4.72%, its highest level in six weeks, as traders rapidly repriced their bets on the Fed's rate path. Fed funds futures now imply the first rate cut won't arrive until September.",
      },
      {
        type: "callout",
        text: "A basis point is one-hundredth of a percentage point. The 12-basis-point move in the 10-year yield was its largest single-day jump in more than a month.",
      },
      {
        type: "paragraph",
        text: "The 2-year Treasury yield rose even more sharply — climbing 15 basis points to 4.89%. The spread between 2-year and 10-year yields narrowed slightly, continuing a slow normalization after an extended period of inversion.",
      },
      {
        type: "quote",
        text: "This report is a reminder that the labor market remains resilient, and the Fed has no urgency to cut. The bond market is just catching up to what the data has been telling us for months.",
        attribution:
          "Fiona Blake, Head of Rates Strategy, Continental Asset Management",
      },
    ],
  },
  {
    id: "7",
    title: "Best High-Yield Savings Accounts of 2026: Rates Top 5%",
    excerpt:
      "With the Fed keeping rates elevated, online banks are competing fiercely for deposits. Here are the top accounts offering the highest APYs right now.",
    category: "PersonalFinance",
    author: { name: "Aisha Patel", title: "Personal Finance Editor" },
    publishedAt: "2026-03-13T09:00:00Z",
    readTimeMinutes: 6,
    imageUrl:
      "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80",
    imageCaption:
      "Online banking apps have made high-yield savings accounts more accessible than ever.",
    slug: "best-high-yield-savings-accounts-2026",
    tags: ["Savings Accounts", "APY", "Personal Finance", "Interest Rates"],
    keyTakeaways: [
      "Several online banks are offering APYs above 5% on high-yield savings accounts.",
      "The national average savings rate remains a paltry 0.46%, per FDIC data.",
      "All accounts mentioned are FDIC-insured up to $250,000 per depositor.",
      "Rates could decline if the Fed begins cutting later this year.",
    ],
    body: [
      {
        type: "paragraph",
        text: "If your savings are still sitting in a traditional bank account earning near-zero interest, you could be leaving hundreds or thousands of dollars on the table each year. With the Federal Reserve keeping its benchmark rate elevated, online banks are in a fierce battle for deposits.",
      },
      {
        type: "callout",
        text: "The national average interest rate on savings accounts is just 0.46%, according to the FDIC. The best high-yield savings accounts currently pay more than 10 times that.",
      },
      { type: "heading", text: "Top High-Yield Savings Accounts Right Now" },
      {
        type: "list",
        items: [
          "EverBank Performance Savings: 5.15% APY — no minimum balance, FDIC insured.",
          "UFB Direct High Yield Savings: 5.10% APY — no monthly fees, $0 minimum.",
          "Bread Financial High-Yield Savings: 5.05% APY — easy online account management.",
          "Marcus by Goldman Sachs Online Savings: 4.90% APY — no-fee, no-minimum account.",
          "LendingClub High-Yield Savings: 4.85% APY — comes with an optional debit card.",
        ],
      },
      { type: "heading", text: "What to Look For" },
      {
        type: "paragraph",
        text: "When choosing a high-yield savings account, the APY is obviously important — but it shouldn't be the only factor. Look for accounts with no monthly maintenance fees, no minimum balance requirements, and an easy-to-use mobile app. Confirm the bank is FDIC-insured, which protects deposits up to $250,000 per depositor.",
      },
      {
        type: "paragraph",
        text: "One important caveat: the rates on these accounts are variable, meaning the bank can lower them at any time. If the Federal Reserve starts cutting rates later this year, expect APYs on high-yield savings accounts to follow suit.",
      },
      {
        type: "quote",
        text: "This is genuinely one of the best environments for savers in 15 years. People who are still in big-bank accounts earning 0.01% are essentially gifting money to their bank.",
        attribution: "Greg Harmon, CFP, Blue Ridge Financial Planning",
      },
    ],
  },
  {
    id: "8",
    title:
      "Gold Hits $2,400 as Investors Seek Safe Haven Amid Global Uncertainty",
    excerpt:
      "Spot gold prices crossed the $2,400 per ounce threshold for the first time, as geopolitical tensions and concerns over slowing global growth drove demand for safe-haven assets.",
    category: "Markets",
    author: { name: "Nora Walsh", title: "Commodities Reporter" },
    publishedAt: "2026-03-12T13:30:00Z",
    readTimeMinutes: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&q=80",
    imageCaption: "Gold bullion bars at a secure storage facility.",
    slug: "gold-hits-2400-safe-haven",
    tags: ["Gold", "Safe Haven", "Commodities", "Geopolitics"],
    keyTakeaways: [
      "Spot gold crossed $2,400 per ounce for the first time ever.",
      "Central bank buying, particularly from emerging markets, has been a persistent tailwind.",
      "A weaker U.S. dollar also contributed to gold's advance.",
      "Silver and platinum also rose sharply in sympathy.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Gold prices crossed the $2,400 per ounce threshold for the first time in history on Wednesday, driven by a confluence of geopolitical anxieties, steady central bank buying, and a modest weakening of the U.S. dollar.",
      },
      {
        type: "paragraph",
        text: "Spot gold rose 1.7% to an intraday peak of $2,418 before easing slightly to close at $2,404. The metal has gained more than 14% so far this year, making it one of the best-performing major assets of 2026.",
      },
      { type: "heading", text: "Central Banks Continue to Buy" },
      {
        type: "paragraph",
        text: "One of the most persistent drivers of gold's multi-year bull run has been relentless buying by central banks, particularly in emerging markets. The World Gold Council reported that central banks globally added more than 1,000 tonnes of gold to their reserves last year.",
      },
      {
        type: "callout",
        text: "Central bank gold purchases have been elevated since 2022, when the U.S. froze Russia's foreign exchange reserves, prompting other nations to diversify away from dollar-denominated assets.",
      },
      { type: "heading", text: "The Dollar Factor" },
      {
        type: "paragraph",
        text: "Gold is priced in U.S. dollars, so a softer greenback makes the metal cheaper for buyers in other currencies and typically boosts demand. The DXY dollar index has fallen roughly 2% over the past month, providing an additional tailwind for commodities broadly.",
      },
      {
        type: "quote",
        text: "The $2,400 level was a significant psychological milestone. Now that it has been breached, $2,500 is very much in the conversation for later this year.",
        attribution:
          "Elena Vasquez, Senior Metals Analyst, Thornbury Commodities",
      },
    ],
  },
  {
    id: "9",
    title:
      "ETF Inflows Hit Record $150 Billion in February, Led by Equity Funds",
    excerpt:
      "Exchange-traded funds saw their strongest monthly inflows ever, with broad equity ETFs accounting for the lion's share as retail and institutional investors poured money into passive strategies.",
    category: "ETFs",
    author: { name: "Tom Rivera", title: "ETF & Funds Reporter" },
    publishedAt: "2026-03-12T10:00:00Z",
    readTimeMinutes: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    imageCaption:
      "Exchange-traded funds have become the dominant vehicle for passive investing.",
    slug: "etf-inflows-record-february",
    tags: ["ETFs", "Passive Investing", "Inflows", "Vanguard", "BlackRock"],
    keyTakeaways: [
      "U.S.-listed ETFs attracted $150 billion in net new assets in February, a new monthly record.",
      "Equity ETFs led with $105 billion in inflows; bond ETFs captured $38 billion.",
      "Vanguard and BlackRock together accounted for more than 55% of total inflows.",
      "Total U.S. ETF assets under management now exceed $10 trillion.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Exchange-traded funds listed in the United States attracted a record $150 billion in net new assets during February, smashing the previous monthly record as both retail and institutional investors continued their relentless shift toward low-cost passive investing strategies.",
      },
      {
        type: "paragraph",
        text: "Equity ETFs led the charge with $105 billion of inflows, followed by bond ETFs with $38 billion and commodity ETFs — including gold and bitcoin funds — with the remaining $7 billion.",
      },
      { type: "heading", text: "Vanguard and BlackRock Dominate" },
      {
        type: "paragraph",
        text: "Vanguard's Total Stock Market ETF (VTI) and S&P 500 ETF (VOO) together attracted more than $28 billion, while BlackRock's iShares Core S&P 500 ETF (IVV) and iShares Bitcoin Trust (IBIT) added another $26 billion.",
      },
      {
        type: "callout",
        text: "Total U.S. ETF assets under management crossed $10 trillion for the first time in February — a milestone that would have seemed impossible just a decade ago.",
      },
      { type: "heading", text: "Why the Surge?" },
      {
        type: "list",
        items: [
          "Rising equity markets made investors more comfortable putting money to work.",
          "New thematic and active ETFs broadened appeal to different investor types.",
          "Year-end tax-loss harvesting rotations from mutual funds into ETFs continued.",
          "Bitcoin ETFs maintained strong momentum, pulling in nearly $5 billion for the month.",
        ],
      },
      {
        type: "quote",
        text: "ETFs have won the structural battle. The question now isn't whether people will use ETFs, but which ETFs they'll choose. The competition is fierce and fees keep grinding lower.",
        attribution:
          "Ben Carlson, Director of Institutional Asset Management, Ritholtz Wealth",
      },
      {
        type: "paragraph",
        text: "The record inflows suggest that despite elevated valuations and macro uncertainty, investors are choosing to stay invested rather than move to the sidelines — a sign of underlying confidence in the long-term trajectory of financial markets.",
      },
    ],
  },
];
