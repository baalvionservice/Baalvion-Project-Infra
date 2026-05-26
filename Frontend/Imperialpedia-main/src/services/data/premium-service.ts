import * as mockApi from '@/services/mock-api/premium';
import { ApiResponse, SubscriptionTier, PremiumState, PremiumReport, PremiumAnalytics, PremiumDashboardData, PortfolioDeepDiveData, ScreenerDashboardData, BacktestDashboardData, MarketHeatmapData } from '@/types/premium';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for subscription, billing, and premium intelligence data.
 */

export const premiumService = {
  async getTiers(): Promise<ApiResponse<SubscriptionTier[]>> {
    try {
      return await mockApi.getSubscriptionTiers();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPremiumState(): Promise<ApiResponse<PremiumState | null>> {
    try {
      return await mockApi.getPremiumState();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getReports(): Promise<ApiResponse<PremiumReport[]>> {
    try {
      return await mockApi.getPremiumReports();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAnalytics(): Promise<ApiResponse<PremiumAnalytics[]>> {
    try {
      return await mockApi.getPremiumAnalytics();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDashboardData(): Promise<ApiResponse<PremiumDashboardData | null>> {
    try {
      return await mockApi.getPremiumDashboardData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getPortfolioDeepDive(): Promise<ApiResponse<PortfolioDeepDiveData | null>> {
    try {
      return await mockApi.getPortfolioDeepDiveData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getScreenerData(): Promise<ApiResponse<ScreenerDashboardData | null>> {
    try {
      return await mockApi.getScreenerDashboardData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getBacktestData(): Promise<ApiResponse<BacktestDashboardData | null>> {
    try {
      return await mockApi.getBacktestData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getMarketHeatmap(): Promise<ApiResponse<MarketHeatmapData | null>> {
    try {
      return await mockApi.getMarketHeatmapData();
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
