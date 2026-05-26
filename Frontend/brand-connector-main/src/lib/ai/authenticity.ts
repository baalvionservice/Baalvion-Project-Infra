
/**
 * @fileOverview Baalvion Creator Authenticity Analysis Engine
 * 
 * This module calculates a trust score based on audience behavior, 
 * engagement consistency, and growth patterns.
 */

import { AuthenticityReport } from '@/types';

export interface AuthenticityInput {
  followerCount: number;
  engagementRate: number; // as percentage, e.g. 5.2
  growthPattern: 'natural' | 'spike' | 'declining' | 'stagnant';
  commentLikeRatio: number; // comments / likes
  geographicDistribution: string[]; // cities or countries
  accountAgeMonths: number;
}

/**
 * Main scoring function for creator authenticity
 */
export function analyzeAuthenticity(input: AuthenticityInput): AuthenticityReport {
  let score = 100;
  const flags: string[] = [];
  
  // 1. Growth Pattern Audit (25 pts)
  let growthScore = 100;
  if (input.growthPattern === 'spike') {
    growthScore = 40;
    score -= 25;
    flags.push('Anomalous follower growth spike detected');
  } else if (input.growthPattern === 'declining') {
    growthScore = 70;
    score -= 5;
  }

  // 2. Engagement Consistency Audit (25 pts)
  // Industry standard comment-to-like ratio is typically 0.5% - 2.5%
  let ratioScore = 100;
  if (input.commentLikeRatio < 0.005) {
    ratioScore = 50;
    score -= 15;
    flags.push('Low comment-to-like ratio (possible bot likes)');
  } else if (input.commentLikeRatio > 0.15) {
    ratioScore = 60;
    score -= 10;
    flags.push('Unusually high comment ratio (possible engagement pod)');
  }

  // 3. reach Benchmarking (20 pts)
  let engagementScore = 100;
  // High ER on massive accounts is often suspicious
  if (input.followerCount > 500000 && input.engagementRate > 12) {
    engagementScore = 60;
    score -= 10;
    flags.push('Hyper-engagement detected relative to scale');
  } else if (input.engagementRate < 1.5) {
    engagementScore = 40;
    score -= 15;
    flags.push('Engagement rate below market benchmark');
  }

  // 4. Account Maturity (15 pts)
  let maturityScore = 100;
  if (input.accountAgeMonths < 6) {
    maturityScore = 50;
    score -= 10;
    if (input.followerCount > 100000) {
      score -= 15;
      flags.push('Rapid scale on high-risk new account');
    }
  }

  // 5. Geographic Spread (15 pts)
  let geoScore = 90;
  if (input.geographicDistribution.length < 2) {
    geoScore = 60;
    score -= 5;
    flags.push('Limited geographic audience diversity');
  }

  // Final risk determination
  let riskLevel: AuthenticityReport['riskLevel'] = 'LOW';
  if (score < 50) riskLevel = 'HIGH';
  else if (score < 80) riskLevel = 'MEDIUM';

  return {
    score: Math.max(Math.round(score), 0),
    riskLevel,
    flags,
    breakdown: {
      growth: growthScore,
      engagement: engagementScore,
      ratio: ratioScore,
      maturity: maturityScore,
      geo: geoScore,
    }
  };
}

/**
 * Mock data for a typical creator audit
 */
export const MOCK_AUDIT_DATA: AuthenticityInput = {
  followerCount: 850000,
  engagementRate: 5.8,
  growthPattern: 'natural',
  commentLikeRatio: 0.012,
  geographicDistribution: ['India', 'USA', 'UAE'],
  accountAgeMonths: 24,
};
