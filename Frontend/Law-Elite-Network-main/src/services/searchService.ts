/**
 * @fileOverview SearchService
 * Orchestrates real-time search intelligence, auto-complete synchronization, and dynamic ranking.
 */

import { getAllLawyers } from "@/services/lawyerService";
import { getSuggestions } from "@/lib/ai/searchSuggestions";
import { getBehaviorMock } from "@/lib/mock/userBehaviorMock";
import { rankWithFilters } from "@/lib/ai/rankingEngine";

/**
 * Fetches ranked suggestions for a given query string.
 */
export const fetchSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const lawyers = await getAllLawyers();
    const behavior = getBehaviorMock();
    const history = behavior.searches || [];

    return getSuggestions(query, lawyers, history);
  } catch (error) {
    console.error("Suggestion sync failure:", error);
    return [];
  }
};

/**
 * Executes a filtered search with dynamic AI ranking.
 */
export const searchWithFilters = async (filters: any) => {
  // Simulate network synchronization latency
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const lawyers = await getAllLawyers();
  return rankWithFilters(lawyers, filters);
};
