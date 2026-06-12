/**
 * @fileOverview Counsel Service
 * Orchestrates the retrieval of practitioners assigned to a specific member.
 */

import { getLawyerById } from "@/services/lawyers/lawyerService";
import { getCasesByClient } from "@/services/cases/caseService";

/**
 * Retrieves a unique collection of lawyers assigned to any of the user's cases.
 */
export const getMyCounsel = async (userId: string) => {
  // Simulate network synchronization
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const cases = await getCasesByClient(userId);
  const lawyerIds = Array.from(new Set(cases.map((c: any) => c?.assignedLawyerId).filter(Boolean)));
  
  if (lawyerIds.length === 0) return [];

  const lawyers = await Promise.all(
    lawyerIds.map(id => getLawyerById(id as string))
  );
  
  return lawyers.filter(Boolean);
};
