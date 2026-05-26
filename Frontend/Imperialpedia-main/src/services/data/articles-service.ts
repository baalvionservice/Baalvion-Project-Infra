import * as mockApi from "@/services/mock-api/articles";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Article } from "@/modules/content-engine/types/article";
import { errorHandler } from "@/lib/errors/error-handler";

/**
 * @fileOverview Abstraction layer for article-related data fetching with error handling.
 */

export const articlesService = {
  async getArticles(
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<Article>> {
    try {
      return await mockApi.getArticles(page, limit);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        success: false,
        statusCode: appError.statusCode,
        message: appError.message,
        timestamp: new Date().toISOString(),
        path: "/api/articles",
        pagination: {
          currentPage: page || 1,
          totalPages: 0,
          pageSize: limit || 10,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  },

  async getArticleBySlug(slug: string): Promise<ApiResponse<Article | null>> {
    try {
      return await mockApi.getArticleBySlug(slug);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        success: false,
        statusCode: appError.statusCode,
        message: appError.message,
        timestamp: new Date().toISOString(),
        path: `/api/articles/${slug}`,
      };
    }
  },

  async getFeaturedArticles(): Promise<ApiResponse<Article[]>> {
    try {
      return await mockApi.getFeaturedArticles();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        success: false,
        statusCode: appError.statusCode,
        message: appError.message,
        timestamp: new Date().toISOString(),
        path: "/api/articles/featured",
      };
    }
  },
};
