import { ApiResponse, SubscriptionTier, PremiumState, PremiumReport, PremiumAnalytics, MockPaymentStatus, BacktestingTool, PremiumDashboardData, PortfolioDeepDiveData, ScreenerDashboardData, BacktestDashboardData, MarketHeatmapData } from '@/types/premium';

/**
 * @fileOverview Mock service for managing subscription tiers, premium reports, and advanced analytics.
 */

const mockSubscriptionPlans = [
  { plan_name: "Free", price: 0, features: ["Access to basic content", "Limited calculators"] },
  { plan_name: "Pro", price: 29.99, features: ["Full content access", "Advanced calculators", "AI portfolio insights"] },
  { plan_name: "Enterprise", price: 99.99, features: ["Team accounts", "API access", "Custom reports"] }
];

const mockTiers: SubscriptionTier[] = [
  {
    id: 'tier-free',
    name: 'Free',
    plan_name: 'Free',
    description: 'Foundational access for retail learners.',
    priceMonthly: '$0',
    price: 0,
    priceYearly: '$0',
    features: mockSubscriptionPlans[0].features,
    color: 'primary'
  },
  {
    id: 'tier-pro',
    name: 'Pro',
    plan_name: 'Pro',
    description: 'The definitive suite for serious analysts.',
    priceMonthly: '$29.99',
    price: 29.99,
    priceYearly: '$299',
    features: mockSubscriptionPlans[1].features,
    isPopular: true,
    color: 'secondary'
  },
  {
    id: 'tier-enterprise',
    name: 'Enterprise',
    plan_name: 'Enterprise',
    description: 'Institutional-grade research infrastructure.',
    priceMonthly: '$99.99',
    price: 99.99,
    priceYearly: '$999',
    features: mockSubscriptionPlans[2].features,
    color: 'emerald'
  }
];

export const getSubscriptionTiers = async (): Promise<ApiResponse<SubscriptionTier[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockTiers,
    status: 200,
  };
};

export const getPremiumState = async (): Promise<ApiResponse<PremiumState>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: {
      tiers: mockTiers,
      subscription_plans: mockSubscriptionPlans,
      activeTier: 'tier-pro', 
      trialInfo: {
        available: true,
        durationDays: 14
      }
    },
    status: 200
  };
};

const mockReports: PremiumReport[] = [
  {
    id: 'rep-1',
    report_name: "AI Portfolio Deep Dive",
    description: "Mock analysis of asset allocation and risk weightings across indexed nodes.",
    date: "2026-03-15",
    download_link: "mock_link",
    type: "summary",
    category: "Tactical Research",
    data: [
      { protocol: "Tech Growth Cluster", apy: "+12.4%" },
      { protocol: "Fixed Income Hedge", apy: "+4.2%" },
      { protocol: "Liquidity Buffer", apy: "0.5%" }
    ]
  },
  {
    id: 'rep-2',
    report_name: "Historical Sentiment Chart",
    description: "Mock sentiment analysis over time correlated with primary market price action.",
    date: "2026-03-14",
    download_link: "mock_link",
    type: "chart",
    category: "Market Audit",
    data: [
      { asset: "NVDA", value: 85 },
      { asset: "AAPL", value: 62 },
      { asset: "MSFT", value: 58 },
      { asset: "BTC", value: 74 }
    ]
  },
  {
    id: 'rep-3',
    report_name: "Sector Rotation Matrix",
    description: "Identifying capital migration from defensive to cyclical nodes.",
    date: "2026-03-12",
    download_link: "mock_link",
    type: "table",
    category: "Institutional",
    data: [
      { sector: "Technology", performance: "+15.2%", volatility: "Low" },
      { sector: "Energy", performance: "-2.1%", volatility: "Medium" },
      { sector: "Consumer Staples", performance: "+1.4%", volatility: "Low" }
    ]
  }
];

export const getPremiumReports = async (): Promise<ApiResponse<PremiumReport[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockReports,
    status: 200,
  };
};

