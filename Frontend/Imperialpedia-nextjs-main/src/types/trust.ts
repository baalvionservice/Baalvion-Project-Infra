/**
 * @fileOverview Type definitions for the Contributor Trust & Verification framework.
 */

export type TrustLevel = 'Highly Trusted' | 'Trusted Contributor' | 'Established Contributor' | 'New Contributor';

export interface VerificationFlag {
  type: 'identity' | 'professional' | 'credentials';
  status: 'verified' | 'unverified' | 'pending';
  label: string;
}

export interface CredibilityMilestone {
  date: string;
  event: string;
  type: 'joined' | 'published' | 'verified' | 'milestone' | 'award';
}

export interface ContributorTrustData {
  trust_score: number;
  level: TrustLevel;
  verification_flags: VerificationFlag[];
  milestones: CredibilityMilestone[];
  organization?: string;
  certifications?: string[];
  avg_engagement: string;
}

export interface TrustRankedContributor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  trust_score: number;
  verification: string[];
  followers: number;
  articles: number;
}
