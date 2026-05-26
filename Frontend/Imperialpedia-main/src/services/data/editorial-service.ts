import { ApiResponse } from "@/types";
import { errorHandler } from "@/lib/errors/error-handler";

/**
 * @fileOverview Editorial service for managing editorial dashboard data.
 */

export interface EditorialDashboardData {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  recentActivity: {
    id: string;
    type: "submission" | "review" | "approval";
    title: string;
    author: string;
    timestamp: string;
  }[];
}

export const editorialService = {
  async getEditorialDashboardData(): Promise<
    ApiResponse<EditorialDashboardData>
  > {
    try {
      // Mock data for now
      const data: EditorialDashboardData = {
        totalSubmissions: 156,
        pendingReview: 23,
        approved: 98,
        rejected: 35,
        recentActivity: [
          {
            id: "1",
            type: "submission",
            title: "Understanding Market Cycles",
            author: "John Doe",
            timestamp: "2024-03-12T10:30:00Z",
          },
          {
            id: "2",
            type: "review",
            title: "Crypto Market Analysis",
            author: "Jane Smith",
            timestamp: "2024-03-12T09:15:00Z",
          },
        ],
      };

      return {
        data,
        status: 200,
      };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: {
          totalSubmissions: 0,
          pendingReview: 0,
          approved: 0,
          rejected: 0,
          recentActivity: [],
        },
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },
};

export const getEditorialDashboardData =
  editorialService.getEditorialDashboardData;
