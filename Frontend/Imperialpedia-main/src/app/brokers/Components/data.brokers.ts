import { NewsArticle } from "@/lib/data.news";

export type Broker = {
  slug: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;

  tagline: string;
  description: string;

  bestFor: string[];

  pros: string[];
  cons: string[];

  features: {
    minDeposit: string;
    fees: string;
    accountTypes: string[];
  };
};

export const brokers: Broker[] = [
  {
    slug: "robinhood",
    name: "Robinhood",
    logo: "/logos/robinhood.png",
    rating: 4.5,
    reviewCount: 12000,

    tagline: "Best for beginners",
    description:
      "Robinhood is a commission-free trading platform ideal for beginners looking to invest in stocks, ETFs, and crypto.",

    bestFor: ["beginners", "mobile trading"],

    pros: [
      "Commission-free trading",
      "Easy-to-use interface",
      "No minimum deposit",
    ],
    cons: ["Limited research tools", "No mutual funds"],

    features: {
      minDeposit: "$0",
      fees: "No commission",
      accountTypes: ["Individual", "Retirement"],
    },
  },

  {
    slug: "interactive-brokers",
    name: "Interactive Brokers",
    logo: "/logos/ibkr.png",
    rating: 4.7,
    reviewCount: 9800,

    tagline: "Best for advanced traders",
    description:
      "Interactive Brokers offers powerful trading tools, low margin rates, and access to global markets.",

    bestFor: ["advanced traders", "global investing"],

    pros: ["Low margin rates", "Advanced tools", "Global market access"],
    cons: ["Complex interface", "Not beginner-friendly"],

    features: {
      minDeposit: "$0",
      fees: "Low commission",
      accountTypes: ["Individual", "Institutional"],
    },
  },

  {
    slug: "fidelity",
    name: "Fidelity",
    logo: "/logos/fidelity.png",
    rating: 4.6,
    reviewCount: 15000,

    tagline: "Best for long-term investing",
    description:
      "Fidelity is known for strong research tools, retirement planning, and zero-fee index funds.",

    bestFor: ["long-term investors", "retirement"],

    pros: ["Excellent research", "Zero-fee funds", "Strong customer support"],
    cons: ["Interface can feel outdated"],

    features: {
      minDeposit: "$0",
      fees: "No commission",
      accountTypes: ["IRA", "Individual"],
    },
  },
];

