/**
 * @fileOverview SEOService
 * Orchestrates data retrieval for dynamic organic landing pages.
 */

import { getAllLawyers } from "@/services/lawyerService";

/**
 * Resolves whether a slug is a city or a category and returns matching practitioners.
 */
export const getLawyersBySlug = async (slug: string) => {
  const lawyers = await getAllLawyers();
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');

  // 1. Check for city matches
  const cityMatches = lawyers.filter((l: any) => 
    l.city.toLowerCase() === normalizedSlug
  );

  if (cityMatches.length > 0) {
    return { type: 'city' as const, lawyers: cityMatches, value: normalizedSlug };
  }

  // 2. Check for specialization matches
  const categoryMatches = lawyers.filter((l: any) => 
    l.specialization.toLowerCase().includes(normalizedSlug)
  );

  if (categoryMatches.length > 0) {
    return { type: 'category' as const, lawyers: categoryMatches, value: normalizedSlug };
  }

  // 3. Fallback to general search results
  return { type: 'general' as const, lawyers: lawyers.slice(0, 3), value: slug };
};
