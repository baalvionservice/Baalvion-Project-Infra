/**
 * @fileOverview RankingEngine (Advanced)
 * Implements a weighted scoring algorithm to rank practitioners based on dynamic filter criteria.
 */

export const rankWithFilters = (
  lawyers: any[],
  filters: any
) => {
  return lawyers
    .map((lawyer) => {
      let score = 0;

      // 1. Specialization match (Highest Priority)
      if (
        filters.specialization &&
        lawyer.specialization.toLowerCase().includes(filters.specialization.toLowerCase())
      ) {
        score += 50;
      }

      // 2. Experience Threshold
      if (filters.minExperience) {
        if (lawyer.experience >= filters.minExperience) {
          score += 20;
        } else {
          score -= 10;
        }
      }

      // 3. Fee Reconciliation
      if (filters.maxFee) {
        if (lawyer.consultationFee <= filters.maxFee) {
          score += 20;
        } else {
          score -= 20; // Significant penalty for exceeding budget
        }
      }

      // 4. Marketplace Velocity (Availability)
      if (filters.availability) {
        if (lawyer.available) {
          score += 30;
        } else {
          score -= 10;
        }
      }

      // 5. Baseline Professional Standing (Inherited)
      score += (lawyer.rating || 0) * 5;

      return { ...lawyer, score };
    })
    .sort((a, b) => b.score - a.score);
};
