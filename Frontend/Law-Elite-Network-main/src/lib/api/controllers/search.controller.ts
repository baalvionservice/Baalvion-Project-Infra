
"use client";

import { AlgoliaSearchService } from '../services/algolia-search.service';
import { LawyerService } from '../services/lawyer.service';
import { ApiResponse } from '../types';

export class SearchController {
  constructor(
    private algoliaService: AlgoliaSearchService,
    private lawyerService: LawyerService
  ) {}

  /**
   * Main search entry point. Attempts Algolia first, falls back to Firestore.
   */
  async searchLawyers(req: { 
    query?: string; 
    city?: string; 
    specialization?: string; 
    page?: number 
  }): Promise<ApiResponse> {
    try {
      // 1. Attempt Algolia Search
      const algoliaResults = await this.algoliaService.search(req.query || '', {
        city: req.city,
        specialization: req.specialization,
        page: req.page
      });

      if (algoliaResults) {
        return {
          success: true,
          message: 'Algolia search results retrieved',
          data: {
            lawyers: algoliaResults.hits,
            hasMore: algoliaResults.page < algoliaResults.nbPages - 1,
            total: algoliaResults.nbHits,
            provider: 'algolia'
          }
        };
      }

      // 2. Fallback to Firestore Search
      const firestoreResults = await this.lawyerService.searchLawyers({
        city: req.city,
        specialization: req.specialization,
        pageSize: 12
      });

      return {
        success: true,
        message: 'Firestore search results retrieved (Algolia fallback)',
        data: {
          lawyers: firestoreResults.docs,
          hasMore: firestoreResults.hasMore,
          total: firestoreResults.count,
          provider: 'firestore'
        }
      };
    } catch (error: any) {
      return { success: false, message: 'Search failed', error: error.message };
    }
  }
}
