export const marketIndicators = [
  {
    name: "Dow Jones",
    value: "39,118.86",
    change: "+263.71",
    percent: "+0.68%",
    positive: true,
  },
  {
    name: "S&P 500",
    value: "5,248.49",
    change: "+59.88",
    percent: "+1.15%",
    positive: true,
  },
  {
    name: "Nasdaq",
    value: "16,428.82",
    change: "+245.33",
    percent: "+1.52%",
    positive: true,
  },
  {
    name: "Russell 2000",
    value: "2,071.38",
    change: "-12.44",
    percent: "-0.60%",
    positive: false,
  },
  {
    name: "10-Yr Bond",
    value: "4.317%",
    change: "+0.029",
    percent: "+0.68%",
    positive: false,
  },
  {
    name: "Gold",
    value: "2,331.40",
    change: "+18.60",
    percent: "+0.81%",
    positive: true,
  },
  {
    name: "Oil (WTI)",
    value: "83.17",
    change: "-0.43",
    percent: "-0.51%",
    positive: false,
  },
  {
    name: "EUR/USD",
    value: "1.0745",
    change: "-0.0012",
    percent: "-0.11%",
    positive: false,
  },
  {
    name: "Bitcoin",
    value: "67,843.20",
    change: "+1,204.50",
    percent: "+1.81%",
    positive: true,
  },
  {
    name: "VIX",
    value: "13.26",
    change: "-0.82",
    percent: "-5.83%",
    positive: false,
  },
  {
    name: "Nikkei 225",
    value: "38,460.08",
    change: "+907.92",
    percent: "+2.42%",
    positive: true,
  },
  {
    name: "FTSE 100",
    value: "8,044.81",
    change: "+20.94",
    percent: "+0.26%",
    positive: true,
  },
];

export const worldMarkets = [
  {
    region: "Americas",
    markets: [
      { name: "Dow", value: "39,118", change: "+0.68%", positive: true },
      { name: "S&P", value: "5,248", change: "+1.15%", positive: true },
      { name: "Nasdaq", value: "16,428", change: "+1.52%", positive: true },
      { name: "TSX", value: "22,108", change: "+0.22%", positive: true },
      { name: "Bovespa", value: "127,842", change: "-0.34%", positive: false },
    ],
  },
  {
    region: "Europe",
    markets: [
      { name: "FTSE", value: "8,044", change: "+0.26%", positive: true },
      { name: "DAX", value: "18,161", change: "+0.84%", positive: true },
      { name: "CAC 40", value: "8,106", change: "+0.55%", positive: true },
      { name: "IBEX", value: "11,015", change: "-0.18%", positive: false },
      { name: "STOXX 600", value: "508", change: "+0.47%", positive: true },
    ],
  },
  {
    region: "Asia-Pacific",
    markets: [
      { name: "Nikkei", value: "38,460", change: "+2.42%", positive: true },
      { name: "Hang Seng", value: "17,651", change: "+1.76%", positive: true },
      { name: "Shanghai", value: "3,074", change: "+0.29%", positive: true },
      { name: "ASX 200", value: "7,791", change: "+0.48%", positive: true },
      { name: "Kospi", value: "2,676", change: "-0.22%", positive: false },
    ],
  },
];

export const featuredNews = [
  {
    id: 1,
    category: "MARKETS",
    headline:
      "S&P 500 surges past 5,200 as Fed signals rate cuts remain on the table for 2024",
    summary:
      "Wall Street rallied sharply Friday after Federal Reserve officials suggested that interest rate cuts are still possible this year despite stubborn inflation readings.",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    time: "2 hours ago",
    author: "Sarah Johnson",
    tag: "BREAKING",
  },
  {
    id: 2,
    category: "ECONOMY",
    headline:
      "U.S. jobs report blows past expectations with 303,000 new positions added in March",
    summary:
      "The American economy added far more jobs than expected last month, complicating the Fed's path to cutting interest rates.",
    image:
      "https://images.unsplash.com/photo-1521790945508-bf2a36314e85?w=800&q=80",
    time: "4 hours ago",
    author: "Michael Torres",
    tag: null,
  },
  {
    id: 3,
    category: "TECH",
    headline:
      "Nvidia shares climb 5% as AI chip demand continues to exceed all supply forecasts",
    summary:
      "The chipmaker's stock reached new all-time highs after analysts raised price targets citing insatiable demand for its H100 GPU.",
    image:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
    time: "5 hours ago",
    author: "Lisa Chen",
    tag: null,
  },
];

