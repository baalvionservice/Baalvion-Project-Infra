import { GlossaryTerm } from '../models/glossary-term';
import { glossaryService as dataService } from '@/services/data';
import { ApiResponse, PaginatedResponse } from '@/types/api';

/**
 * @fileOverview Service layer for the Glossary Engine, handling pSEO logic and filtering.
 */

export const glossaryEngineService = {
  /**
   * Fetches all terms, optionally filtered by the starting letter.
   */
  async getTermsByLetter(letter: string): Promise<ApiResponse<GlossaryTerm[]>> {
    const response = await dataService.getTerms(1, 1000); // Fetch all for browsing
    const normalizedLetter = letter.toUpperCase();
    
    const filtered = response.data.filter(term => 
      term.term.charAt(0).toUpperCase() === normalizedLetter
    );

    return {
      data: filtered as unknown as GlossaryTerm[],
      status: 200,
    };
  },

  /**
   * Fetches a single term by slug.
   */
  async getTermBySlug(slug: string): Promise<ApiResponse<GlossaryTerm | null>> {
    const response = await dataService.getTermBySlug(slug);
    return {
      data: response.data as unknown as GlossaryTerm,
      status: response.status,
    };
  },

  /**
   * Fetches terms related to the current one.
   */
  async getRelatedTerms(slug: string): Promise<ApiResponse<GlossaryTerm[]>> {
    const termResponse = await this.getTermBySlug(slug);
    if (!termResponse.data) return { data: [], status: 404 };

    const allTerms = await dataService.getTerms(1, 100);
    const related = allTerms.data
      .filter(t => t.slug !== slug && t.category === termResponse.data?.category)
      .slice(0, 4);

    return {
      data: related as unknown as GlossaryTerm[],
      status: 200,
    };
  }
};
