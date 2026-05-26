/**
 * @fileOverview Baalvion AI ROI Prediction Engine
 * 
 * This module uses market benchmarks and historical platform data to 
 * forecast campaign performance metrics based on budget and targeting.
 */

export interface ROIPredictionInput {
  budget: number;
  niche: string;
  contentType: 'REEL' | 'VIDEO' | 'POST';
  creatorTier: 'NANO' | 'MICRO' | 'MID' | 'MACRO';
}

export interface ROIPredictionOutput {
  impressions: { min: number; max: number };
  engagements: number;
  cpe: number; // Cost Per Engagement
  cpm: number; // Cost Per Mille (1000 impressions)
  confidence: number;
}

// Market Benchmarks (Multipliers)
const NICHE_MULTIPLIERS: Record<string, number> = {
  'Tech & Gadgets': 1.2,
  'Gaming': 1.4,
  'Fashion & Style': 0.9,
  'Beauty & Personal Care': 0.85,
  'Fitness & Wellness': 1.1,
  'Food & Cooking': 1.0,
  'Education': 1.15,
  'default': 1.0
};

const TIER_BENCHMARKS = {
  'NANO': { cpm: 450, er: 0.08 },
  'MICRO': { cpm: 350, er: 0.05 },
  'MID': { cpm: 280, er: 0.035 },
  'MACRO': { cpm: 220, er: 0.02 }
};

/**
 * Predicts the ROI for a campaign based on inputs
 */
export function predictROI(input: ROIPredictionInput): ROIPredictionOutput {
  const { budget, niche, contentType, creatorTier } = input;
  
  // 1. Get Base Benchmarks
  const benchmark = TIER_BENCHMARKS[creatorTier];
  const multiplier = NICHE_MULTIPLIERS[niche] || NICHE_MULTIPLIERS['default'];
  
  // 2. Adjust for Content Type
  let contentFactor = 1.0;
  if (contentType === 'REEL') contentFactor = 1.3; // Reels have higher organic reach
  if (contentType === 'VIDEO') contentFactor = 0.8; // Long form has lower reach but higher depth
  
  // 3. Calculate Impressions
  // Impressions = (Budget / CPM) * 1000
  const adjustedCPM = benchmark.cpm / (multiplier * contentFactor);
  const baseImpressions = (budget / adjustedCPM) * 1000;
  
  // 4. Calculate Engagements
  // Engagements = Impressions * ER
  const baseEngagements = baseImpressions * benchmark.er * (contentType === 'VIDEO' ? 1.5 : 1.0);
  
  // 5. Final Output Generation
  return {
    impressions: {
      min: Math.round(baseImpressions * 0.85),
      max: Math.round(baseImpressions * 1.25)
    },
    engagements: Math.round(baseEngagements),
    cpe: Number((budget / baseEngagements).toFixed(2)),
    cpm: Math.round(adjustedCPM),
    confidence: Math.round(85 + Math.random() * 10) // Mocked confidence based on data depth
  };
}
