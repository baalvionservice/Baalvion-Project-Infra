/**
 * @fileOverview Type definitions for the personal user system and dashboard.
 */

export interface WatchlistItem {
  id: string;
  asset: string;
  symbol: string;
  currentValue: string;
  change: string;
  isPositive: boolean;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volume?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  assets: WatchlistItem[];
}

export interface PortfolioAllocation {
  asset: string;
  percentage: number;
  value: number;
}

export interface PortfolioPerformanceNode {
  date: string;
  value: number;
}

export interface UserAlert {
  id: string;
  asset: string;
  type: 'price' | 'volume' | 'sentiment';
  threshold: string | number;
  status: 'active' | 'inactive';
  createdAt?: string;
  triggered?: boolean;
}

export interface UserNotification {
  id: string;
  type: 'alert_triggered' | 'news_update' | 'system';
  asset: string;
  message: string;
  datetime: string;
  read?: boolean;
}

/**
 * Prompt 36: Personalized Feed & Recommendations
 */
export interface FeedItem {
  id: string;
  type: 'article' | 'guide' | 'glossary_term';
  title: string;
  preview: string;
  date: string;
  author: string;
  category?: string;
  isSaved?: boolean;
}

export interface AssetRecommendation {
  id: string;
  asset_name: string;
  symbol: string;
  price: number;
  trend: 'Uptrend' | 'Downtrend' | 'Sideways';
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  confidence_score: number;
}

export interface UserPersonalizedData {
  feed: FeedItem[];
  asset_recommendations: AssetRecommendation[];
}

export interface UserDashboardData {
  user_details: {
    name: string;
    email: string;
    subscription_tier: 'Free' | 'Pro' | 'Elite';
    avatar: string;
  };
  watchlists_overview: WatchlistItem[];
  portfolio_summary: {
    total_value: string;
    gain_loss: string;
    gain_loss_percent: string;
    allocation: PortfolioAllocation[];
    history: PortfolioPerformanceNode[];
  };
  saved_articles: { id: string; title: string; route: string; category: string }[];
  saved_calculators: { id: string; name: string; route: string; type: string }[];
  activity_history: { id: string; action: string; timestamp: string }[];
  notifications: { id: string; type: 'alert' | 'update' | 'social'; message: string; read_status: boolean; date: string }[];
  preferences: {
    dark_mode: boolean;
    beta_opt_in: boolean;
    custom_alerts: string[];
  };
}

export interface UserPortfolioData {
  watchlists: WatchlistGroup[];
  portfolio_summary: {
    total_value: string;
    total_gain_loss: string;
    total_gain_loss_percent: string;
    allocation: PortfolioAllocation[];
    performance_chart_data: PortfolioPerformanceNode[];
  };
  alerts: UserAlert[];
  trade_history: Array<{
    id: string;
    asset: string;
    type: 'Buy' | 'Sell';
    price: string;
    quantity: string;
    date: string;
  }>;
}

export interface UserAlertsAndNotificationsData {
  alerts: UserAlert[];
  notifications: UserNotification[];
}
