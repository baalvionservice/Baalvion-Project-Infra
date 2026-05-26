// Mock news data for development
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  image: string;
  source: string;
  publishedAt: string;
  category: string;
  url: string;
  content?: string;
}

export const mockNewsData: NewsArticle[] = [
  {
    id: "1",
    title: "Stock Market Hits Record High as Tech Shares Surge",
    description: "Major technology companies led the market rally today, with the S&P 500 reaching new all-time highs amid strong earnings reports.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop",
    source: "Market Watch",
    publishedAt: "2024-01-15T14:30:00Z",
    category: "Markets",
    url: "/news/stock-market-record-high",
    content: "The stock market reached unprecedented levels today as technology shares surged following better-than-expected quarterly earnings..."
  },
  {
    id: "2", 
    title: "Federal Reserve Signals Potential Rate Cut in Coming Months",
    description: "Fed officials hint at monetary policy adjustments as inflation shows signs of cooling across multiple sectors.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop",
    source: "Financial Times",
    publishedAt: "2024-01-15T13:15:00Z",
    category: "Economy",
    url: "/news/fed-rate-cut-signals",
    content: "Federal Reserve officials indicated today that interest rate cuts may be on the horizon as economic indicators suggest..."
  },
  {
    id: "3",
    title: "Bitcoin Surges Past $50,000 as Institutional Adoption Grows",
    description: "Cryptocurrency markets rally as major corporations announce Bitcoin treasury allocations and ETF approvals continue.",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop",
    source: "Crypto Daily",
    publishedAt: "2024-01-15T12:45:00Z",
    category: "Crypto",
    url: "/news/bitcoin-50k-surge",
    content: "Bitcoin crossed the $50,000 threshold today for the first time since 2023, driven by increased institutional adoption..."
  },
  {
    id: "4",
    title: "Major Bank Reports Strong Q4 Earnings Despite Economic Headwinds",
    description: "JPMorgan Chase beats analyst expectations with robust trading revenue and lower-than-expected loan losses.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",
    source: "Banking News",
    publishedAt: "2024-01-15T11:20:00Z",
    category: "Banking",
    url: "/news/bank-q4-earnings",
    content: "JPMorgan Chase reported fourth-quarter earnings that exceeded Wall Street expectations, posting strong results..."
  },
  {
    id: "5",
    title: "AI Startup Raises $500M in Series C Funding Round",
    description: "OpenAI competitor secures massive funding from venture capital firms, valuing the company at $5 billion.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    source: "TechCrunch",
    publishedAt: "2024-01-15T10:30:00Z",
    category: "Startups",
    url: "/news/ai-startup-funding",
    content: "A leading artificial intelligence startup announced today that it has raised $500 million in Series C funding..."
  },
  {
    id: "6",
    title: "Global Markets Mixed as Asian Stocks Decline",
    description: "European markets open higher while Asian indices close lower amid concerns over Chinese economic data.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop",
    source: "Reuters",
    publishedAt: "2024-01-15T09:15:00Z",
    category: "GlobalMarkets",
    url: "/news/global-markets-mixed",
    content: "Global financial markets showed mixed performance today as investors digested the latest economic data from China..."
  },
  {
    id: "7",
    title: "Housing Market Shows Signs of Recovery in Major Cities",
    description: "Real estate prices stabilize as mortgage rates decline and inventory levels improve across metropolitan areas.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop",
    source: "Real Estate Weekly",
    publishedAt: "2024-01-15T08:45:00Z",
    category: "RealEstate",
    url: "/news/housing-market-recovery",
    content: "The housing market is showing early signs of recovery in major metropolitan areas as mortgage rates continue to decline..."
  },
  {
    id: "8",
    title: "Personal Finance: 5 Investment Strategies for 2024",
    description: "Financial advisors share top recommendations for building wealth in the current economic environment.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=450&fit=crop",
    source: "Money Magazine",
    publishedAt: "2024-01-15T07:30:00Z",
    category: "PersonalFinance",
    url: "/news/investment-strategies-2024",
    content: "As we move through 2024, financial advisors are recommending several key investment strategies to help individuals..."
  }
];

// Generate more mock data for pagination
export function generateMockNews(page: number = 1, limit: number = 10): NewsArticle[] {
  const baseData = [...mockNewsData];
  const startIndex = (page - 1) * limit;
  
  // Generate additional articles if needed
  while (baseData.length < startIndex + limit) {
    const randomIndex = Math.floor(Math.random() * mockNewsData.length);
    const baseArticle = mockNewsData[randomIndex];
    const newId = `${baseArticle.id}-${baseData.length}`;
    
    baseData.push({
      ...baseArticle,
      id: newId,
      title: `${baseArticle.title} - Update ${baseData.length}`,
      publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random date within last week
    });
  }
  
  return baseData.slice(startIndex, startIndex + limit);
}

export function getMockNewsByCategory(category: string, page: number = 1, limit: number = 10): NewsArticle[] {
  const filtered = category === 'All' 
    ? mockNewsData 
    : mockNewsData.filter(article => article.category === category);
  
  const startIndex = (page - 1) * limit;
  return filtered.slice(startIndex, startIndex + limit);
}

export function searchMockNews(query: string, page: number = 1, limit: number = 10): NewsArticle[] {
  const filtered = mockNewsData.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.description.toLowerCase().includes(query.toLowerCase())
  );
  
  const startIndex = (page - 1) * limit;
  return filtered.slice(startIndex, startIndex + limit);
}

export function getMockNewsById(id: string): NewsArticle | null {
  return mockNewsData.find(article => article.id === id) || null;
}