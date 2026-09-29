
import { Creator } from './creator';

export interface MatchResult {
  creator: Creator;
  score: number;
  matchReasons: string[];
}

export interface MatchScoreBreakdown {
  niche: number;
  followers: number;
  engagement: number;
  budget: number;
  location: number;
}
