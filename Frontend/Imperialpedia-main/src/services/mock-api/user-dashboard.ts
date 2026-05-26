import { ApiResponse } from '@/types';
import { UserDashboardData, UserPortfolioData, UserAlertsAndNotificationsData, UserPersonalizedData } from '@/types/user-system';

/**
 * @fileOverview Mock service for retrieving personalized user dashboard data.
 */

const generateHistory = (baseValue: number, variance: number = 1000) => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().split('T')[0],
      value: baseValue + (i * 200) + (Math.random() * variance)
    };
  });
};

export const getMockUserDashboard = async (): Promise<ApiResponse<UserDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  
  return {
    data: {
      user_details: {
        name: "Deepak Kumar",
        email: "allenkrewzz1@gmail.com",
        subscription_tier: "Pro",
        avatar: "https://picsum.photos/seed/deepak/200/200"
      },
      watchlists_overview: [
        { id: 'w1', asset: 'Bitcoin', symbol: 'BTC', currentValue: '$64,250.00', change: '+2.4%', isPositive: true, sentiment: 'Bullish' },
        { id: 'w2', asset: 'Apple Inc.', symbol: 'AAPL', currentValue: '$182.50', change: '-0.8%', isPositive: false, sentiment: 'Neutral' },
        { id: 'w3', asset: 'NVIDIA', symbol: 'NVDA', currentValue: '$875.20', change: '+5.2%', isPositive: true, sentiment: 'Bullish' },
      ],
      portfolio_summary: {
        total_value: "$52,450.00",
        gain_loss: "+$2,540.00",
        gain_loss_percent: "+5.1%",
        allocation: [
          { asset: 'Equities', percentage: 45, value: 23602 },
          { asset: 'Crypto', percentage: 35, value: 18357 },
          { asset: 'Fixed Income', percentage: 15, value: 7867 },
          { asset: 'Cash', percentage: 5, value: 2624 },
        ],
        history: generateHistory(45000)
      },
      saved_articles: [
        { id: 'art-1', title: 'Understanding Yield Curve Inversion', route: '/articles/understanding-yield-curve-inversion', category: 'Economics' },
        { id: 'art-5', title: 'Passive Income with Dividends', route: '/articles/dividend-income', category: 'Investing' },
      ],
      saved_calculators: [
        { id: 'calc-1', name: 'Compound Interest Engine', route: '/financial-tools/compound-interest', type: 'Growth' },
      ],
      activity_history: [
        { id: 'a1', action: 'Logged in from new device: Desktop Chrome', timestamp: '2024-03-12T10:30:00Z' },
      ],
      notifications: [
        { id: 'n1', type: 'alert', message: 'NVDA price up 5% in the last 24 hours.', read_status: false, date: '2024-03-12T09:00:00Z' },
      ],
      preferences: {
        dark_mode: true,
        beta_opt_in: true,
        custom_alerts: ["NVDA volume > 1M", "BTC sentiment bearish"]
      }
    },
    status: 200
  };
};

export const getMockUserPortfolio = async (): Promise<ApiResponse<UserPortfolioData>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  return {
    data: {
      watchlists: [
        {
          id: 'wg-1',
          name: 'Tech Alpha',
          assets: [
            { id: 'w1', asset: 'NVIDIA', symbol: 'NVDA', currentValue: '$875.20', change: '+5.2%', isPositive: true, sentiment: 'Bullish', volume: '12.4M' },
            { id: 'w2', asset: 'Microsoft', symbol: 'MSFT', currentValue: '$415.50', change: '+1.2%', isPositive: true, sentiment: 'Bullish', volume: '8.1M' },
            { id: 'w3', asset: 'Tesla', symbol: 'TSLA', currentValue: '$175.30', change: '-2.4%', isPositive: false, sentiment: 'Bearish', volume: '45.2M' },
          ]
        },
        {
          id: 'wg-2',
          name: 'Crypto Core',
          assets: [
            { id: 'w4', asset: 'Bitcoin', symbol: 'BTC', currentValue: '$64,250.00', change: '+2.4%', isPositive: true, sentiment: 'Bullish', volume: '2.4B' },
            { id: 'w5', asset: 'Ethereum', symbol: 'ETH', currentValue: '$3,450.00', change: '-1.2%', isPositive: false, sentiment: 'Neutral', volume: '1.1B' },
          ]
        }
      ],
      portfolio_summary: {
        total_value: "$52,450.00",
        total_gain_loss: "+$2,540.00",
        total_gain_loss_percent: "+5.1%",
        allocation: [
          { asset: 'Equities', percentage: 45, value: 23602 },
          { asset: 'Crypto', percentage: 35, value: 18357 },
          { asset: 'Fixed Income', percentage: 15, value: 7867 },
          { asset: 'Cash', percentage: 5, value: 2624 },
        ],
        performance_chart_data: generateHistory(45000)
      },
      alerts: [
        { id: 'al-1', asset: 'NVIDIA', type: 'price', threshold: '900', triggered: false, status: 'active', createdAt: '2024-03-10T10:00:00Z' },
        { id: 'al-2', asset: 'Bitcoin', type: 'sentiment', threshold: 'Bearish', triggered: false, status: 'inactive', createdAt: '2024-03-11T14:30:00Z' },
        { id: 'al-3', asset: 'Ethereum', type: 'volume', threshold: '2B', triggered: true, status: 'active', createdAt: '2024-03-12T09:15:00Z' },
      ],
      trade_history: [
        { id: 't-1', asset: 'BTC', type: 'Buy', price: '$62,100.00', quantity: '0.05', date: '2024-03-05T10:30:00Z' },
        { id: 't-2', asset: 'NVDA', type: 'Buy', price: '$820.00', quantity: '10', date: '2024-03-01T14:20:00Z' },
        { id: 't-3', asset: 'AAPL', type: 'Sell', price: '$185.00', quantity: '25', date: '2024-02-25T09:15:00Z' },
      ]
    },
    status: 200
  };
};

