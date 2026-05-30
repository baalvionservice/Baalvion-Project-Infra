import * as mockApi from '@/services/mock-api/analytics';
import { ApiResponse } from '@/types';
import { TrendingItem } from '@/services/mock-api/analytics';
import { errorHandler } from '@/lib/errors/error-handler';
import { TrafficAnalytics, SeoAnalytics, PlatformOverview, ContentAnalyticsReport, TrafficAnalyticsReport, EngagementAnalytics, ModerationAnalytics, CreatorEngagement, TrafficSources, TrendingContent, DailyActiveUsers, WeeklyActiveUsers, TopContent, TopKeyword, GrowthMetrics, EngagementByCategory, TrafficTrends, EngagementTrends, FullAnalyticsOverview, AssetSummary, AssetCase, EventIntelligenceData, TrendExplanationItem, RecapSummaryItem, PlatformCommandCenterData } from '@/types/analytics';

/**
 * @fileOverview Abstraction layer for analytics and trending data with error handling.
 */

// Backend asset_summary (imperialpedia-service /assets) → analytics AssetSummary.
// Real market data + seeded ai_summary; the structured ai_insights are templated scaffolding
// that the AI layer (ml-service) will replace once provider keys are configured.
interface RawAsset {
  symbol: string; name: string; asset_type?: string; current_price?: string | number;
  change_pct_24h?: string | number; market_cap?: string | number | null;
  volume_24h?: string | number | null; ai_summary?: string | null;
  sentiment?: 'bullish' | 'bearish' | 'neutral'; key_metrics?: Record<string, unknown>;
}

