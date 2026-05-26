
"use client";

import { SuggestionService } from '../services/suggestion.service';
import { ApiResponse } from '../types';

export class SuggestionController {
  constructor(private service: SuggestionService) {}

  async getPersonalizedLawyers(uid: string): Promise<ApiResponse> {
    try {
      const data = await this.service.getPersonalizedSuggestions(uid);
      return {
        success: true,
        message: "Personalized suggestions generated based on your network activity.",
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate personalization profile.",
        error: error.message
      };
    }
  }
}
