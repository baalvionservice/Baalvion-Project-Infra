import {
  AdminUser,
  GlossaryTerm,
  APIKeyNode,
  AdPlacement,
  SystemConfig,
} from "@/types/admin-system";
import { NewsArticle, NewsCategory, NewsBodyBlock } from "@/lib/data.news";

export interface PagesType {
  id: string;
  slug: string;
  title: string;
  articlesCount: number;
}

/**
 * @fileOverview Administrative Kernel Service.
 * Simulates a production backend with stateful CRUD and data persistence.
 */

class AdminService {
  private isClient = typeof window !== "undefined";

  private getStorage<T>(key: string, fallback: T): T {
    if (!this.isClient) return fallback;
    const data = localStorage.getItem(`imperial_admin_${key}`);
    return data ? JSON.parse(data) : fallback;
  }

  private setStorage(key: string, data: any) {
    if (this.isClient) {
      localStorage.setItem(`imperial_admin_${key}`, JSON.stringify(data));
    }
  }

  // --- CONTENT EMPIRE ---
  getArticles(): NewsArticle[] {
    return this.getStorage("articles", [
      {
        id: "1",
        title:
          "Federal Reserve Holds Rates Steady as Inflation Shows Signs of Cooling",
        excerpt:
          "The Federal Open Market Committee voted unanimously to keep the federal funds rate in the 5.25%–5.50% range, citing progress on inflation but warning that further data is needed before cuts.",
        category: "Economy" as NewsCategory,
        author: { name: "Rachel Kim", title: "Senior Economics Correspondent" },
        publishedAt: "2026-03-15T14:30:00Z",
        updatedAt: "2026-03-15T18:00:00Z",
        readTimeMinutes: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
        imageCaption: "The Federal Reserve building in Washington, D.C.",
        slug: "fed-holds-rates-inflation-cooling",
        featured: true,
        keyTakeaways: [
          "The FOMC voted unanimously to hold rates at 5.25%–5.50% for the fourth consecutive meeting.",
          "Fed Chair Powell said inflation is 'moving in the right direction' but isn't yet at the 2% target.",
        ],
        body: [
          {
            type: "paragraph",
            text: "The Federal Reserve kept its benchmark interest rate unchanged on Wednesday, maintaining its cautious stance as policymakers wait for more evidence that inflation is durably returning to the central bank's 2% target.",
          },
        ] as NewsBodyBlock[],
        tags: ["Federal Reserve", "Interest Rates", "Inflation", "FOMC"],
      },
      {
        id: "2",
        title: "S&P 500 Climbs to Fresh Record High on Strong Earnings Reports",
        excerpt:
          "The benchmark index surged 1.2% to close at an all-time high as a wave of better-than-expected corporate earnings boosted investor confidence across sectors.",
        category: "Markets" as NewsCategory,
        author: { name: "James Okafor", title: "Markets Reporter" },
        publishedAt: "2026-03-15T12:00:00Z",
        readTimeMinutes: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80",
        imageCaption:
          "Traders at the New York Stock Exchange react to earnings news.",
        slug: "sp500-record-high-earnings",
        keyTakeaways: [
          "The S&P 500 set a new intraday and closing record on Thursday.",
          "About 78% of S&P 500 companies that have reported have beaten EPS estimates.",
        ],
        body: [
          {
            type: "paragraph",
            text: "Wall Street's benchmark index closed at a fresh all-time high on Thursday, powered by a string of better-than-expected quarterly earnings reports that lifted sentiment across nearly every sector of the market.",
          },
        ] as NewsBodyBlock[],
        tags: ["S&P 500", "Earnings", "Stock Market", "Equities"],
      },
      {
        id: "3",
        title: "Bitcoin Surges Past $95,000 Amid Renewed Institutional Demand",
        excerpt:
          "The world's largest cryptocurrency climbed more than 8% in 24 hours, driven by fresh inflows into spot Bitcoin ETFs and growing interest from hedge funds.",
        category: "Crypto" as NewsCategory,
        author: {
          name: "Priya Sharma",
          title: "Crypto & Digital Assets Editor",
        },
        publishedAt: "2026-03-15T10:15:00Z",
        readTimeMinutes: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&q=80",
        imageCaption: "A Bitcoin token alongside other cryptocurrencies.",
        slug: "bitcoin-surges-institutional-demand",
        keyTakeaways: [
          "Bitcoin crossed $95,000 for the first time since January, gaining over 8% in 24 hours.",
          "Spot Bitcoin ETFs recorded their largest single-day inflow in three months.",
        ],
        body: [
          {
            type: "paragraph",
            text: "Bitcoin surged past $95,000 for the first time in nearly two months on Saturday, as a combination of robust inflows into U.S.-listed spot Bitcoin ETFs and renewed buying from large institutional investors reignited bullish momentum.",
          },
        ] as NewsBodyBlock[],
        tags: ["Bitcoin", "Crypto", "ETF", "Institutional Investing"],
      },
      {
        id: "4",
        title: "Housing Market Cools as Mortgage Rates Tick Back Above 7%",
        excerpt:
          "Existing home sales fell 3.4% last month as rising mortgage rates squeezed affordability, with first-time buyers bearing the brunt of the slowdown.",
        category: "RealEstate" as NewsCategory,
        author: { name: "Marco Delgado", title: "Real Estate Correspondent" },
        publishedAt: "2026-03-14T16:45:00Z",
        readTimeMinutes: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
        imageCaption: "A suburban home listed for sale in the U.S.",
        slug: "housing-market-cools-mortgage-rates",
        keyTakeaways: [
          "Existing home sales dropped 3.4% month-over-month to a seasonally adjusted annual rate of 3.97 million units.",
          "The average 30-year fixed mortgage rate climbed back above 7% for the first time since November.",
        ],
        body: [
          {
            type: "paragraph",
            text: "The U.S. housing market showed fresh signs of cooling in February as mortgage rates climbed back above 7%, pricing out many would-be buyers and dragging existing home sales to their lowest level in four months.",
          },
        ] as NewsBodyBlock[],
        tags: ["Housing Market", "Mortgage Rates", "Real Estate", "Fed"],
      },
      {
        id: "5",
        title:
          "Tech Stocks Rally on AI Spending Boom — but Analysts Urge Caution",
        excerpt:
          "Shares of major AI infrastructure companies jumped after a string of upbeat outlooks, but some analysts warn valuations are stretched and a pullback could be overdue.",
        category: "Stocks" as NewsCategory,
        author: { name: "Lisa Tran", title: "Technology Stocks Reporter" },
        publishedAt: "2026-03-14T11:00:00Z",
        readTimeMinutes: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1200&q=80",
        imageCaption: "A data center powering AI workloads.",
        slug: "tech-stocks-ai-spending-boom",
        keyTakeaways: [
          "Shares of major AI chipmakers and cloud providers surged 3–7% after upbeat capital expenditure guidance.",
          "Global AI infrastructure spending is forecast to exceed $300 billion in 2026.",
        ],
        body: [
          {
            type: "paragraph",
            text: "Technology stocks soared on Friday as the world's largest cloud computing companies signaled they would significantly increase their spending on artificial intelligence infrastructure this year, sending shares of chipmakers and data center operators to fresh highs.",
          },
        ] as NewsBodyBlock[],
        tags: [
          "Tech Stocks",
          "Artificial Intelligence",
          "Semiconductors",
          "NVIDIA",
        ],
      },
      {
        id: "6",
        title: "Treasury Yields Rise Amid Stronger-Than-Expected Jobs Data",
        excerpt:
          "The 10-year Treasury yield climbed to 4.72% after the latest payrolls report showed the economy added 275,000 jobs in February, well above consensus forecasts.",
        category: "Bonds" as NewsCategory,
        author: { name: "David Chen", title: "Fixed Income Reporter" },
        publishedAt: "2026-03-13T15:20:00Z",
        readTimeMinutes: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1554260570-e9689a3418b8?w=1200&q=80",
        imageCaption: "U.S. Treasury Department building, Washington, D.C.",
        slug: "treasury-yields-jobs-data",
        keyTakeaways: [
          "Nonfarm payrolls rose by 275,000 in February, beating the 200,000 consensus estimate.",
          "The unemployment rate ticked up slightly to 3.9%.",
        ],
        body: [
          {
            type: "paragraph",
            text: "U.S. Treasury yields surged on Friday after the government reported a significantly stronger-than-expected February jobs figure, pushing back market expectations for when the Federal Reserve might begin cutting interest rates.",
          },
        ] as NewsBodyBlock[],
        tags: ["Treasury Yields", "Jobs Report", "Bonds", "Economy"],
      },
      {
        id: "7",
        title: "Best High-Yield Savings Accounts of 2026: Rates Top 5%",
        excerpt:
          "With the Fed keeping rates elevated, online banks are competing fiercely for deposits. Here are the top accounts offering the highest APYs right now.",
        category: "PersonalFinance" as NewsCategory,
        author: { name: "Aisha Patel", title: "Personal Finance Editor" },
        publishedAt: "2026-03-13T09:00:00Z",
        readTimeMinutes: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200&q=80",
        imageCaption:
          "Online banking apps have made high-yield savings accounts more accessible than ever.",
        slug: "best-high-yield-savings-accounts-2026",
        keyTakeaways: [
          "Several online banks are offering APYs above 5% on high-yield savings accounts.",
          "The national average savings rate remains a paltry 0.46%, per FDIC data.",
        ],
        body: [
          {
            type: "paragraph",
            text: "If your savings are still sitting in a traditional bank account earning near-zero interest, you could be leaving hundreds or thousands of dollars on the table each year. With the Federal Reserve keeping its benchmark rate elevated, online banks are in a fierce battle for deposits.",
          },
        ] as NewsBodyBlock[],
        tags: ["Savings Accounts", "APY", "Personal Finance", "Interest Rates"],
      },
      {
        id: "8",
        title:
          "Gold Hits $2,400 as Investors Seek Safe Haven Amid Global Uncertainty",
        excerpt:
          "Spot gold prices crossed the $2,400 per ounce threshold for the first time, as geopolitical tensions and concerns over slowing global growth drove demand for safe-haven assets.",
        category: "Markets" as NewsCategory,
        author: { name: "Nora Walsh", title: "Commodities Reporter" },
        publishedAt: "2026-03-12T13:30:00Z",
        readTimeMinutes: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1200&q=80",
        imageCaption: "Gold bullion bars at a secure storage facility.",
        slug: "gold-hits-2400-safe-haven",
        keyTakeaways: [
          "Spot gold crossed $2,400 per ounce for the first time ever.",
          "Central bank buying, particularly from emerging markets, has been a persistent tailwind.",
        ],
        body: [
          {
            type: "paragraph",
            text: "Gold prices crossed the $2,400 per ounce threshold for the first time in history on Wednesday, driven by a confluence of geopolitical anxieties, steady central bank buying, and a modest weakening of the U.S. dollar.",
          },
        ] as NewsBodyBlock[],
        tags: ["Gold", "Safe Haven", "Commodities", "Geopolitics"],
      },
      {
        id: "9",
        title:
          "ETF Inflows Hit Record $150 Billion in February, Led by Equity Funds",
        excerpt:
          "Exchange-traded funds saw their strongest monthly inflows ever, with broad equity ETFs accounting for the lion's share as retail and institutional investors poured money into passive strategies.",
        category: "ETFs" as NewsCategory,
        author: { name: "Tom Rivera", title: "ETF & Funds Reporter" },
        publishedAt: "2026-03-12T10:00:00Z",
        readTimeMinutes: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        imageCaption:
          "Exchange-traded funds have become the dominant vehicle for passive investing.",
        slug: "etf-inflows-record-february",
        keyTakeaways: [
          "U.S.-listed ETFs attracted $150 billion in net new assets in February, a new monthly record.",
          "Equity ETFs led with $105 billion in inflows; bond ETFs captured $38 billion.",
        ],
        body: [
          {
            type: "paragraph",
            text: "Exchange-traded funds listed in the United States attracted a record $150 billion in net new assets during February, smashing the previous monthly record as both retail and institutional investors continued their relentless shift toward low-cost passive investing strategies.",
          },
        ] as NewsBodyBlock[],
        tags: ["ETFs", "Passive Investing", "Inflows", "Vanguard", "BlackRock"],
      },
    ]);
  }