const mockBacktestingTools: BacktestingTool[] = [
  {
    strategy_name: "Mock Strategy 1",
    parameters: { entry_rule: "RSI < 30", exit_rule: "RSI > 70" },
    results: { total_return: "12%", max_drawdown: "5%", performance_chart: "mock_chart_placeholder" }
  },
  {
    strategy_name: "Mock Strategy 2",
    parameters: { entry_rule: "SMA 50 Cross Above SMA 200", exit_rule: "Trailing Stop 5%" },
    results: { total_return: "8%", max_drawdown: "3%", performance_chart: "mock_chart_placeholder" }
  }
];

export const getPremiumAnalytics = async (): Promise<ApiResponse<PremiumAnalytics[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  return {
    data: [
      {
        type: "portfolio_deep_dive",
        summary: "Your portfolio shows a high concentration in large-cap technology (45%), which has provided 2.4x the benchmark yield this cycle."
      },
      {
        type: "historical_sentiment",
        data: dates.map(date => ({
          date,
          sentiment_score: Math.floor(Math.random() * 40) + 30,
          price_index: Math.floor(Math.random() * 1000) + 5000
        }))
      },
      {
        type: "backtesting",
        backtesting_tools: mockBacktestingTools
      }
    ],
    status: 200
  };
};

/**
 * Prompt 54: Premium Dashboard Mock API
 */
const mockPremiumDashboardData: PremiumDashboardData = {
  analytics_kpis: [
    { metric: "Active Users", value: 1250, trend: "mock_up" },
    { metric: "New Subscriptions", value: 320, trend: "mock_down" },
    { metric: "Revenue", value: "$12,500", trend: "mock_up" },
    { metric: "Conversion Rate", value: "4.8%", trend: "mock_stable" }
  ],
  reports: [
    { report_name: "Weekly Revenue", type: "PDF", status: "mock_ready", last_generated: "2026-03-15 08:00" },
    { report_name: "Monthly Subscription Trends", type: "CSV", status: "mock_ready", last_generated: "2026-03-14 18:00" },
    { report_name: "Feature Usage Audit", type: "PDF", status: "mock_generating", last_generated: "Processing..." }
  ],
  advanced_metrics: [
    { metric: "Churn Rate", value: "3%", segment: "All Plans" },
    { metric: "Retention Rate", value: "92%", segment: "Premium Plan" },
    { metric: "LTV", value: "$450", segment: "New Users" },
    { metric: "Avg. Session Depth", value: "12.4m", segment: "Pro Tier" }
  ],
  growth_chart_data: Array.from({ length: 12 }, (_, i) => ({
    date: `Month ${i + 1}`,
    revenue: 8000 + Math.random() * 5000,
    users: 800 + Math.random() * 600
  }))
};

export const getPremiumDashboardData = async (): Promise<ApiResponse<PremiumDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockPremiumDashboardData,
    status: 200,
  };
};

/**
 * Prompt 55: AI Portfolio Deep Dive Mock API
 */
const mockPortfolioDeepDiveData: PortfolioDeepDiveData = {
  portfolio_summary: {
    total_value: "$125,000",
    allocation: { "Stocks": "60%", "Bonds": "25%", "Crypto": "10%", "Cash": "5%" },
    profit_loss: "$3,500",
    risk_score: "Moderate"
  },
  assets: [
    { 
      name: "Apple Inc.", 
      ticker: "AAPL", 
      current_price: "$175", 
      allocation: "20%", 
      "P&L": "$500", 
      ai_insights: { 
        bull_case: "mock_up", 
        bear_case: "mock_neutral", 
        risk_alert: "mock_none" 
      } 
    },
    { 
      name: "Bitcoin", 
      ticker: "BTC", 
      current_price: "$64,200", 
      allocation: "10%", 
      "P&L": "$1,200", 
      ai_insights: { 
        bull_case: "mock_up", 
        bear_case: "mock_down", 
        risk_alert: "mock_warning" 
      } 
    },
    { 
      name: "Tesla Inc.", 
      ticker: "TSLA", 
      current_price: "$175", 
      allocation: "15%", 
      "P&L": "-$240", 
      ai_insights: { 
        bull_case: "mock_neutral", 
        bear_case: "mock_down", 
        risk_alert: "mock_critical" 
      } 
    },
    { 
      name: "Vanguard S&P 500", 
      ticker: "VOO", 
      current_price: "$475", 
      allocation: "25%", 
      "P&L": "$1,850", 
      ai_insights: { 
        bull_case: "mock_up", 
        bear_case: "mock_neutral", 
        risk_alert: "mock_none" 
      } 
    }
  ],
  risk_diversification: {
    diversification_score: "85%",
    sector_exposure: { "Tech": "50%", "Finance": "30%", "Healthcare": "20%" },
    asset_correlation: { "AAPL-BTC": "0.12", "AAPL-GOOG": "0.75" }
  }
};

