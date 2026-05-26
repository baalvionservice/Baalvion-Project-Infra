/**
 * @fileOverview Baalvion AI Matching Engine
 * 
 * This engine uses a weighted multi-dimensional scoring algorithm to rank
 * creators against specific campaign requirements.
 */

import { CreatorProfile, Campaign } from '@/types';

export interface MatchRequirements {
  niches: string[];
  platform: string;
  budgetPerCreator: number;
  targetLocations?: string[];
  targetAgeRange?: [number, number];
}

export interface MatchScoreBreakdown {
  nicheMatch: number;
  engagementScore: number;
  audienceFit: number;
  priceFit: number;
  performance: number;
}

export interface MatchResult {
  creator: CreatorProfile;
  matchScore: number;
  breakdown: MatchScoreBreakdown;
  rank: number;
}

// Weights for the scoring algorithm
const WEIGHTS = {
  NICHE: 0.30,
  ENGAGEMENT: 0.25,
  AUDIENCE: 0.20,
  PRICE: 0.15,
  PERFORMANCE: 0.10,
};

/**
 * Calculates a match score for a single creator against requirements
 */
export function calculateMatchScore(
  creator: CreatorProfile,
  reqs: MatchRequirements
): { score: number; breakdown: MatchScoreBreakdown } {
  
  // 1. Niche Match (30%)
  const overlappingNiches = creator.niches.filter(n => reqs.niches.includes(n));
  const nicheMatch = Math.min((overlappingNiches.length / Math.max(reqs.niches.length, 1)) * 100, 100);

  // 2. Engagement Score (25%)
  // Benchmark is 5% ER. Anything 5% or above gets 100 points.
  const platformStats = creator.socialStats?.[reqs.platform.toLowerCase()];
  const er = platformStats?.engagementRate || (creator.rating / 5) * 4; // Fallback logic
  const engagementScore = Math.min((er / 5) * 100, 100);

  // 3. Audience Fit (20%)
  let audienceFit = 70; // Base score
  if (reqs.targetLocations && creator.location && reqs.targetLocations.includes(creator.location)) {
    audienceFit += 30;
  }
  audienceFit = Math.min(audienceFit, 100);

  // 4. Price Fit (15%)
  // Scores higher if the creator's rate is within or below the target budget per creator
  const platformKey = reqs.platform.toLowerCase();
  const creatorRate = creator.baseRates?.[`${platformKey}_reel`] || 
                     creator.baseRates?.[platformKey] || 
                     10000; // Default fallback
  
  let priceFit = 0;
  if (creatorRate <= reqs.budgetPerCreator) {
    priceFit = 100;
  } else {
    const diff = creatorRate - reqs.budgetPerCreator;
    priceFit = Math.max(100 - (diff / reqs.budgetPerCreator) * 100, 0);
  }

  // 5. Past Performance (10%)
  const performance = (creator.rating / 5) * 100;

  // Final Weighted Calculation
  const totalScore = Math.round(
    (nicheMatch * WEIGHTS.NICHE) +
    (engagementScore * WEIGHTS.ENGAGEMENT) +
    (audienceFit * WEIGHTS.AUDIENCE) +
    (priceFit * WEIGHTS.PRICE) +
    (performance * WEIGHTS.PERFORMANCE)
  );

  return {
    score: totalScore,
    breakdown: {
      nicheMatch: Math.round(nicheMatch),
      engagementScore: Math.round(engagementScore),
      audienceFit: Math.round(audienceFit),
      priceFit: Math.round(priceFit),
      performance: Math.round(performance),
    }
  };
}

/**
 * Main matching function to rank a list of creators
 */
export function rankCreators(
  creators: CreatorProfile[],
  reqs: MatchRequirements
): MatchResult[] {
  return creators
    .map(creator => {
      const { score, breakdown } = calculateMatchScore(creator, reqs);
      return {
        creator,
        matchScore: score,
        breakdown,
        rank: 0, // Placeholder
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }));
}

/**
 * Mock data for client-side matching demonstration
 */
export const MOCK_MATCH_DATA: CreatorProfile[] = [
  {
    id: 'creator_1',
    userId: 'user_1',
    username: 'sarah_tech',
    bio: 'Unboxing the future of AI and smart home tech.',
    photoURL: 'https://picsum.photos/seed/sarah/200/200',
    niches: ['Tech & Gadgets', 'Education'],
    location: 'India',
    rating: 4.9,
    baseRates: { youtube_video: 15000, instagram_reel: 12000 },
    socialStats: { youtube: { engagementRate: 6.2 }, instagram: { engagementRate: 5.1 } },
    onboardingStatus: 'COMPLETED' as any,
    onboardingStep: 5,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'creator_2',
    userId: 'user_2',
    username: 'alex_creates',
    bio: 'Visual storyteller and landscape photographer.',
    photoURL: 'https://picsum.photos/seed/alex/200/200',
    niches: ['Photography', 'Travel & Adventure'],
    location: 'United Kingdom',
    rating: 4.8,
    baseRates: { instagram_reel: 8000, instagram_post: 5000 },
    socialStats: { instagram: { engagementRate: 7.5 } },
    onboardingStatus: 'COMPLETED' as any,
    onboardingStep: 5,
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'creator_3',
    userId: 'user_3',
    username: 'm_fitness',
    bio: 'Peak performance coach and gym motivation.',
    photoURL: 'https://picsum.photos/seed/marcus/200/200',
    niches: ['Fitness & Wellness', 'Lifestyle'],
    location: 'United States',
    rating: 4.7,
    baseRates: { tiktok_video: 10000, instagram_reel: 15000 },
    socialStats: { tiktok: { engagementRate: 4.2 }, instagram: { engagementRate: 3.8 } },
    onboardingStatus: 'COMPLETED' as any,
    onboardingStep: 5,
    createdAt: '',
    updatedAt: ''
  }
];