export const latestNews = [
  {
    id: 10,
    time: "12:45 PM ET",
    category: "MARKETS",
    headline:
      "Treasury yields rise after strong jobs data damps rate-cut hopes",
    positive: false,
  },
  {
    id: 11,
    time: "12:31 PM ET",
    category: "CRYPTO",
    headline: "Bitcoin holds above $67,000 as halving event draws near",
    positive: true,
  },
  {
    id: 12,
    time: "12:18 PM ET",
    category: "ECONOMY",
    headline:
      "Fed's Bowman says she needs to see 'several more months' of good inflation data before cuts",
    positive: null,
  },
  {
    id: 13,
    time: "12:04 PM ET",
    category: "MARKETS",
    headline:
      "Apple shares gain 2% after Morgan Stanley upgrades to overweight",
    positive: true,
  },
  {
    id: 14,
    time: "11:55 AM ET",
    category: "WORLD",
    headline:
      "ECB holds rates steady, hints at June cut if inflation keeps falling",
    positive: null,
  },
  {
    id: 15,
    time: "11:39 AM ET",
    category: "ENERGY",
    headline:
      "Oil prices slip as U.S. crude inventories rise more than expected",
    positive: false,
  },
  {
    id: 16,
    time: "11:22 AM ET",
    category: "TECH",
    headline:
      "Meta unveils Llama 3 open-source AI model, challenging OpenAI and Google",
    positive: true,
  },
  {
    id: 17,
    time: "11:08 AM ET",
    category: "POLITICS",
    headline:
      "Senate passes foreign aid package for Ukraine, Israel and Taiwan",
    positive: null,
  },
  {
    id: 18,
    time: "10:54 AM ET",
    category: "MARKETS",
    headline: "Bank of America raises S&P 500 year-end target to 5,400",
    positive: true,
  },
  {
    id: 19,
    time: "10:40 AM ET",
    category: "RETAIL",
    headline:
      "Gap reports surprise profit as Old Navy stabilizes — stock surges 14%",
    positive: true,
  },
  {
    id: 20,
    time: "10:26 AM ET",
    category: "HEALTH",
    headline: "FDA approves first CRISPR gene therapy for sickle cell disease",
    positive: null,
  },
  {
    id: 21,
    time: "10:12 AM ET",
    category: "AUTO",
    headline:
      "Tesla cuts prices globally for third time this year amid EV demand slowdown",
    positive: false,
  },
  {
    id: 22,
    time: "9:58 AM ET",
    category: "MARKETS",
    headline: "Dow opens sharply higher as megacap tech leads broad rally",
    positive: true,
  },
  {
    id: 23,
    time: "9:44 AM ET",
    category: "ECONOMY",
    headline: "Consumer sentiment hits 3-month high on improving jobs outlook",
    positive: true,
  },
  {
    id: 24,
    time: "9:30 AM ET",
    category: "MARKETS",
    headline: "U.S. stock futures point to strong open after jobs blowout",
    positive: true,
  },
];

