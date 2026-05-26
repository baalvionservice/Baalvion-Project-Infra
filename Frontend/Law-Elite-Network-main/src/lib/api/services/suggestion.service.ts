
"use client";

import { UserPreferenceRepository } from '../repositories/user-preference.repository';
import { LawyerService } from './lawyer.service';
import { CacheService } from './cache.service';

export class SuggestionService {
  constructor(
    private preferenceRepo: UserPreferenceRepository,
    private lawyerService: LawyerService,
    private cacheService?: CacheService
  ) {}

  /**
   * Generates personalized lawyer suggestions.
   * Employs caching to reduce high-frequency re-calculation.
   */
  async getPersonalizedSuggestions(uid: string, maxResults: number = 6) {
    const cacheKey = `suggs:${uid}:${maxResults}`;
    
    if (this.cacheService) {
      const cached = this.cacheService.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    const preferences = await this.preferenceRepo.getByUid(uid);
    
    const searchResponse = await this.lawyerService.searchLawyers({
      pageSize: 30,
      onlyApproved: true
    });

    const lawyers = searchResponse.docs;
    
    let result;
    if (!preferences || (!preferences.preferredCaseTypes?.length && !preferences.preferredLocations?.length)) {
      result = lawyers.slice(0, maxResults).map(l => ({ ...l, finalScore: l.searchScore, personalizationMatch: false }));
    } else {
      const suggestions = lawyers.map(lawyer => {
        let prefScore = 0;
        
        if (preferences.preferredCaseTypes?.some((ct: string) => 
          lawyer.specialization?.some((s: string) => s.toLowerCase() === ct.toLowerCase())
        )) prefScore += 50;

        if (preferences.preferredLocations?.some((loc: string) => 
          lawyer.location?.city?.toLowerCase() === loc.toLowerCase()
        )) {
          prefScore += 50;
        }

        const finalScore = (lawyer.searchScore * 0.8) + (prefScore * 0.2);

        return {
          ...lawyer,
          finalScore: Math.round(finalScore),
          personalizationMatch: prefScore > 0
        };
      });

      result = suggestions
        .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
        .slice(0, maxResults);
    }

    if (this.cacheService) {
      this.cacheService.set(cacheKey, result, 1000 * 60 * 15); // 15m TTL
    }

    return result;
  }
}
