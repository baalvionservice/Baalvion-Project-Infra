/**
 * @fileOverview Recommendation Service — LIVE-safe. No mock, no Firebase.
 * Personalized recommendations are a future ML feature; returns an empty set today so
 * the dashboard renders real data only (no fabricated suggestions).
 */
export const generateRecommendations = async (_userId?: string): Promise<any[]> => {
  return [];
};