export const getPortfolioDeepDiveData = async (): Promise<ApiResponse<PortfolioDeepDiveData>> => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    data: mockPortfolioDeepDiveData,
    status: 200,
  };
};

/**
 * Prompt 56: Advanced Asset Screeners & Strategy Builder Mock API
 */
const mockScreenerData: ScreenerDashboardData = {
  screeners: [
    { name: "High Momentum Stocks", filters: ["Momentum > 80", "Volume > 1M"], results: 42, last_run: "2 hours ago" },
    { name: "Bullish Social Sentiment", filters: ["Sentiment Score > 75"], results: 28, last_run: "1 hour ago" },
    { name: "Undervalued Growth", filters: ["P/E < 15", "Revenue Growth > 20%"], results: 15, last_run: "4 hours ago" },
    { name: "High Dividend Yield", filters: ["Yield > 4%", "Payout Ratio < 60%"], results: 34, last_run: "Yesterday" }
  ],
  assets: [
    { name: "Apple Inc.", symbol: "AAPL", price: "175.20", market_cap: "2.8T", change_24h: "+1.2%", volume: "90M", sentiment: 72, momentum: 85 },
    { name: "Tesla Inc.", symbol: "TSLA", price: "245.50", market_cap: "780B", change_24h: "+2.4%", volume: "65M", sentiment: 81, momentum: 88 },
    { name: "NVIDIA Corp", symbol: "NVDA", price: "875.25", market_cap: "2.1T", change_24h: "+5.2%", volume: "45M", sentiment: 92, momentum: 95 },
    { name: "Microsoft", symbol: "MSFT", price: "415.50", market_cap: "3.1T", change_24h: "+0.8%", volume: "22M", sentiment: 68, momentum: 74 },
    { name: "Alphabet Inc", symbol: "GOOGL", price: "155.30", market_cap: "1.9T", change_24h: "-1.1%", volume: "18M", sentiment: 55, momentum: 62 },
    { name: "Amazon.com", symbol: "AMZN", price: "178.40", market_cap: "1.8T", change_24h: "+1.5%", volume: "35M", sentiment: 78, momentum: 81 }
  ],
  strategies: [
    { strategy_name: "Oversold Bounce", conditions: ["RSI < 30", "Sentiment Score > 60"], status: "mock_active" },
    { strategy_name: "Volume Breakout", conditions: ["Volume > 2x Avg", "Price > 200 EMA"], status: "mock_active" },
    { strategy_name: "Dividend Fortress", conditions: ["Yield > 3.5%", "Debt/Equity < 0.5"], status: "mock_inactive" }
  ]
};

export const getScreenerDashboardData = async (): Promise<ApiResponse<ScreenerDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockScreenerData,
    status: 200,
  };
};

/**
 * Prompt 57: Backtesting Engine Mock API
 */
