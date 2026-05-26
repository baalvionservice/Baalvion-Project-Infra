import * as mockApi from "@/services/mock-api/creators";
import { CreatorProfile, ApiResponse } from "@/types";
import { TopCreator } from "@/types/analytics";
import { errorHandler } from "@/lib/errors/error-handler";

/**
 * @fileOverview Abstraction layer for creator-related data fetching with error handling.
 */

export const creatorsService = {
  async getCreators(): Promise<ApiResponse<CreatorProfile[]>> {
    try {
      return await mockApi.getCreators();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getCreatorByUsername(
    username: string
  ): Promise<ApiResponse<CreatorProfile | null>> {
    try {
      return await mockApi.getCreatorByUsername(username);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTopCreators(): Promise<ApiResponse<TopCreator[]>> {
    try {
      return await mockApi.getTopCreators();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },
};

// Export individual functions for convenience
export const getCreators = creatorsService.getCreators;
export const getCreatorByUsername = creatorsService.getCreatorByUsername;
export const getTopCreators = creatorsService.getTopCreators;