export const getMockUserAlertsAndNotifications = async (): Promise<ApiResponse<UserAlertsAndNotificationsData>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: {
      alerts: [
        { id: 'al-1', type: "price", asset: "XYZ Corp", threshold: 60, status: "active" },
        { id: 'al-2', type: "volume", asset: "ABC Inc", threshold: 50000, status: "inactive" },
        { id: 'al-3', type: "sentiment", asset: "DEF Ltd", threshold: 0.7, status: "active" }
      ],
      notifications: [
        { id: 'nt-1', type: "alert_triggered", asset: "XYZ Corp", message: "Price crossed $60 threshold", datetime: "2026-03-15 10:30" },
        { id: 'nt-2', type: "news_update", asset: "ABC Inc", message: "New earnings report released for Q1", datetime: "2026-03-14 09:00" },
        { id: 'nt-3', type: "system", asset: "Portfolio", message: "Your weekly performance summary is ready", datetime: "2026-03-13 08:00" }
      ]
    },
    status: 200
  };
};

export const getPersonalizedData = async (): Promise<ApiResponse<UserPersonalizedData>> => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    data: {
      feed: [
        { 
          id: 'f-1', 
          type: "article", 
          title: "The Macro Case for Digital Scarcity", 
          preview: "Evaluating the transition from institutional gold to Bitcoin as the primary store of value in inflationary environments.", 
          date: "2026-03-15", 
          author: "The Market Maven",
          category: "Economics"
        },
        { 
          id: 'f-2', 
          type: "guide", 
          title: "Mastering the 2-10 Yield Spread", 
          preview: "A tactical guide to interpreting curve inversions and positioning your portfolio for structural recessionary signals.", 
          date: "2026-03-14", 
          author: "Eleanor Vance",
          category: "Strategy"
        },
        { 
          id: 'f-3', 
          type: "glossary_term", 
          title: "Stagflation", 
          preview: "A condition of slow economic growth and relatively high unemployment accompanied by rising prices.", 
          date: "2026-03-13", 
          author: "Imperialpedia Index",
          category: "Definitions"
        },
        { 
          id: 'f-4', 
          type: "article", 
          title: "DeFi Yield Benchmarking Q1", 
          preview: "Comparing institutional-grade lending protocols across Ethereum and Solana ecosystems.", 
          date: "2026-03-12", 
          author: "Sarah Crypto",
          category: "Crypto"
        }
      ],
      asset_recommendations: [
        { 
          id: 'r-1', 
          asset_name: "NVIDIA Corp", 
          symbol: "NVDA", 
          price: 875.25, 
          trend: "Uptrend", 
          risk_level: "Moderate", 
          confidence_score: 0.85 
        },
        { 
          id: 'r-2', 
          asset_name: "Alphabet Inc", 
          symbol: "GOOGL", 
          price: 120.50, 
          trend: "Downtrend", 
          risk_level: "Low", 
          confidence_score: 0.70 
        },
        { 
          id: 'r-3', 
          asset_name: "Ethereum", 
          symbol: "ETH", 
          price: 3450.00, 
          trend: "Sideways", 
          risk_level: "High", 
          confidence_score: 0.92 
        }
      ]
    },
    status: 200
  };
};
