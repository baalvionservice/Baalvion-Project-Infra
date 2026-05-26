import * as mockApi from '@/services/mock-api/glossary';
import { GlossaryTerm, ApiResponse, PaginatedResponse } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for glossary-related data fetching with error handling.
 */

export const glossaryService = {
  async getTerms(page?: number, limit?: number): Promise<PaginatedResponse<GlossaryTerm>> {
    try {
      return await mockApi.getTerms(page, limit);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
        pagination: {
          currentPage: 1,
          totalPages: 0,
          pageSize: limit || 20,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  },

  async getTermBySlug(slug: string): Promise<ApiResponse<GlossaryTerm | null>> {
    try {
      return await mockApi.getTermBySlug(slug);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },
};