  saveArticle(article: NewsArticle) {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.id === article.id);
    if (index > -1) {
      articles[index] = { ...article, updatedAt: new Date().toISOString() };
    } else {
      articles.push({
        ...article,
        id: Date.now().toString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.setStorage("articles", articles);
  }

  deleteArticle(id: string) {
    const articles = this.getArticles().filter((a) => a.id !== id);
    this.setStorage("articles", articles);
  }

  getArticleById(id: string): NewsArticle | null {
    const articles = this.getArticles();
    return articles.find((a) => a.id === id) || null;
  }

  getArticleBySlug(slug: string): NewsArticle | null {
    const articles = this.getArticles();
    return articles.find((a) => a.slug === slug) || null;
  }

  // --- USER MANAGEMENT ---
  getUsers(): AdminUser[] {
    return this.getStorage("users", [
      {
        id: "u-1",
        name: "Eleanor Vance",
        email: "eleanor@imperialpedia.com",
        role: "Super Admin",
        status: "active",
        lastActive: "2m ago",
      },
      {
        id: "u-2",
        name: "Julian Wealth",
        email: "julian@wealth.com",
        role: "Editor",
        status: "active",
        lastActive: "1h ago",
      },
      {
        id: "u-3",
        name: "Sarah Crypto",
        email: "sarah@web3.io",
        role: "Writer",
        status: "active",
        lastActive: "4h ago",
      },
    ]);
  }

  updateUserRole(userId: string, role: any) {
    const users = this.getUsers().map((u) =>
      u.id === userId ? { ...u, role } : u
    );
    this.setStorage("users", users);
  }

  // --- PAGES ---
  getPages(): PagesType[] {
    const articles = this.getArticles();

    // Calculate article counts by category/topic
    const getArticleCount = (
      categories: string[],
      tags: string[] = []
    ): number => {
      return articles.filter(
        (article) =>
          categories.some((cat) =>
            article.category.toLowerCase().includes(cat.toLowerCase())
          ) ||
          tags.some((tag) =>
            article.tags?.some((articleTag) =>
              articleTag.toLowerCase().includes(tag.toLowerCase())
            )
          )
      ).length;
    };

    return this.getStorage("pages", [
      // Main Navigation Pages
      { id: "p1", title: "News", slug: "news", articlesCount: articles.length },
      {
        id: "p2",
        title: "Investing",
        slug: "investing",
        articlesCount: getArticleCount(
          ["Stocks", "Markets", "ETFs"],
          ["Investing", "Portfolio"]
        ),
      },
      {
        id: "p3",
        title: "Banking",
        slug: "banking",
        articlesCount: getArticleCount([], ["Banking", "Savings", "Checking"]),
      },
      {
        id: "p4",
        title: "Personal Finance",
        slug: "personal-finance",
        articlesCount: getArticleCount(
          ["PersonalFinance"],
          ["Personal Finance", "APY"]
        ),
      },
      {
        id: "p5",
        title: "Economy",
        slug: "economy",
        articlesCount: getArticleCount(
          ["Economy"],
          ["Federal Reserve", "Inflation", "Jobs"]
        ),
      },
      {
        id: "p6",
        title: "Reviews",
        slug: "reviews",
        articlesCount: getArticleCount([], ["Reviews"]),
      },

      // News Subcategories
      {
        id: "p7",
        title: "Market News",
        slug: "market-news",
        articlesCount: getArticleCount(["Markets"], ["Market", "S&P 500"]),
      },
      {
        id: "p8",
        title: "Company News",
        slug: "company-news",
        articlesCount: getArticleCount([], ["Earnings", "Company"]),
      },
      {
        id: "p9",
        title: "Earnings",
        slug: "earnings",
        articlesCount: getArticleCount([], ["Earnings"]),
      },
      {
        id: "p10",
        title: "CD Rates",
        slug: "cd-rates",
        articlesCount: getArticleCount([], ["CD", "Rates"]),
      },
      {
        id: "p11",
        title: "Mortgage Rates",
        slug: "mortgage-rates",
        articlesCount: getArticleCount(["RealEstate"], ["Mortgage"]),
      },
      {
        id: "p12",
        title: "Government",
        slug: "government",
        articlesCount: getArticleCount([], ["Government", "Fed"]),
      },
      {
        id: "p13",
        title: "Crypto",
        slug: "crypto",
        articlesCount: getArticleCount(["Crypto"], ["Bitcoin", "Crypto"]),
      },
      {
        id: "p14",
        title: "Live Market News",
        slug: "live-market-news",
        articlesCount: getArticleCount(["Markets"], ["Live", "Market"]),
      },

      // Investing Subcategories
      {
        id: "p15",
        title: "Stocks",
        slug: "stocks",
        articlesCount: getArticleCount(["Stocks"], ["Stock", "Equities"]),
      },
      {
        id: "p16",
        title: "Bonds",
        slug: "bonds",
        articlesCount: getArticleCount(["Bonds"], ["Treasury", "Bond"]),
      },
      {
        id: "p17",
        title: "ETFs",
        slug: "etfs",
        articlesCount: getArticleCount(["ETFs"], ["ETF"]),
      },
      {
        id: "p18",
        title: "Mutual Funds",
        slug: "mutual-funds",
        articlesCount: getArticleCount([], ["Mutual Fund"]),
      },
      {
        id: "p19",
        title: "Options",
        slug: "options",
        articlesCount: getArticleCount([], ["Options"]),
      },
      {
        id: "p20",
        title: "Commodities",
        slug: "commodities",
        articlesCount: getArticleCount([], ["Gold", "Commodities"]),
      },
      {
        id: "p21",
        title: "Cryptocurrency",
        slug: "cryptocurrency",
        articlesCount: getArticleCount(["Crypto"], ["Bitcoin", "Crypto"]),
      },
      {
        id: "p22",
        title: "Real Estate",
        slug: "real-estate",
        articlesCount: getArticleCount(
          ["RealEstate"],
          ["Real Estate", "Housing"]
        ),
      },
      {
        id: "p23",
        title: "Retirement Planning",
        slug: "retirement",
        articlesCount: getArticleCount([], ["Retirement"]),
      },
      {
        id: "p24",
        title: "Portfolio Management",
        slug: "portfolio",
        articlesCount: getArticleCount([], ["Portfolio"]),
      },

      // Banking Subcategories
      {
        id: "p25",
        title: "Savings Accounts",
        slug: "savings",
        articlesCount: getArticleCount([], ["Savings"]),
      },
      {
        id: "p26",
        title: "Checking Accounts",
        slug: "checking",
        articlesCount: getArticleCount([], ["Checking"]),
      },
      {
        id: "p27",
        title: "Money Market",
        slug: "money-market",
        articlesCount: getArticleCount([], ["Money Market"]),
      },
      {
        id: "p28",
        title: "Credit Cards",
        slug: "credit-cards",
        articlesCount: getArticleCount([], ["Credit Card"]),
      },
      {
        id: "p29",
        title: "Personal Loans",
        slug: "loans",
        articlesCount: getArticleCount([], ["Loan"]),
      },
      {
        id: "p30",
        title: "Mortgages",
        slug: "mortgages",
        articlesCount: getArticleCount(["RealEstate"], ["Mortgage"]),
      },
      {
        id: "p31",
        title: "Auto Loans",
        slug: "auto-loans",
        articlesCount: getArticleCount([], ["Auto Loan"]),
      },
      {
        id: "p32",
        title: "Student Loans",
        slug: "student-loans",
        articlesCount: getArticleCount([], ["Student Loan"]),
      },
      {
        id: "p33",
        title: "Banking Reviews",
        slug: "banking-reviews",
        articlesCount: getArticleCount([], ["Banking", "Review"]),
      },

      // Personal Finance Subcategories
      {
        id: "p34",
        title: "Budgeting",
        slug: "budgeting",
        articlesCount: getArticleCount([], ["Budget"]),
      },
      {
        id: "p35",
        title: "Debt Management",
        slug: "debt",
        articlesCount: getArticleCount([], ["Debt"]),
      },
      {
        id: "p36",
        title: "Credit Scores",
        slug: "credit",
        articlesCount: getArticleCount([], ["Credit"]),
      },
      {
        id: "p37",
        title: "Insurance",
        slug: "insurance",
        articlesCount: getArticleCount([], ["Insurance"]),
      },
      {
        id: "p38",
        title: "Taxes",
        slug: "taxes",
        articlesCount: getArticleCount([], ["Tax"]),
      },
      {
        id: "p39",
        title: "Estate Planning",
        slug: "estate-planning",
        articlesCount: getArticleCount([], ["Estate"]),
      },
      {
        id: "p40",
        title: "Financial Planning",
        slug: "planning",
        articlesCount: getArticleCount([], ["Financial Planning"]),
      },
      {
        id: "p41",
        title: "Emergency Fund",
        slug: "emergency-fund",
        articlesCount: getArticleCount([], ["Emergency"]),
      },
      {
        id: "p42",
        title: "Side Hustles",
        slug: "income",
        articlesCount: getArticleCount([], ["Income"]),
      },
      {
        id: "p43",
        title: "Financial Calculators",
        slug: "financial-calculators",
        articlesCount: getArticleCount([], ["Calculator"]),
      },

      // Economy Subcategories
      {
        id: "p44",
        title: "Economic Indicators",
        slug: "indicators",
        articlesCount: getArticleCount([], ["Indicator"]),
      },
      {
        id: "p45",
        title: "Federal Reserve",
        slug: "fed",
        articlesCount: getArticleCount([], ["Federal Reserve", "Fed"]),
      },
      {
        id: "p46",
        title: "Inflation",
        slug: "inflation",
        articlesCount: getArticleCount([], ["Inflation"]),
      },
      {
        id: "p47",
        title: "GDP",
        slug: "gdp",
        articlesCount: getArticleCount([], ["GDP"]),
      },
      {
        id: "p48",
        title: "Unemployment",
        slug: "unemployment",
        articlesCount: getArticleCount([], ["Unemployment", "Jobs"]),
      },
      {
        id: "p49",
        title: "Interest Rates",
        slug: "interest-rates",
        articlesCount: getArticleCount([], ["Interest Rates"]),
      },
      {
        id: "p50",
        title: "Fiscal Policy",
        slug: "fiscal-policy",
        articlesCount: getArticleCount([], ["Fiscal"]),
      },
      {
        id: "p51",
        title: "Monetary Policy",
        slug: "monetary-policy",
        articlesCount: getArticleCount([], ["Monetary"]),
      },
      {
        id: "p52",
        title: "Global Economy",
        slug: "global",
        articlesCount: getArticleCount([], ["Global"]),
      },
      {
        id: "p53",
        title: "Economic Calendar",
        slug: "calendar",
        articlesCount: getArticleCount([], ["Calendar"]),
      },

      // Reviews Subcategories
      {
        id: "p54",
        title: "Broker Reviews",
        slug: "broker-reviews",
        articlesCount: getArticleCount([], ["Broker"]),
      },
      {
        id: "p55",
        title: "Robo Advisor Reviews",
        slug: "robo-advisors",
        articlesCount: getArticleCount([], ["Robo"]),
      },
      {
        id: "p56",
        title: "Bank Reviews",
        slug: "bank-reviews",
        articlesCount: getArticleCount([], ["Bank Review"]),
      },
      {
        id: "p57",
        title: "Credit Card Reviews",
        slug: "credit-card-reviews",
        articlesCount: getArticleCount([], ["Credit Card Review"]),
      },
      {
        id: "p58",
        title: "Insurance Reviews",
        slug: "insurance-reviews",
        articlesCount: getArticleCount([], ["Insurance Review"]),
      },
      {
        id: "p59",
        title: "Loan Reviews",
        slug: "loan-reviews",
        articlesCount: getArticleCount([], ["Loan Review"]),
      },
      {
        id: "p60",
        title: "Investment App Reviews",
        slug: "app-reviews",
        articlesCount: getArticleCount([], ["App Review"]),
      },
      {
        id: "p61",
        title: "Financial Advisor Reviews",
        slug: "advisor-reviews",
        articlesCount: getArticleCount([], ["Advisor Review"]),
      },
      {
        id: "p62",
        title: "Tax Software Reviews",
        slug: "tax-software",
        articlesCount: getArticleCount([], ["Tax Software"]),
      },
      {
        id: "p63",
        title: "Budgeting App Reviews",
        slug: "budgeting-apps",
        articlesCount: getArticleCount([], ["Budgeting App"]),
      },
    ]);
  }

  getPageBySlug(slug: string): PagesType | null {
    const pages = this.getPages();
    return pages.find((page) => page.slug === slug) || null;
  }

  getArticlesByPageSlug(slug: string): NewsArticle[] {
    const articles = this.getArticles();

    switch (slug) {
      case "news":
        return articles;
      case "market-news":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("markets") ||
            article.tags?.some((tag) =>
              ["Market", "S&P 500"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "crypto":
      case "cryptocurrency":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("crypto") ||
            article.tags?.some((tag) =>
              ["Bitcoin", "Crypto"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "economy":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("economy") ||
            article.tags?.some((tag) =>
              ["Federal Reserve", "Inflation", "Jobs"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "stocks":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("stocks") ||
            article.tags?.some((tag) =>
              ["Stock", "Equities"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "bonds":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("bonds") ||
            article.tags?.some((tag) =>
              ["Treasury", "Bond"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "etfs":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("etfs") ||
            article.tags?.some((tag) => tag.toLowerCase().includes("etf"))
        );
      case "real-estate":
      case "mortgages":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("realestate") ||
            article.tags?.some((tag) =>
              ["Mortgage", "Real Estate", "Housing"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      case "personal-finance":
        return articles.filter(
          (article) =>
            article.category.toLowerCase().includes("personalfinance") ||
            article.tags?.some((tag) =>
              ["Personal Finance", "APY"].some((searchTag) =>
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            )
        );
      default:
        // eslint-disable-next-line no-case-declarations
        const slugKeywords = slug.split("-");
        return articles.filter(
          (article) =>
            slugKeywords.some((keyword) =>
              article.category.toLowerCase().includes(keyword.toLowerCase())
            ) ||
            article.tags?.some((tag) =>
              slugKeywords.some((keyword) =>
                tag.toLowerCase().includes(keyword.toLowerCase())
              )
            )
        );
    }
  }

  // --- GLOSSARY ---
  getTerms(): GlossaryTerm[] {
    return this.getStorage("glossary", [
      {
        id: "g1",
        term: "Stagflation",
        definition: "High inflation + Low growth.",
        category: "Economics",
        linkedArticles: ["1"],
      },
      {
        id: "g2",
        term: "Arbitrage",
        definition: "Simultaneous purchase and sale.",
        category: "Trading",
        linkedArticles: [],
      },
    ]);
  }

  saveTerm(term: GlossaryTerm) {
    const terms = this.getTerms();
    const index = terms.findIndex((t) => t.id === term.id);
    if (index > -1) terms[index] = term;
    else terms.push({ ...term, id: Date.now().toString() });
    this.setStorage("glossary", terms);
  }

  // --- API HUB ---
  getApiKeys(): APIKeyNode[] {
    return this.getStorage("api_keys", [
      {
        id: "k1",
        service: "Claude 3.5 Sonnet",
        key: "sk-ant-...",
        status: "active",
        usage: "42%",
      },
      {
        id: "k2",
        service: "AlphaVantage Market",
        key: "AV-99...",
        status: "active",
        usage: "12%",
      },
    ]);
  }

  // --- SETTINGS ---
  getConfig(): SystemConfig {
    return this.getStorage("config", {
      siteName: "Imperialpedia",
      contactEmail: "governance@imperialpedia.com",
      branding: { primaryColor: "#8272F2", logoUrl: "/logo.png" },
      features: { aiDrafting: true, autoLinking: true, realTimeMarket: true },
    });
  }

  updateConfig(config: SystemConfig) {
    this.setStorage("config", config);
  }
}

export const adminKernel = new AdminService();
