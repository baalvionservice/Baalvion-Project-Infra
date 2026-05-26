/**
 * @fileOverview Mock Matching Engine Implementation
 * Implements a weighted scoring algorithm to rank lawyers based on case relevance.
 */

export const mockCalculateMatchScore = (lawyer: any, caseData: any) => {
  let score = 0;

  // 1. Specialization Match (HIGH Weight: 5)
  const lawyerSpecs = Array.isArray(lawyer.specialization) 
    ? lawyer.specialization.map((s: string) => s.toLowerCase()) 
    : [lawyer.specialization.toLowerCase()];
  
  const caseCategory = (caseData.category || "").toLowerCase();
  
  const hasSpecMatch = lawyerSpecs.some((s: string) => 
    s.includes(caseCategory) || caseCategory.includes(s)
  );

  if (hasSpecMatch) {
    score += 50; // Base score for domain match
  }

  // 2. Professional Longevity (Weight: 2)
  score += (lawyer.experience || 0) * 2;

  // 3. Network Reputation (Weight: 2)
  score += (lawyer.rating || 5.0) * 2;

  // 4. Budgetary Fit (Weight: 1)
  // Higher score for lower prices if no budget specified, or closer to budget if it is
  const fee = lawyer.consultationFee || lawyer.hourlyRate || 5000;
  if (fee < 6000) score += 10;
  else if (fee < 9000) score += 5;

  // 5. Jurisdiction Boost
  if (lawyer.location === caseData.location?.city || lawyer.city === caseData.city) {
    score += 15;
  }

  return Math.round(score);
};

export const mockRankLawyers = async (lawyers: any[], caseData: any) => {
  // Simulate intelligence audit latency
  await new Promise(resolve => setTimeout(resolve, 400));

  return lawyers
    .map(lawyer => ({
      ...lawyer,
      matchScore: mockCalculateMatchScore(lawyer, caseData)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
};