function fmtCap(v: number | null): string {
  if (!v) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function mapAssetToSummary(a: RawAsset): AssetSummary {
  const price = Number(a.current_price) || 0;
  const chg = Number(a.change_pct_24h) || 0;
  const sent = a.sentiment || 'neutral';
  const confidence = sent === 'bullish' ? 0.82 : sent === 'bearish' ? 0.46 : 0.62;
  // Synthetic 12-point price history trending with the 24h change (until real OHLC feed).
  const history = Array.from({ length: 12 }).map((_, i) => ({
    t: i,
    value: +(price * (1 - (chg / 100) * ((11 - i) / 11))).toFixed(2),
  }));
  const catalysts = Object.entries(a.key_metrics || {}).map(([k, v]) => `${k}: ${v}`).slice(0, 3);
  return {
    asset_name: a.name,
    symbol: a.symbol,
    current_price: price,
    daily_change_pct: +chg.toFixed(2),
    market_cap: fmtCap(a.market_cap == null ? null : Number(a.market_cap)),
    volume: Number(a.volume_24h) || 0,
    risk_flag: sent === 'bullish' ? 'Low' : sent === 'bearish' ? 'High' : 'Moderate',
    ai_insights: {
      confidence_score: confidence,
      bull_case: a.ai_summary || 'Constructive momentum and improving fundamentals support the upside case.',
      bear_case: 'Stretched valuation and macro/liquidity risks could pressure the price near-term.',
      catalysts: catalysts.length ? catalysts : ['Earnings/flows', 'Macro data', 'Sector rotation'],
      social_sentiment: chg >= 0 ? Math.min(1, chg / 10) : Math.max(-1, chg / 10),
    },
    price_history: history,
  };
}

export const analyticsService = {
  async getTrendingArticles(): Promise<ApiResponse<TrendingItem[]>> {
    try {
      return await mockApi.getTrendingArticles();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDAUData(): Promise<ApiResponse<DailyActiveUsers[]>> {
    try {
      return await mockApi.getDAUData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getWAUData(): Promise<ApiResponse<WeeklyActiveUsers[]>> {
    try {
      return await mockApi.getWAUData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getGrowthMetrics(): Promise<ApiResponse<GrowthMetrics | null>> {
    try {
      return await mockApi.getGrowthMetrics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPopularTopics(): Promise<ApiResponse<string[]>> {
    try {
      return await mockApi.getPopularTopics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrafficAnalytics(): Promise<ApiResponse<TrafficAnalytics | null>> {
    try {
      return await mockApi.getTrafficAnalytics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrafficAnalyticsReport(): Promise<ApiResponse<TrafficAnalyticsReport | null>> {
    try {
      return await mockApi.getTrafficAnalyticsReport();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrafficSources(): Promise<ApiResponse<TrafficSources | null>> {
    try {
      return await mockApi.getTrafficSources();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrafficTrends(): Promise<ApiResponse<TrafficTrends | null>> {
    try {
      return await mockApi.getTrafficTrends();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSeoAnalytics(): Promise<ApiResponse<SeoAnalytics | null>> {
    try {
      return await mockApi.getSeoAnalytics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTopKeywords(): Promise<ApiResponse<TopKeyword[]>> {
    try {
      return await mockApi.getTopKeywords();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPlatformOverview(): Promise<ApiResponse<PlatformOverview | null>> {
    try {
      return await mockApi.getPlatformOverview();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTopContent(): Promise<ApiResponse<TopContent[]>> {
    try {
      return await mockApi.getTopContent();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getEngagementTrends(): Promise<ApiResponse<EngagementTrends | null>> {
    try {
      return await mockApi.getEngagementTrends();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getContentAnalytics(): Promise<ApiResponse<ContentAnalyticsReport | null>> {
    try {
      const response = await mockApi.getContentAnalytics();
      // Map mock response to standardized ContentAnalyticsReport
      const mapped: ContentAnalyticsReport = {
        totalViews: response.data.totalViews,
        avgEngagement: response.data.avgEngagement,
        totalArticles: response.data.totalArticles,
        avgReadTime: 402, // 6m 42s in seconds
        topContent: response.data.topArticles.map((a: any) => ({
          id: a.articleId,
          title: a.title,
          views: a.views,
          likes: a.likes,
          shares: a.shares,
          comments: a.comments,
          seoScore: a.seoScore,
          category: a.category
        })),
        categoryBreakdown: response.data.topCategories.map((c: any) => ({
          category: c.category,
          views: c.views
        }))
      };
      return { data: mapped, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getEngagementAnalytics(): Promise<ApiResponse<EngagementAnalytics | null>> {
    try {
      return await mockApi.getEngagementAnalytics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getCategoryEngagement(): Promise<ApiResponse<EngagementByCategory[]>> {
    try {
      return await mockApi.getCategoryEngagement();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getModerationAnalytics(): Promise<ApiResponse<ModerationAnalytics[]>> {
    try {
      return await mockApi.getModerationAnalytics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getCreatorEngagement(): Promise<ApiResponse<CreatorEngagement[]>> {
    try {
      return await mockApi.getCreatorEngagement();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrendingContent(): Promise<ApiResponse<TrendingContent[]>> {
    try {
      return await mockApi.getTrendingContent();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getFullAnalyticsOverview(): Promise<ApiResponse<FullAnalyticsOverview | null>> {
    try {
      return await mockApi.getFullAnalyticsOverview();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAssetSummaries(): Promise<ApiResponse<AssetSummary[]>> {
    try {
      const IMP_API = process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || 'http://localhost:3004/api/v1';
      const res = await fetch(`${IMP_API}/assets?limit=50`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const items = json?.data?.items ?? [];
        if (items.length > 0) {
          const data: AssetSummary[] = items.map(mapAssetToSummary);
          return { data, status: 200 };
        }
      }
      return await mockApi.getAssetSummaries();
    } catch (error) {
      try { return await mockApi.getAssetSummaries(); } catch { /* noop */ }
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getAssetCases(query?: string): Promise<ApiResponse<AssetCase[]>> {
    try {
      return await mockApi.getAssetCases(query);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getEventIntelligence(): Promise<ApiResponse<EventIntelligenceData | null>> {
    try {
      return await mockApi.getEventIntelligence();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTrendExplanations(): Promise<ApiResponse<TrendExplanationItem[]>> {
    try {
      return await mockApi.getTrendExplanations();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getRecapSummaries(): Promise<ApiResponse<RecapSummaryItem[]>> {
    try {
      return await mockApi.getRecapSummaries();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPlatformCommandCenter(): Promise<ApiResponse<PlatformCommandCenterData | null>> {
    try {
      return await mockApi.getPlatformCommandCenterData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  }
};
