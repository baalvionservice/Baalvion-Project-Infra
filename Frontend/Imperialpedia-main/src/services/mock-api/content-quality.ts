import { ApiResponse } from '@/types';
import { ContentQualityDashboardData } from '@/types/content-quality';

/**
 * @fileOverview Mock service for the Content Quality Scoring Engine.
 */

const mockQualityData: ContentQualityDashboardData = {
  articles: [
    {
      id: 'art-1',
      title: 'Understanding the Federal Reserve Interest Rate Policy',
      author: 'Michael Grant',
      quality_score: 94,
      tier: 'Excellent',
      badges: ["Editor Verified", "Expert Reviewed"],
      engagement: 18200,
      category: 'Economics',
      slug: 'fed-interest-rates',
      last_audited: '2024-03-12'
    },
    {
      id: 'art-2',
      title: 'Complete Guide to Cryptocurrency Market Cycles',
      author: 'Sophia Lee',
      quality_score: 89,
      tier: 'High Quality',
      badges: ["Community Approved"],
      engagement: 14600,
      category: 'Crypto',
      slug: 'crypto-market-cycles',
      last_audited: '2024-03-11'
    },
    {
      id: 'art-3',
      title: 'Yield Curve Inversion: A Historical Audit',
      author: 'Julian Wealth',
      quality_score: 91,
      tier: 'Excellent',
      badges: ["Expert Reviewed", "High Engagement"],
      engagement: 22400,
      category: 'Economics',
      slug: 'yield-curve-audit',
      last_audited: '2024-03-12'
    },
    {
      id: 'art-4',
      title: 'Basic Savings Options',
      author: 'Guest Writer',
      quality_score: 52,
      tier: 'Moderate',
      badges: [],
      engagement: 1200,
      category: 'Personal Finance',
      slug: 'basic-savings',
      last_audited: '2024-03-05'
    }
  ],
  quality_factors: {
    research_depth: 92,
    expert_contribution: 85,
    community_engagement: 88,
    source_credibility: 91,
    editorial_review: 90
  },
  global_stats: {
    avg_score: 84.5,
    top_tier_count: 420,
    needs_work_count: 15,
    audit_velocity: "42ms / node"
  },
  suggestions: [
    { id: 's-1', type: 'source', message: 'Add more primary institutional sources to the "Quantitative Easing" section.', impact: 'High' },
    { id: 's-2', type: 'content', message: 'Expand explanation depth on the 2-10 year yield spread divergence.', impact: 'Medium' },
    { id: 's-3', type: 'readability', message: 'Improve accessibility by simplifying complex derivative definitions.', impact: 'Low' },
    { id: 's-4', type: 'source', message: 'Update outdated 2023 inflation benchmarks with Q1 2024 data.', impact: 'High' }
  ]
};

export const getContentQualityData = async (): Promise<ApiResponse<ContentQualityDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockQualityData,
    status: 200,
  };
};
