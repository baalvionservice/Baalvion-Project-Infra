/**
 * @fileOverview RecommendationEngine
 * Enhanced with personalization logic to rank practitioners based on user behavior.
 */

export interface ScoredLawyer {
  id: string;
  name: string;
  specialization: string | string[];
  experience: number;
  consultationFee: number;
  available: boolean;
  rating: number;
  city: string;
  score: number;
}

/**
 * Ranks lawyers using a composite score of relevance, professional standing, and user behavior.
 */
export const rankLawyers = (
  lawyers: any[],
  query: string,
  userPrefs: Record<string, number> = {}
): ScoredLawyer[] => {
  const normalizedQuery = query.toLowerCase();

  return lawyers
    .map((lawyer) => {
      let score = 0;

      // 1. Core Relevance (Query Match)
      const specs = Array.isArray(lawyer.specialization) 
        ? lawyer.specialization 
        : [lawyer.specialization];
      
      const hasQueryMatch = specs.some((s: string) => s.toLowerCase().includes(normalizedQuery)) ||
                           (lawyer.name && lawyer.name.toLowerCase().includes(normalizedQuery));

      if (hasQueryMatch && query.trim() !== "") {
        score += 50;
      }

      // 2. Personalization Boost (Behavior-Based)
      specs.forEach((s: string) => {
        if (userPrefs[s]) {
          // Boost score based on how many times user viewed this specialization
          score += userPrefs[s] * 10;
        }
      });

      // 3. Professional Standing
      score += (lawyer.experience || 0) * 2;
      score += (lawyer.rating || 0) * 5;

      // 4. Marketplace Velocity (Availability)
      if (lawyer.available) {
        score += 20;
      }

      return { ...lawyer, score };
    })
    .sort((a, b) => b.score - a.score);
};