const mockBacktestData: BacktestDashboardData = {
  backtest_summary: {
    total_return: "42%",
    annual_return: "18%",
    max_drawdown: "-12%",
    win_rate: "61%",
    sharpe_ratio: "1.45",
    total_trades: 84,
    best_trade: "+15.2%",
    worst_trade: "-8.4%",
    profit_factor: "1.82",
    long_win_rate: "65%",
    short_win_rate: "54%"
  },
  strategy_conditions: [
    { indicator: "RSI", operator: "<", value: "30" },
    { indicator: "MA50", operator: ">", value: "MA200" }
  ],
  trade_history: [
    { trade_id: "T001", asset: "AAPL", entry_date: "2024-01-10", exit_date: "2024-01-25", entry_price: 150, exit_price: 165, profit: "+$1,500", return: "10%" },
    { trade_id: "T002", asset: "TSLA", entry_date: "2024-02-05", exit_date: "2024-02-12", entry_price: 220, exit_price: 205, profit: "-$1,200", return: "-6%" },
    { trade_id: "T003", asset: "NVDA", entry_date: "2024-03-01", exit_date: "2024-03-10", entry_price: 800, exit_price: 875, profit: "+$7,500", return: "9.3%" },
    { trade_id: "T004", asset: "MSFT", entry_date: "2024-03-12", exit_date: "2024-03-15", entry_price: 410, exit_price: 415, profit: "+$500", return: "1.2%" },
    { trade_id: "T005", asset: "BTC", entry_date: "2024-02-20", exit_date: "2024-03-05", entry_price: 52000, exit_price: 64000, profit: "+$12,000", return: "23%" }
  ],
  equity_curve: Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: 10000 + (i * 200) + (Math.random() * 1000)
  })),
  drawdown_chart: Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: Math.max(0, Math.random() * -10)
  })),
  monthly_heatmap: [
    { month: 'Jan', year: 2024, return: 4.2 },
    { month: 'Feb', year: 2024, return: -1.5 },
    { month: 'Mar', year: 2024, return: 8.4 },
    { month: 'Apr', year: 2024, return: 2.1 },
    { month: 'May', year: 2024, return: 0.5 },
    { month: 'Jun', year: 2024, return: -2.8 }
  ],
  saved_backtests: [
    { name: "RSI Oversold Bounce", last_tested: "2024-03-15", asset: "AAPL" },
    { name: "MA Crossover Alpha", last_tested: "2024-03-12", asset: "BTC" },
    { name: "Sentiment Surge", last_tested: "2024-03-10", asset: "TSLA" }
  ]
};

export const getBacktestData = async (): Promise<ApiResponse<BacktestDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: mockBacktestData,
    status: 200,
  };
};

/**
 * Prompt 58: Institutional Market Heatmap Mock API
 */
const mockHeatmapData: MarketHeatmapData = {
  sectors: [
    { name: "Technology", change: "+2.4%", market_cap: "12T", color: "green", weight: 45 },
    { name: "Financials", change: "-0.8%", market_cap: "5T", color: "light_red", weight: 20 },
    { name: "Healthcare", change: "+0.5%", market_cap: "4.2T", color: "light_green", weight: 15 },
    { name: "Energy", change: "+1.1%", market_cap: "3T", color: "light_green", weight: 10 },
    { name: "Consumer Disc.", change: "+1.8%", market_cap: "2.8T", color: "green", weight: 8 },
    { name: "Real Estate", change: "-2.4%", market_cap: "1.2T", color: "red", weight: 5 }
  ],
  stocks: [
    { symbol: "AAPL", name: "Apple Inc.", change: "+1.5%", market_cap: "2.8T", weight: 35 },
    { symbol: "MSFT", name: "Microsoft", change: "+2.1%", market_cap: "2.6T", weight: 30 },
    { symbol: "NVDA", name: "NVIDIA Corp", change: "+5.2%", market_cap: "2.1T", weight: 20 },
    { symbol: "GOOGL", name: "Alphabet Inc", change: "+0.8%", market_cap: "1.9T", weight: 15 }
  ],
  capital_flows: [
    { sector: "Technology", flow: "+4.2B", status: "inflow" },
    { sector: "Energy", flow: "+2.1B", status: "inflow" },
    { sector: "Financials", flow: "-1.5B", status: "outflow" },
    { sector: "Healthcare", flow: "-0.8B", status: "outflow" }
  ],
  regions: [
    { region: "North America", performance: "+1.8%", flow: "+12.4B", volume: "450B" },
    { region: "Europe", performance: "-0.4%", flow: "-2.1B", volume: "120B" },
    { region: "Asia-Pacific", performance: "+2.2%", flow: "+8.5B", volume: "310B" },
    { region: "Latin America", performance: "+0.5%", flow: "+0.8B", volume: "45B" }
  ]
};

export const getMarketHeatmapData = async (): Promise<ApiResponse<MarketHeatmapData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockHeatmapData,
    status: 200,
  };
};