export const newsGridSections = [
  {
    section: "Politics & Policy",
    color: "#003153",
    items: [
      {
        id: 30,
        headline:
          "House passes emergency foreign aid bill, sending it to Senate for final vote",
        time: "1h ago",
        image:
          "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&q=80",
      },
      {
        id: 31,
        headline:
          "Trump and Biden agree to two presidential debates ahead of November election",
        time: "2h ago",
        image: null,
      },
      {
        id: 32,
        headline:
          "Supreme Court takes up Trump immunity case, ruling expected by June",
        time: "3h ago",
        image: null,
      },
      {
        id: 33,
        headline:
          "Biden signs executive order on AI safety and national security",
        time: "4h ago",
        image: null,
      },
    ],
  },
  {
    section: "Technology",
    color: "#0a2463",
    items: [
      {
        id: 40,
        headline:
          "Apple delays rollout of AI features in Europe due to regulatory concerns",
        time: "30m ago",
        image:
          "https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&q=80",
      },
      {
        id: 41,
        headline:
          "Google fires 28 employees who protested company's cloud contract with Israel",
        time: "1h ago",
        image: null,
      },
      {
        id: 42,
        headline:
          "OpenAI considers going public after latest funding round values it at $86 billion",
        time: "2h ago",
        image: null,
      },
      {
        id: 43,
        headline:
          "Microsoft's Copilot AI assistant comes to more Office apps worldwide",
        time: "3h ago",
        image: null,
      },
    ],
  },
  {
    section: "Economy",
    color: "#1a3a5c",
    items: [
      {
        id: 50,
        headline:
          "Inflation holds near 3.5% in March, keeping Fed rate cuts further out of reach",
        time: "45m ago",
        image:
          "https://images.unsplash.com/photo-1607944024060-0450380ddd33?w=400&q=80",
      },
      {
        id: 51,
        headline:
          "U.S. trade deficit widens to $69 billion as imports surge on strong consumer demand",
        time: "2h ago",
        image: null,
      },
      {
        id: 52,
        headline:
          "Small business confidence falls to lowest level since 2012 on economic uncertainty",
        time: "3h ago",
        image: null,
      },
      {
        id: 53,
        headline:
          "Housing starts drop 14% in February as high mortgage rates cool construction",
        time: "4h ago",
        image: null,
      },
    ],
  },
  {
    section: "Energy & Climate",
    color: "#0d4c2f",
    items: [
      {
        id: 60,
        headline:
          "OPEC+ extends production cuts through June, pushing oil toward $90 a barrel",
        time: "1h ago",
        image:
          "https://images.unsplash.com/photo-1606159068539-43f36b99d1b2?w=400&q=80",
      },
      {
        id: 61,
        headline:
          "U.S. renewable energy capacity surpasses coal for first time in history",
        time: "2h ago",
        image: null,
      },
      {
        id: 62,
        headline:
          "ExxonMobil strikes $60 billion deal to acquire Pioneer Natural Resources",
        time: "3h ago",
        image: null,
      },
      {
        id: 63,
        headline:
          "Biden administration finalizes tough new vehicle emission standards targeting EVs",
        time: "4h ago",
        image: null,
      },
    ],
  },
];

export const watchlistItems = [
  {
    ticker: "AAPL",
    name: "Apple",
    price: "171.48",
    change: "+2.34%",
    positive: true,
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: "420.72",
    change: "+1.12%",
    positive: true,
  },
  {
    ticker: "NVDA",
    name: "Nvidia",
    price: "877.35",
    change: "+5.06%",
    positive: true,
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    price: "155.18",
    change: "+0.88%",
    positive: true,
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    price: "182.74",
    change: "+0.54%",
    positive: true,
  },
  {
    ticker: "META",
    name: "Meta",
    price: "502.30",
    change: "-0.72%",
    positive: false,
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    price: "171.05",
    change: "-3.45%",
    positive: false,
  },
  {
    ticker: "JPM",
    name: "JPMorgan",
    price: "198.88",
    change: "+1.23%",
    positive: true,
  },
];

export const topStories = [
  {
    id: 70,
    category: "INVESTING",
    headline:
      "Here's exactly what to buy as the S&P 500 enters bull market territory, according to top strategists",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
    time: "6 hours ago",
  },
  {
    id: 71,
    category: "REAL ESTATE",
    headline:
      "Mortgage rates hit 7.1% — the highest since November. Here's what experts say to do now",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    time: "7 hours ago",
  },
  {
    id: 72,
    category: "PERSONAL FINANCE",
    headline:
      "High-yield savings accounts are still paying over 5%. Here are the best rates right now",
    image:
      "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=600&q=80",
    time: "8 hours ago",
  },
  {
    id: 73,
    category: "TECH",
    headline:
      "Sam Altman's vision for OpenAI: 'We want AGI for all of humanity, not just a few'",
    image:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
    time: "9 hours ago",
  },
];

export const navCategories = [
  "Markets",
  "Business",
  "Investing",
  "Tech",
  "Politics",
  "World",
  "Finance",
  "Health & Science",
  "Media",
  "Real Estate",
  "Energy",
  "Climate",
  "Personal Finance",
];
