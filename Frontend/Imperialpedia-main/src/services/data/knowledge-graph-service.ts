import * as mockApi from '@/services/mock-api/knowledge-graph';
import { ApiResponse } from '@/types';
import { KnowledgeGraphData } from '@/types/knowledge-graph';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Data service for the Knowledge Graph Engine.
 */

export const knowledgeGraphService = {
  async getGraphData(): Promise<ApiResponse<KnowledgeGraphData | null>> {
    try {
      return await mockApi.getKnowledgeGraphData();
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
