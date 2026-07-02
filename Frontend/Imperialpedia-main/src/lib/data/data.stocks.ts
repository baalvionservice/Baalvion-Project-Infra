import { NewsAuthor, NewsBodyBlock, RelatedLink } from "../data.news";
import { StocksCategory } from "@/app/stocks/components/stocks-tab";

export interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StocksArticle {
  id: string;
  title: string;
  excerpt: string;
  category: StocksCategory;
  author: NewsAuthor;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  imageUrl: string;
  imageCaption?: string;
  slug: string;
  related?: RelatedLink[];
  featured?: boolean;
  keyTakeaways?: string[];
  body: NewsBodyBlock[];
  tags?: string[];
}

export interface StockPageData {
  featured: StocksArticle;
  latest: StocksArticle[];
  trendingStocks: StockItem[];
  guides: StocksArticle[];
  popularTags: string[];
}
export const stocksPageData: StockPageData = {
  featured: {
    id: "stock-featured-1",
    title: "Why NVIDIA Sits at the Center of the AI Infrastructure Trade",
    excerpt:
      "NVIDIA's data-center GPUs have become the default building block for AI training and inference. Here's what actually drives the stock, and the risks that come with that concentration.",
    category: "Growth Stocks",
    author: { name: "Lisa Tran", title: "Tech Stocks Reporter" },
    publishedAt: "2026-03-16T10:00:00Z",
    readTimeMinutes: 7,
    imageUrl:
      "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1200&q=80",
    slug: "nvidia-ai-rally",
    featured: true,
    tags: ["NVIDIA", "AI Stocks", "Semiconductors"],
    keyTakeaways: [
      "NVIDIA's data-center GPUs are the dominant hardware choice for training and running large AI models, giving it outsized pricing power in that segment.",
      "The company's software layer (CUDA) creates switching costs that go beyond the chips themselves, reinforcing its market position.",
      "Revenue is heavily concentrated among a small number of large cloud-computing customers, which is both a strength and a risk.",
      "High valuations mean the stock is pricing in continued rapid growth — any slowdown in AI infrastructure spending would hit the shares disproportionately hard.",
    ],
    body: [
      {
        type: "paragraph",
        text: "Few companies have become as synonymous with a single technology trend as NVIDIA has with artificial intelligence. What started as a graphics-chip maker for video games has, over the past decade, turned into the primary hardware supplier for the AI boom — and understanding why requires looking past the stock price to the actual mechanics of what the company sells and who buys it.",
      },
      { type: "heading", text: "What NVIDIA Actually Sells" },
      {
        type: "paragraph",
        text: "NVIDIA's core business today is data-center GPUs — specialized processors originally designed for rendering graphics that turned out to be extremely well-suited to the parallel math required to train and run large AI models. Cloud providers, research labs, and large enterprises buy these chips (often in clusters of thousands) to train models and to serve inference — the process of actually running a trained model to answer a query or generate an output. As AI adoption has expanded from research labs into mainstream cloud products, demand for this hardware has scaled with it.",
      },
      { type: "heading", text: "The Software Moat: CUDA" },
      {
        type: "paragraph",
        text: "What differentiates NVIDIA from other chipmakers isn't only the hardware — it's CUDA, the software platform developers use to program NVIDIA's GPUs. Because so much of the AI research and tooling ecosystem was built on top of CUDA over the past decade, switching to a competitor's chips often means rewriting significant amounts of software, not just swapping a part. That switching cost is a major reason NVIDIA has been able to command premium pricing and maintain a dominant market share even as competitors release chips with comparable raw specifications.",
      },
      { type: "heading", text: "Customer Concentration Is a Real Risk" },
      {
        type: "paragraph",
        text: "A meaningful share of NVIDIA's data-center revenue comes from a small number of very large cloud-computing customers. That concentration cuts both ways: it means NVIDIA benefits enormously when those customers are in an aggressive capital-expenditure cycle, but it also means the company's results are unusually sensitive to spending decisions made by just a handful of buyers. If even one or two major customers pause or slow their AI infrastructure buildout — whether due to a change in strategy, a shift toward developing their own custom chips, or a broader pullback in spending — the effect on NVIDIA's growth rate could be significant.",
      },
      {
        type: "callout",
        text: "Several of NVIDIA's largest customers are also investing in designing their own custom AI chips. This doesn't eliminate demand for NVIDIA's products, but it's a long-term competitive dynamic worth watching rather than dismissing.",
      },
      { type: "heading", text: "Valuation: Pricing in a Lot of Future Growth" },
      {
        type: "paragraph",
        text: "Because the market has treated NVIDIA as the clearest way to invest in the AI infrastructure buildout, the stock has typically traded at a premium valuation relative to the broader semiconductor sector. A premium valuation isn't inherently a red flag, but it does raise the bar: it means the market is already pricing in continued strong growth, so the stock's reaction to earnings tends to hinge less on whether results are good in absolute terms and more on whether they beat the already-high expectations baked into the share price. This is a common pattern for market-leading growth stocks, and it means volatility around earnings reports and major product announcements is a structural feature of owning the stock, not an anomaly.",
      },
      { type: "heading", text: "The Bigger Picture for Investors" },
      {
        type: "paragraph",
        text: "For investors considering exposure to the AI infrastructure theme, the honest framing is that NVIDIA represents a concentrated bet on a still-unfolding technology cycle — one with real, demonstrated revenue growth today, but also real customer-concentration and valuation risk. Investors who want AI exposure without single-stock concentration risk often use diversified technology or semiconductor sector funds instead, which spread exposure across multiple companies in the supply chain (chip designers, foundries, cloud providers, and software companies) rather than relying on the fortunes of any single company.",
      },
    ],
  },

  latest: [
    {
      id: "stock-1",
      title: "What Actually Drives Tesla's Stock Price",
      excerpt:
        "Tesla trades less like a traditional automaker and more like a growth-and-story stock. Here's what really moves the shares — delivery numbers, margins, and the bets on energy and autonomy.",
      category: "Trending Stocks",
      author: { name: "Priya Shenoy", title: "Auto & EV Markets Reporter" },
      publishedAt: "2026-03-16T08:00:00Z",
      readTimeMinutes: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=80",
      slug: "tesla-stock-jump",
      keyTakeaways: [
        "Quarterly vehicle delivery numbers are the single most-watched data point, since they're the clearest proxy for near-term revenue.",
        "Automotive gross margin matters as much as delivery volume — price cuts that boost unit sales can still hurt profitability.",
        "A meaningful part of Tesla's valuation reflects bets on energy storage and autonomous driving, not just car sales.",
        "The stock has historically been far more volatile than the broader auto sector, reflecting its growth-stock characterization.",
      ],
      body: [
        {
          type: "paragraph",
          text: "Tesla is unusual among automakers in that its stock rarely trades purely on traditional auto-industry metrics like unit sales or dealer inventory. Instead, the shares tend to move on a mix of delivery numbers, profitability trends, and the market's evolving view of Tesla's bets beyond car manufacturing.",
        },
        { type: "heading", text: "Deliveries: The Headline Number" },
        {
          type: "paragraph",
          text: "Every quarter, Tesla reports how many vehicles it delivered to customers — a figure investors treat as the closest available proxy for revenue before the full earnings report arrives. Delivery numbers that beat or miss analyst expectations tend to move the stock immediately, often before the underlying reasons (production changes, demand shifts, or logistics timing) are fully understood.",
        },
        { type: "heading", text: "Margins Matter as Much as Volume" },
        {
          type: "paragraph",
          text: "Selling more cars isn't automatically good news for the stock if it comes at the cost of profitability. Tesla has periodically cut vehicle prices to stimulate demand and defend market share against a growing field of EV competitors, and each round of price cuts raises the same question for analysts: are unit sales growing fast enough to offset the hit to gross margin per vehicle? A quarter with record deliveries but shrinking margins can disappoint the market just as much as a quarter with a delivery miss.",
        },
        { type: "heading", text: "The Non-Auto Bets Baked Into the Valuation" },
        {
          type: "paragraph",
          text: "Tesla's valuation has historically traded at a significant premium to traditional automakers, and that premium reflects more than just car sales. Energy storage products (batteries for homes, businesses, and grid-scale installations) and the company's ongoing investment in autonomous-driving software are both frequently cited by bulls as options on future revenue streams that don't yet show up meaningfully in the income statement. Skeptics counter that these businesses remain small relative to the automotive segment today, and that the stock's premium assumes execution on ambitious timelines that have, in the past, often slipped.",
        },
        {
          type: "callout",
          text: "Because so much of the investment case rests on future execution rather than current earnings, Tesla shares have historically shown significantly higher volatility than the broader stock market — a pattern investors should factor into position sizing regardless of their view on the company's long-term prospects.",
        },
      ],
    },
    {
      id: "stock-2",
      title: "Apple's Stock Story: Services, Not Just iPhones",
      excerpt:
        "Apple's stock has increasingly decoupled from any single product cycle. Here's why the Services segment has become the metric analysts watch most closely.",
      category: "Value Stocks",
      author: { name: "Marcus Whitfield", title: "Consumer Tech Reporter" },
      publishedAt: "2026-03-16T07:00:00Z",
      readTimeMinutes: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=1200&q=80",
      slug: "apple-stock-steady",
      keyTakeaways: [
        "iPhone sales are still Apple's largest single revenue source, but they now grow much more slowly than in the company's early years.",
        "The Services segment (App Store, subscriptions, AppleCare, advertising) carries far higher margins and has become the primary growth driver analysts track.",
        "Apple's enormous, recurring capital-return program (dividends and buybacks) is a core part of the investment case, not a side note.",
        "Regulatory scrutiny of the App Store's fees and rules is a genuine risk to the Services growth story.",
      ],
      body: [
        {
          type: "paragraph",
          text: "Apple's stock is often discussed in the context of its newest iPhone, but the more useful lens for understanding what actually moves the shares is the growing weight of its Services segment — and the capital-return program that has made Apple one of the largest repurchasers of its own stock in corporate history.",
        },
        { type: "heading", text: "iPhone Still Anchors Revenue — Growth, Less So" },
        {
          type: "paragraph",
          text: "The iPhone remains Apple's single largest product line by revenue, and a strong or weak launch cycle still matters for the stock. But iPhone unit growth has slowed considerably compared to the smartphone's early-adoption years, simply because the global smartphone market itself has matured. That slower growth rate is a big part of why analysts have shifted their attention toward the parts of Apple's business that are still expanding quickly.",
        },
        { type: "heading", text: "Why Services Gets Outsized Attention" },
        {
          type: "paragraph",
          text: "Apple's Services segment — the App Store, Apple Music, iCloud, AppleCare, advertising, and licensing deals with other companies — carries substantially higher profit margins than hardware sales. Because Services revenue is also recurring (subscriptions renew monthly or annually) rather than tied to a single purchase, it provides a more predictable earnings stream. Each quarter, the growth rate of Services revenue tends to influence the stock's reaction to earnings as much as, or more than, iPhone unit sales.",
        },
        { type: "heading", text: "The Capital-Return Machine" },
        {
          type: "paragraph",
          text: "Apple generates enormous free cash flow, and a significant portion of the investment case for the stock rests on what the company does with it: large, sustained share buybacks and a growing dividend. Consistent buybacks reduce the number of shares outstanding over time, which can support earnings-per-share growth even in years when overall net income growth is modest — a dynamic long-term shareholders often weigh alongside the underlying business trends.",
        },
        {
          type: "callout",
          text: "Regulatory and legal challenges to App Store fees and policies in multiple jurisdictions are a genuine risk to the Services growth narrative, since Services margins depend heavily on the commission structure Apple currently controls.",
        },
        {
          type: "paragraph",
          text: "Taken together, Apple's stock behaves less like a pure hardware cyclical and more like a hybrid: a large, slower-growing hardware business paired with a smaller but faster-growing, higher-margin services business, wrapped in one of the most aggressive capital-return programs of any public company.",
        },
      ],
    },
    {
      id: "stock-3",
      title: "How AWS Became the Profit Engine Behind Amazon's Stock",
      excerpt:
        "Amazon's retail business generates the bulk of its revenue, but its cloud unit, AWS, generates the bulk of its profit. That split explains most of what moves the stock.",
      category: "Tech Stocks",
      author: { name: "Daniela Kroft", title: "Cloud & E-Commerce Reporter" },
      publishedAt: "2026-03-15T18:00:00Z",
      readTimeMinutes: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80",
      slug: "amazon-cloud-growth",
      keyTakeaways: [
        "Amazon's retail (online store) segment produces the majority of company revenue but operates on thin margins.",
        "AWS, the cloud-computing division, is a smaller share of revenue but historically has generated a disproportionate share of operating profit.",
        "Because of that split, AWS growth and margin trends tend to move the stock more than headline retail sales figures do.",
        "Competition from Microsoft Azure and Google Cloud is the primary long-term risk to AWS's profitability.",
      ],
      body: [
        {
          type: "paragraph",
          text: "Amazon is often thought of first as an online retailer, and by revenue, that's accurate — the online store and third-party marketplace make up the largest share of the top line. But understanding what actually drives Amazon's stock requires looking at profit, not just revenue, and by that measure the picture looks very different.",
        },
        { type: "heading", text: "Retail: High Revenue, Thin Margins" },
        {
          type: "paragraph",
          text: "Amazon's retail operations — everything from warehousing to delivery logistics to customer service — are capital-intensive and historically operate on relatively thin margins, typical of the broader retail and logistics industry. Retail revenue growth still matters to the story, particularly as an indicator of consumer spending health and market share, but it isn't where most of Amazon's profit is generated.",
        },
        { type: "heading", text: "AWS: Smaller Revenue Share, Outsized Profit Share" },
        {
          type: "paragraph",
          text: "Amazon Web Services, the company's cloud-computing division, represents a meaningfully smaller share of total revenue than the retail business — but it has historically generated a disproportionate share of Amazon's total operating income, thanks to much higher margins typical of cloud infrastructure businesses. That's why, on earnings day, analysts and the stock price often react far more to AWS's growth rate and margin trend than to headline retail sales figures, even though retail is the larger business by revenue.",
        },
        {
          type: "callout",
          text: "This is a common pattern for diversified tech companies: the segment that dominates the income statement isn't always the one that dominates investor attention. Profit contribution, not revenue share, is usually the better predictor of what moves the stock.",
        },
        { type: "heading", text: "The Competitive Landscape" },
        {
          type: "paragraph",
          text: "AWS operates in a genuinely competitive cloud infrastructure market alongside Microsoft Azure and Google Cloud, both of which have gained share in recent years, partly by bundling cloud services with other enterprise software products. Continued price competition or a slowdown in enterprise cloud spending are the main risks analysts cite to AWS's historically strong margins, which is why AWS growth and margin commentary from management tends to carry outsized weight in how the market reacts to Amazon's results.",
        },
      ],
    },
    {
      id: "stock-4",
      title: "Alphabet's Balancing Act: Search Cash Flow Funding Future Bets",
      excerpt:
        "Google Search still funds nearly everything Alphabet does. Here's how that cash flow gets allocated across Cloud, YouTube, and long-term projects — and the risks to the core business.",
      category: "Tech Stocks",
      author: { name: "Daniela Kroft", title: "Cloud & E-Commerce Reporter" },
      publishedAt: "2026-03-15T18:00:00Z",
      readTimeMinutes: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
      slug: "google-search-cloud-growth",
      keyTakeaways: [
        "Search and network advertising remain Alphabet's dominant profit source, funding investment across the rest of the company.",
        "Google Cloud has grown into a meaningful, increasingly profitable segment, though it trails AWS and Azure in market share.",
        "YouTube's advertising and subscription revenue is a significant, separately disclosed growth driver.",
        "The rise of AI-driven search competitors is the most-discussed long-term risk to Alphabet's core advertising business.",
      ],
      body: [
        {
          type: "paragraph",
          text: "Alphabet's stock story starts with a simple fact: Google Search and the broader advertising network remain the company's dominant source of profit, generating the cash flow that funds everything else Alphabet invests in, from Cloud infrastructure to long-term projects housed outside the core business.",
        },
        { type: "heading", text: "Search Advertising: The Foundation" },
        {
          type: "paragraph",
          text: "Search advertising revenue is closely tied to overall economic conditions, since advertising budgets are often among the first things businesses cut during a slowdown and among the first they expand during growth periods. That sensitivity to the broader economy is one reason Alphabet's stock can react sharply to macroeconomic data, even when nothing company-specific has changed.",
        },
        { type: "heading", text: "Cloud Is Catching Up, Slowly" },
        {
          type: "paragraph",
          text: "Google Cloud has grown from a distant third player into a meaningfully sized, increasingly profitable segment, though it still trails Amazon Web Services and Microsoft Azure in overall market share. Cloud's swing from years of operating losses to sustained profitability was a significant milestone for the stock, since it demonstrated the segment could eventually stand on its own rather than being purely a strategic, cash-consuming investment funded by search profits.",
        },
        { type: "heading", text: "YouTube and the Long-Term Bets" },
        {
          type: "paragraph",
          text: "YouTube's advertising and subscription revenue is disclosed separately and has become a significant growth driver in its own right, competing directly with other video and social platforms for ad dollars. Beyond these core segments, Alphabet also funds a range of longer-horizon projects — often grouped under 'Other Bets' in its reporting — that represent higher-risk, potentially higher-reward investments funded by the profitability of the core advertising business.",
        },
        {
          type: "callout",
          text: "The most frequently discussed long-term risk to Alphabet's core business is the rise of AI-powered answer engines and chat-based assistants that could change how people search for information — potentially reducing the traditional search-ad impressions Google has monetized for two decades. How Alphabet integrates AI into Search itself, without cannibalizing its own advertising revenue, is one of the central questions analysts are watching.",
        },
      ],
    },
  ],

  trendingStocks: [
    {
      symbol: "NVDA",
      name: "NVIDIA",
      price: 920,
      change: 25,
      changePercent: 2.8,
    },
    {
      symbol: "TSLA",
      name: "Tesla",
      price: 240,
      change: 14,
      changePercent: 6.1,
    },
    {
      symbol: "AAPL",
      name: "Apple",
      price: 182,
      change: -1.2,
      changePercent: -0.6,
    },
    {
      symbol: "AMZN",
      name: "Amazon",
      price: 178,
      change: 3.5,
      changePercent: 2.0,
    },
    {
      symbol: "MSFT",
      name: "Microsoft",
      price: 410,
      change: 5.2,
      changePercent: 1.3,
    },
  ],

  guides: [
    {
      id: "guide-1",
      title: "How to Start Investing in Stocks for Beginners",
      excerpt: "A simple guide to entering the stock market.",
      category: "Top Stocks",
      author: { name: "Finance Guide" },
      publishedAt: "2026-03-10T10:00:00Z",
      readTimeMinutes: 6,
      imageUrl:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80",
      slug: "investing-for-beginners",
      body: [
        {
          type: "paragraph",
          text: "Getting started with stocks is easier than you think...",
        },
      ],
    },
    {
      id: "guide-2",
      title: "What Is a Stock? Definition and Examples",
      excerpt: "Understand what stocks are and how they work.",
      category: "Growth Stocks",
      author: { name: "Finance Guide" },
      publishedAt: "2026-03-09T10:00:00Z",
      readTimeMinutes: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1569025690938-a00729c9e1df?w=1200&q=80",
      slug: "what-is-stock",
      body: [
        {
          type: "paragraph",
          text: "Stocks represent ownership in a company...",
        },
      ],
    },
  ],

  popularTags: [
    "Tech Stocks",
    "Dividend Stocks",
    "Growth Stocks",
    "Value Investing",
    "Stock Market Basics",
    "Day Trading",
  ],
};