export const brokerGuides: NewsArticle[] = [
  {
    id: "guide-1",
    title: "What Is a Broker? A Complete Beginner’s Guide",
    excerpt:
      "Learn what brokers do, how they work, and how to choose the right one for your investing journey.",

    category: "Guides",
    author: {
      name: "Sameer Basnet",
      avatarUrl:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-15",
    updatedAt: "2026-03-16",
    readTimeMinutes: 8,

    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&auto=format",
    imageCaption: "Stock market charts representing broker activity",

    slug: "what-is-a-broker",
    featured: true,

    keyTakeaways: [
      "A broker connects investors to financial markets",
      "There are full-service and discount brokers",
      "Fees and tools vary widely",
      "Choosing depends on your goals",
    ],

    tags: ["broker", "investing", "beginner"],

    body: [
      {
        type: "paragraph",
        text: "A broker is a platform or individual that allows investors to buy and sell assets like stocks, ETFs, and bonds. Without brokers, access to financial markets would be extremely limited.",
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=1200&q=80&auto=format",
        caption: "Financial dashboards and trading analytics",
      },

      {
        type: "heading",
        text: "Types of Brokers",
      },

      {
        type: "subheading",
        text: "Full-Service vs Discount Brokers",
      },

      {
        type: "paragraph",
        text: "Full-service brokers provide investment advice and portfolio management, while discount brokers focus on low-cost trade execution with minimal support.",
      },

      {
        type: "list",
        items: [
          "Full-service brokers: advisory + portfolio management",
          "Discount brokers: low fees, self-directed trading",
          "Online brokers: fast and accessible platforms",
        ],
      },

      {
        type: "heading",
        text: "How Brokers Make Money",
      },

      {
        type: "paragraph",
        text: "Brokers earn revenue through commissions, spreads, and premium services. Some platforms advertise zero commission but monetize in indirect ways.",
      },

      {
        type: "quote",
        text: "If you're not paying for the product, you might be the product.",
        attribution: "Common Wall Street saying",
      },

      {
        type: "callout",
        text: "Always check hidden fees like spreads, withdrawal charges, and inactivity fees before choosing a broker.",
      },
    ],
  },

  
  {
    id: "guide-3",
    title: "How to Choose the Best Online Broker",
    excerpt:
      "A step-by-step guide to selecting the best broker based on fees, tools, and your investing style.",

    category: "Guides",
    author: {
      name: "Finance Editorial Team",
      avatarUrl:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-10",
    readTimeMinutes: 6,

    imageUrl:
      "https://images.unsplash.com/photo-1640161704729-cbe966a08476?w=1200&q=80&auto=format",
    imageCaption: "Comparing broker platforms and tools",

    slug: "choose-best-broker",

    keyTakeaways: [
      "Define your investing goals first",
      "Compare fees carefully",
      "Evaluate platform usability",
      "Check regulation and safety",
    ],

    tags: ["broker", "comparison", "trading"],

    body: [
      {
        type: "paragraph",
        text: "Choosing the right broker is one of the most important decisions for any investor. A good broker enhances your experience, while a bad one creates unnecessary friction.",
      },

      {
        type: "heading",
        text: "Step 1: Define Your Goals",
      },

      {
        type: "subheading",
        text: "Know Your Investing Style",
      },

      {
        type: "paragraph",
        text: "Beginners usually need simple platforms, while advanced traders require detailed analytics and tools.",
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1518186233392-c232efbf2373?w=1200&q=80&auto=format",
        caption: "Analyzing charts before choosing a broker",
      },

      {
        type: "heading",
        text: "Step 2: Compare Fees",
      },

      {
        type: "paragraph",
        text: "Don’t rely on marketing claims like 'zero commission'. Always check for hidden costs such as spreads, withdrawal fees, or inactivity penalties.",
      },

      {
        type: "callout",
        text: "Hidden fees are the fastest way to lose money without realizing it.",
      },

      {
        type: "heading",
        text: "Step 3: Tools & Features",
      },

      {
        type: "list",
        items: [
          "Charting tools",
          "Mobile trading apps",
          "Research reports",
          "Automation features",
        ],
      },

      {
        type: "heading",
        text: "Step 4: Safety & Regulation",
      },

      {
        type: "paragraph",
        text: "Always choose a broker regulated by a trusted authority. Regulation ensures transparency and protects your funds.",
      },
    ],
  },

  {
    id: "guide-4",
    title: "Broker Regulation and Safety: Protecting Your Investments",
    excerpt:
      "Understanding broker regulation, SIPC insurance, and how to protect your money when choosing a brokerage firm.",

    category: "Guides",
    author: {
      name: "Regulatory Compliance Expert",
      avatarUrl:
        "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-12",
    readTimeMinutes: 7,

    imageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&auto=format",
    imageCaption: "Secure financial documents and regulatory compliance",

    slug: "broker-regulation-safety",

    keyTakeaways: [
      "Always choose regulated brokers",
      "SIPC protects up to $500,000",
      "Check regulatory oversight carefully",
      "Diversify across multiple accounts",
      "Monitor account activity regularly",
    ],

    tags: ["regulation", "safety", "broker", "protection"],

    body: [
      {
        type: "paragraph",
        text: "Broker regulation ensures that your investments are protected and that brokers operate fairly. Understanding these protections is crucial for any investor.",
      },

      {
        type: "heading",
        text: "Key Regulatory Bodies",
      },

      {
        type: "list",
        items: [
          "SEC (Securities and Exchange Commission)",
          "FINRA (Financial Industry Regulatory Authority)",
          "SIPC (Securities Investor Protection Corporation)",
          "State regulators for additional oversight",
        ],
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80&auto=format",
        caption: "Regulatory compliance and financial security",
      },

      {
        type: "heading",
        text: "SIPC Insurance Coverage",
      },

      {
        type: "paragraph",
        text: "SIPC provides insurance coverage up to $500,000 per customer, including $250,000 for cash claims. This protects against broker insolvency, not market losses.",
      },

      {
        type: "callout",
        text: "SIPC insurance is not a substitute for FDIC insurance on bank deposits.",
      },

      {
        type: "heading",
        text: "Additional Protections",
      },

      {
        type: "paragraph",
        text: "Beyond SIPC, look for brokers with excess insurance and strong risk management practices.",
      },
    ],
  },
  {
    id: "guide-5",
    title: "Advanced Trading Tools: Platforms for Experienced Investors",
    excerpt:
      "Explore advanced trading platforms with sophisticated tools, real-time data, and professional-grade features for serious traders.",

    category: "Guides",
    author: {
      name: "Trading Technology Analyst",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-14",
    readTimeMinutes: 9,

    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&auto=format",
    imageCaption: "Advanced trading platforms and analytics",

    slug: "advanced-trading-tools",

    keyTakeaways: [
      "Advanced charting with technical indicators",
      "Real-time market data and news feeds",
      "Algorithmic trading capabilities",
      "Risk management tools",
      "Professional-grade execution speeds",
    ],

    tags: ["advanced", "trading", "tools", "professional"],

    body: [
      {
        type: "paragraph",
        text: "Advanced traders need powerful tools to analyze markets, execute complex strategies, and manage risk effectively. The right platform can make the difference.",
      },

      {
        type: "heading",
        text: "Essential Advanced Features",
      },

      {
        type: "list",
        items: [
          "Level 2 quotes and time & sales data",
          "Advanced charting with 100+ indicators",
          "Options trading tools and Greeks",
          "Portfolio analytics and risk metrics",
          "API access for algorithmic trading",
        ],
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format",
        caption: "Professional trading workstation setup",
      },

      {
        type: "heading",
        text: "Platform Performance",
      },

      {
        type: "paragraph",
        text: "Execution speed, reliability, and uptime are critical for advanced traders. Look for platforms with 99.9% uptime guarantees.",
      },

      {
        type: "callout",
        text: "Advanced tools come with higher costs, but they can provide significant advantages in competitive markets.",
      },
    ],
  },
  {
    id: "guide-6",
    title: "Crypto Brokers: Trading Digital Assets Safely",
    excerpt:
      "A comprehensive guide to choosing crypto brokers, understanding custody options, and navigating the volatile cryptocurrency market.",

    category: "Guides",
    author: {
      name: "Crypto Market Specialist",
      avatarUrl:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-16",
    readTimeMinutes: 8,

    imageUrl:
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&q=80&auto=format",
    imageCaption: "Cryptocurrency trading platforms",

    slug: "crypto-brokers-guide",

    keyTakeaways: [
      "Choose regulated crypto platforms",
      "Understand custody and security measures",
      "Be aware of high volatility risks",
      "Check withdrawal limits and fees",
      "Diversify across multiple assets",
    ],

    tags: ["crypto", "blockchain", "digital assets", "trading"],

    body: [
      {
        type: "paragraph",
        text: "Cryptocurrency trading requires specialized brokers with enhanced security features and regulatory compliance. The crypto market's volatility demands careful platform selection.",
      },

      {
        type: "heading",
        text: "Crypto-Specific Considerations",
      },

      {
        type: "list",
        items: [
          "Cold storage and multi-signature wallets",
          "Insurance coverage for digital assets",
          "Regulatory compliance (if applicable)",
          "Trading pairs and liquidity",
          "Staking and DeFi integration",
        ],
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80&auto=format",
        caption: "Blockchain technology and crypto security",
      },

      {
        type: "heading",
        text: "Risk Management",
      },

      {
        type: "paragraph",
        text: "Crypto markets can be extremely volatile. Use stop-loss orders, diversify holdings, and never invest more than you can afford to lose.",
      },

      {
        type: "callout",
        text: "Cryptocurrency investments are not insured by SIPC or FDIC. Platform security is your primary protection.",
      },
    ],
  },
  {
    id: "guide-7",
    title: "International Investing: Brokers for Global Markets",
    excerpt:
      "Access global markets with international brokers. Learn about ADRs, foreign exchanges, and cross-border investment strategies.",

    category: "Guides",
    author: {
      name: "Global Markets Correspondent",
      avatarUrl:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&q=80&auto=format",
    },

    publishedAt: "2026-03-18",
    readTimeMinutes: 10,

    imageUrl:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&q=80&auto=format",
    imageCaption: "Global financial markets and international trading",

    slug: "international-investing-brokers",

    keyTakeaways: [
      "Access to multiple global exchanges",
      "Currency conversion and forex tools",
      "ADR and GDR trading capabilities",
      "International research and data",
      "Tax implications of cross-border investing",
    ],

    tags: ["international", "global", "markets", "ADRs"],

    body: [
      {
        type: "paragraph",
        text: "International investing opens up vast opportunities but requires specialized brokers with global market access and currency expertise.",
      },

      {
        type: "heading",
        text: "Global Market Access",
      },

      {
        type: "list",
        items: [
          "Major exchanges: NYSE, NASDAQ, LSE, TSE",
          "Emerging markets: Shanghai, Mumbai, São Paulo",
          "European exchanges and Euronext",
          "Asian markets and trading hours",
        ],
      },

      {
        type: "image",
        url: "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=1200&q=80&auto=format",
        caption: "World map showing global financial centers",
      },

      {
        type: "heading",
        text: "Investment Vehicles",
      },

      {
        type: "paragraph",
        text: "Use ADRs (American Depositary Receipts) to invest in foreign companies without direct international trading accounts.",
      },

      {
        type: "callout",
        text: "Consider currency risk, tax treaties, and withholding taxes when investing internationally.",
      },

      {
        type: "heading",
        text: "Currency Considerations",
      },

      {
        type: "paragraph",
        text: "Exchange rate fluctuations can significantly impact returns. Some brokers offer hedging tools and multi-currency accounts.",
      },
    ],
  },
];
