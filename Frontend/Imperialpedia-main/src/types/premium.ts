/**
 * @fileOverview Type definitions for the platform's subscription and premium systems.
 */

import { ApiResponse } from "./api";

export type { ApiResponse };

export interface SubscriptionTier {
  id: string;
  name: string;
  plan_name?: string;
  description: string;
  priceMonthly: string;
  price?: number;
  priceYearly: string;
  features: string[];
  isPopular?: boolean;
  color?: "primary" | "secondary" | "emerald";
}

export interface PremiumState {
  tiers: SubscriptionTier[];
  subscription_plans?: any[];
  activeTier: string;
  trialInfo: {
    available: boolean;
    durationDays: number;
  };
}

export interface PremiumReport {
  id: string;
  report_name: string;
  description: string;
  date: string;
  download_link: string;
  type: "chart" | "table" | "summary";
  category: string;
  data: any[];
}

export interface BacktestingTool {
  strategy_name: string;
  parameters: {
    entry_rule: string;
    exit_rule: string;
  };
  results: {
    total_return: string;
    max_drawdown: string;
    performance_chart: string;
  };
}

export interface PremiumAnalytics {
  type: "portfolio_deep_dive" | "historical_sentiment" | "backtesting";
  summary?: string;
  data?: any[];
  results?: any[];
  backtesting_tools?: BacktestingTool[];
}

export interface MockPaymentStatus {
  user: string;
  plan_selected: string;
  status: "success" | "failed";
  message: string;
}

/**
 * Prompt 54: Premium Analytics & Reporting Dashboard Types
 */
export interface PremiumAnalyticsKPI {
  metric: string;
  value: string | number;
  trend: "mock_up" | "mock_down" | "mock_stable";
}

export interface PremiumReportNode {
  report_name: string;
  type: "PDF" | "CSV";
  status: "mock_ready" | "mock_generating";
  last_generated: string;
}

export interface AdvancedMetricNode {
  metric: string;
  value: string;
  segment: string;
}

export interface PremiumDashboardData {
  analytics_kpis: PremiumAnalyticsKPI[];
  reports: PremiumReportNode[];
  advanced_metrics: AdvancedMetricNode[];
  growth_chart_data: { date: string; revenue: number; users: number }[];
}

/**
 * Prompt 55: AI Portfolio Deep Dive Types
 */
export interface DeepDiveAsset {
  name: string;
  ticker: string;
  current_price: string;
  allocation: string;
  "P&L": string;
  ai_insights: {
    bull_case: "mock_up" | "mock_down" | "mock_neutral";
    bear_case: "mock_up" | "mock_down" | "mock_neutral";
    risk_alert: "mock_none" | "mock_warning" | "mock_critical";
  };
}

export interface PortfolioDeepDiveData {
  portfolio_summary: {
    total_value: string;
    allocation: Record<string, string>;
    profit_loss: string;
    risk_score: string;
  };
  assets: DeepDiveAsset[];
  risk_diversification: {
    diversification_score: string;
    sector_exposure: Record<string, string>;
    asset_correlation: Record<string, string>;
  };
}

/**
 * Prompt 56: Advanced Asset Screeners & Strategy Builder Types
 */
export interface ScreenerNode {
  name: string;
  filters: string[];
  results: number;
  last_run?: string;
}

export interface ScreenerAsset {
  name: string;
  symbol: string;
  price: string;
  market_cap: string;
  change_24h: string;
  volume: string;
  sentiment: number;
  momentum: number;
}

export interface CustomStrategy {
  strategy_name: string;
  conditions: string[];
  status: "mock_active" | "mock_inactive";
}

export interface ScreenerDashboardData {
  screeners: ScreenerNode[];
  assets: ScreenerAsset[];
  strategies: CustomStrategy[];
}

/**
 * Prompt 57: Backtesting Engine Types
 */
export interface BacktestSummary {
  total_return: string;
  annual_return: string;
  max_drawdown: string;
  win_rate: string;
  sharpe_ratio: string;
  total_trades: number;
  best_trade: string;
  worst_trade: string;
  profit_factor: string;
  long_win_rate: string;
  short_win_rate: string;
}

export interface StrategyCondition {
  indicator: string;
  operator: string;
  value: string;
}

export interface TradeEntry {
  trade_id: string;
  asset: string;
  entry_date: string;
  exit_date: string;
  entry_price: number | string;
  exit_price: number | string;
  return: string;
  profit: string;
}

export interface BacktestDashboardData {
  backtest_summary: BacktestSummary;
  strategy_conditions: StrategyCondition[];
  trade_history: TradeEntry[];
  equity_curve: { date: string; value: number }[];
  drawdown_chart: { date: string; value: number }[];
  monthly_heatmap: { month: string; year: number; return: number }[];
  saved_backtests: { name: string; last_tested: string; asset: string }[];
}

/**
 * Prompt 58: Market Heatmap Types
 */
export interface SectorHeatmapNode {
  name: string;
  change: string;
  market_cap: string;
  color: "green" | "light_green" | "neutral" | "light_red" | "red";
  weight: number; // 1-100 for visual sizing
}

export interface StockHeatmapNode {
  symbol: string;
  name: string;
  change: string;
  market_cap: string;
  volume?: string;
  weight: number;
}

export interface CapitalFlowItem {
  sector: string;
  flow: string;
  status: "inflow" | "outflow";
}

export interface RegionPerformance {
  region: string;
  performance: string;
  flow: string;
  volume: string;
}

export interface MarketHeatmapData {
  sectors: SectorHeatmapNode[];
  stocks: StockHeatmapNode[];
  capital_flows: CapitalFlowItem[];
  regions: RegionPerformance[];
}
