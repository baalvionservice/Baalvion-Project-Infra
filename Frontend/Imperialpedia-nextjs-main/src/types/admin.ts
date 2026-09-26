/**
 * @fileOverview Core type definitions for the Imperialpedia Admin Panel.
 */

export type EditorialStatus = 'Draft' | 'Editor Review' | 'Compliance' | 'Chief Editor' | 'Scheduled' | 'Published';

export interface AdminArticle {
  id: string;
  title: string;
  author: string;
  category: string;
  status: EditorialStatus;
  publishDate?: string;
  wordCount: number;
  qualityScore: number;
}

export interface GlossaryTermNode {
  id: string;
  term: string;
  definition: string;
  relatedArticles: number;
  searchRanking: number;
  status: 'Active' | 'Under Review';
}

export interface UserNode {
  id: string;
  name: string;
  email: string;
  role: 'Reader' | 'Premium Member' | 'Contributor' | 'Author' | 'Editor' | 'Admin';
  status: 'Active' | 'Suspended' | 'Pending';
  subscription: 'Free' | 'Pro' | 'Enterprise';
}

export interface AuthorExpert {
  id: string;
  name: string;
  title: string;
  verified: boolean;
  articlesCount: number;
  specialties: string[];
}

export interface RevenueMetric {
  date: string;
  ads: number;
  subscriptions: number;
  affiliate: number;
}

export interface SEOMetric {
  keyword: string;
  rank: number;
  volume: string;
  difficulty: number;
}

export interface PlatformDashboardStats {
  totalUsers: number;
  articlesPublished: number;
  aiGenerated: number;
  revenue: string;
  activeAlerts: number;
}
