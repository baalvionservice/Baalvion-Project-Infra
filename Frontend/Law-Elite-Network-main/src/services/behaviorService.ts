/**
 * @fileOverview BehaviorService
 * Orchestrates the tracking of professional signals to power personalization.
 */

import { getBehavior, saveBehavior } from "@/lib/behaviorStore";

/**
 * Logs a search query to understand user intent.
 */
export const trackSearch = async (query: string): Promise<void> => {
  if (!query.trim()) return;
  const data = getBehavior();
  data.searches = [...(data.searches || []), query.toLowerCase()].slice(-20); // Keep last 20
  saveBehavior(data);
};

/**
 * Logs a profile view to refine the user's specialization preferences.
 */
export const trackViewLawyer = async (lawyer: any): Promise<void> => {
  if (!lawyer || !lawyer.specialization) return;
  const data = getBehavior();
  
  // Handle both single string and array specializations
  const specs = Array.isArray(lawyer.specialization) 
    ? lawyer.specialization 
    : [lawyer.specialization];

  data.viewedSpecializations = [...(data.viewedSpecializations || []), ...specs].slice(-50);
  saveBehavior(data);
};

/**
 * Extracts a weighted preference profile from historical behavior.
 */
export const getUserPreferences = (): Record<string, number> => {
  const data = getBehavior();
  const prefs: Record<string, number> = {};

  (data.viewedSpecializations || []).forEach((spec: string) => {
    prefs[spec] = (prefs[spec] || 0) + 1;
  });

  return prefs;
};
