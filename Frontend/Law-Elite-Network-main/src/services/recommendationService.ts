/**
 * @fileOverview RecommendationService
 * Bridges the marketplace discovery with personalized AI ranking.
 */

import { getAllLawyers } from "@/services/lawyerService";
import { rankLawyers, ScoredLawyer } from "@/lib/ai/recommendationEngine";
import { getUserPreferences } from "./behaviorService";

/**
 * Retrieves a personalized ranked list of practitioners.
 */
export const getRecommendedLawyers = async (query: string): Promise<ScoredLawyer[]> => {
  // Simulate intelligence audit latency
  await new Promise(resolve => setTimeout(resolve, 600));

  const lawyers = await getAllLawyers();
  const prefs = getUserPreferences();
  
  const ranked = rankLawyers(lawyers, query, prefs);

  return ranked;
};
