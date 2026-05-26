/**
 * @fileOverview RankingService
 * Primary service layer for the network's performance leaderboard.
 */

import { getAllLawyers } from "@/services/lawyerService";
import { rankLawyers } from "@/lib/ai/lawyerRanking";

/**
 * Retrieves the top-ranked practitioners across the global network.
 * Limited to Top 10 for exclusivity.
 */
export const getTopLawyers = async () => {
  // Simulate intelligence audit latency
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const lawyers = await getAllLawyers();
  const ranked = rankLawyers(lawyers);

  return ranked.slice(0, 10);
};
