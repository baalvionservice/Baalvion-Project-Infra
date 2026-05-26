import * as mockApi from '@/services/mock-api/community';
import { ApiResponse, CommunityData, CommunityRankingsData, AssetSentiment, UserSentimentVote, DiscussionNode, ReputationSystemData, DebateNode, DebateLeaderboardEntry } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for community and engagement data with error handling.
 */

export const communityService = {
  async getCommunityData(): Promise<ApiResponse<CommunityData | null>> {
    try {
      return await mockApi.getCommunityData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getReputationData(): Promise<ApiResponse<ReputationSystemData | null>> {
    try {
      return await mockApi.getReputationData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getRankings(): Promise<ApiResponse<CommunityRankingsData | null>> {
    try {
      return await mockApi.getCommunityRankings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAssetSentiment(): Promise<ApiResponse<AssetSentiment[]>> {
    try {
      return await mockApi.getAssetSentiment();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getUserSentimentHistory(): Promise<ApiResponse<UserSentimentVote[]>> {
    try {
      return await mockApi.getUserSentimentHistory();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDiscussions(): Promise<ApiResponse<DiscussionNode[]>> {
    try {
      const response = await mockApi.getCommunityData();
      return { data: response.data?.discussions || [], status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDebates(): Promise<ApiResponse<DebateNode[]>> {
    try {
      return await mockApi.getDebates();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getDebateLeaderboard(): Promise<ApiResponse<DebateLeaderboardEntry[]>> {
    try {
      return await mockApi.getDebateLeaderboard();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  }
};
