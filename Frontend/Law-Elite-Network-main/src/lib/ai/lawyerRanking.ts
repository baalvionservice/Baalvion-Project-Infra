/**
 * @fileOverview LawyerRankingEngine
 * Implements a weighted scoring algorithm to rank practitioners based on performance metrics.
 */

export const calculateLawyerScore = (lawyer: any) => {
  let score = 0;

  // 1. Consultation Volume (Weight: 5 pts per engagement)
  // Mocking volume based on experience for better initial leaderboard feel
  const totalBookings = lawyer.totalConsultations || (lawyer.experience * 3);
  score += totalBookings * 5;

  // 2. Network Reputation (Weight: 20 pts per rating point)
  // Highly sensitive: A 5.0 rating provides 100 base points
  score += (lawyer.rating || 5.0) * 20;

  // 3. Professional Longevity (Weight: 2 pts per year)
  score += (lawyer.experience || 0) * 2;

  // 4. Marketplace Velocity Bonus (Weight: 15 pts)
  // Active practitioners receive a visibility boost
  if (lawyer.available) {
    score += 15;
  }

  return Math.round(score);
};

/**
 * Sorts and ranks a collection of practitioners by their performance score.
 */
export const rankLawyers = (lawyers: any[]) => {
  return lawyers
    .map((l) => ({
      ...l,
      performanceScore: calculateLawyerScore(l),
    }))
    .sort((a, b) => b.performanceScore - a.performanceScore);
};
