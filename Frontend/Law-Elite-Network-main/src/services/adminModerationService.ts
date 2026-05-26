/**
 * @fileOverview AdminModerationService
 * Provides executive-level control over network content and member standing.
 */

import { getReviewsMock, saveReviewsMock } from "@/lib/mock/reviewMock";
import { getAllUsersMock } from "@/lib/mock/adminMock";

/**
 * Terminates a member's network access (Mock implementation).
 */
export const banUser = async (userId: string) => {
  // Simulate administrative protocol latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const users = getAllUsersMock();
  const updated = users.map((u: any) =>
    u.id === userId ? { ...u, profileStatus: 'suspended', banned: true } : u
  );

  // Sync to mock user ledger
  localStorage.setItem("law_elite_users_moderated", JSON.stringify(updated));
  return { success: true, userId };
};

/**
 * Redacts a professional review from the network dossier.
 */
export const deleteReview = async (reviewId: string) => {
  // Simulate data reconciliation latency
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const reviews = getReviewsMock();
  const updated = reviews.filter((r: any) => r.id !== reviewId);

  saveReviewsMock(updated);
  return { success: true, reviewId };
};
