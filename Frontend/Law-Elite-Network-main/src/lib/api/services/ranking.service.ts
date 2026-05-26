
"use client";

import { SubscriptionTier } from '../types';

/**
 * @fileOverview RankingService
 * Provides professional scoring logic for the lawyer discovery network.
 */
export class RankingService {
  /**
   * Calculates a composite professional score for a lawyer.
   * Max score: 100.
   */
  static calculateScore(lawyer: any, searchParams: { city?: string, specialization?: string }) {
    let totalScore = 0;

    // 1. Subscription Tier Weight (40%)
    // ELITE: 100 pts, PRO: 60 pts, BASIC: 0 pts
    const tier = (lawyer.subscriptionTier as SubscriptionTier) || 'BASIC';
    let tierScore = 0;
    if (tier === 'ELITE') tierScore = 100;
    else if (tier === 'PRO') tierScore = 60;
    
    totalScore += tierScore * 0.40;

    // 2. Network Reputation (25%)
    // Normalized rating (0-5) to (0-100)
    const rating = lawyer.rating || 5.0;
    const ratingScore = (rating / 5) * 100;
    totalScore += ratingScore * 0.25;

    // 3. Professional Longevity (15%)
    // Experience capped at 30 years for normalization
    const exp = lawyer.experienceYears || 0;
    const expScore = Math.min((exp / 30) * 100, 100);
    totalScore += expScore * 0.15;

    // 4. Jurisdiction Relevance (10%)
    if (searchParams.city && lawyer.location?.city?.toLowerCase() === searchParams.city.toLowerCase()) {
      totalScore += 100 * 0.10;
    }

    // 5. Domain Relevance (10%)
    if (searchParams.specialization && lawyer.specialization?.some((s: string) => s.toLowerCase() === searchParams.specialization?.toLowerCase())) {
      totalScore += 100 * 0.10;
    }

    return Math.round(totalScore);
  }
}
