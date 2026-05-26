/**
 * @fileOverview Type definitions for the Content Quality & Trust Engine.
 */

export type QualityTier = 'Excellent' | 'High Quality' | 'Moderate' | 'Needs Improvement';

export interface QualityFactors {
  research_depth: number;
  expert_contribution: number;
  community_engagement: number;
  source_credibility: number;
  editorial_review: number;
}

export interface ImprovementSuggestion {
  id: string;
  type: 'content' | 'source' | 'seo' | 'readability';
  message: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface QualityScoredArticle {
  id: string;
  title: string;
  author: string;
  quality_score: number;
  tier: QualityTier;
  badges: string[];
  engagement: number;
  category: string;
  slug: string;
  last_audited: string;
}

export interface ContentQualityDashboardData {
  articles: QualityScoredArticle[];
  quality_factors: QualityFactors;
  global_stats: {
    avg_score: number;
    top_tier_count: number;
    needs_work_count: number;
    audit_velocity: string;
  };
  suggestions: ImprovementSuggestion[];
}
