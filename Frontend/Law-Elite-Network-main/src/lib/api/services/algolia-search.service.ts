
"use client";

import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';

/**
 * @fileOverview AlgoliaSearchService
 * Provides high-performance search capabilities using Algolia.
 */
export class AlgoliaSearchService {
  private client: SearchClient | null = null;
  private index: SearchIndex | null = null;

  constructor() {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

    if (appId && apiKey) {
      this.client = algoliasearch(appId, apiKey);
      this.index = this.client.initIndex('lawyers_index');
    }
  }

  /**
   * Pushes or updates a lawyer profile in the search index.
   */
  async syncProfile(profile: any) {
    if (!this.index) return;

    try {
      await this.index.saveObject({
        objectID: profile.userId,
        ...profile,
        // Ensure location is flattened for filtering if needed
        city: profile.location?.city,
        state: profile.location?.state,
      });
    } catch (error) {
      console.error("Algolia sync failed:", error);
    }
  }

  /**
   * Removes a profile from the search index.
   */
  async removeProfile(userId: string) {
    if (!this.index) return;
    try {
      await this.index.deleteObject(userId);
    } catch (error) {
      console.error("Algolia deletion failed:", error);
    }
  }

  /**
   * Executes a search query with advanced filtering and ranking.
   */
  async search(query: string, filters: { 
    city?: string; 
    specialization?: string; 
    page?: number; 
    hitsPerPage?: number 
  }) {
    if (!this.index) return null;

    const facetFilters: string[] = [];
    if (filters.city) facetFilters.push(`city:${filters.city}`);
    if (filters.specialization) facetFilters.push(`specialization:${filters.specialization}`);

    try {
      const response = await this.index.search(query, {
        facetFilters,
        page: filters.page || 0,
        hitsPerPage: filters.hitsPerPage || 12,
        // Prioritize approved and active lawyers
        filters: 'verificationStatus:approved AND profileStatus:active'
      });

      return {
        hits: response.hits,
        nbPages: response.nbPages,
        page: response.page,
        nbHits: response.nbHits
      };
    } catch (error) {
      console.error("Algolia search failed:", error);
      return null;
    }
  }
}
