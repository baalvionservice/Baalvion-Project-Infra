
"use client";

import { RecommendationService } from '../services/recommendation.service';
import { ApiResponse } from '../types';

export class RecommendationController {
  constructor(private service: RecommendationService) {}

  async getRecommendedLawyers(caseId: string): Promise<ApiResponse> {
    try {
      if (!caseId) throw new Error("Case ID is required for AI matching.");
      const data = await this.service.getRecommendations(caseId);
      return {
        success: true,
        message: "AI-powered recommendations generated successfully.",
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate recommendations",
        error: error.message
      };
    }
  }
}
