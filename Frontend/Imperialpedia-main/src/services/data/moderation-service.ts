import * as mockApi from '@/services/mock-api/moderation';
import { ApiResponse, ModerationItem, ModerationApproval } from '@/types';
import { AIModerationHubData } from '@/types/moderation';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for content moderation operations.
 */

export const moderationService = {
  async getModerationQueue(): Promise<ApiResponse<ModerationItem[]>> {
    try {
      return await mockApi.getModerationQueue();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getModerationApprovals(): Promise<ApiResponse<ModerationApproval[]>> {
    try {
      return await mockApi.getModerationApprovals();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async moderateContent(contentId: string, action: 'Approve' | 'Reject'): Promise<ApiResponse<ModerationApproval | null>> {
    try {
      return await mockApi.moderateContent(contentId, action);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAIModerationHubData(): Promise<ApiResponse<AIModerationHubData | null>> {
    try {
      return await mockApi.getAIModerationHubData();
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
