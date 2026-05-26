/**
 * @fileOverview Type definitions for the Ultimate Media Admin Panel.
 */

export type AIModelProvider = 'Claude 3.5' | 'Gemini 1.5 Pro' | 'GPT-4o';

export interface AIConsentNode {
  id: string;
  topic: string;
  provider: AIModelProvider;
  status: 'drafting' | 'review' | 'ready';
  wordCount: number;
  seoScore: number;
  createdAt: string;
}

export interface AdPerformanceNode {
  id: string;
  placement: string;
  impressions: number;
  ctr: number;
  revenue: number;
  type: 'display' | 'sponsored' | 'affiliate';
}

export interface MediaEmpireStats {
  activeArticles: number;
  aiGeneratedCount: number;
  avgReadTime: string;
  totalSubscribers: number;
  monthlyRevenue: number;
  fxRate: string;
}

export interface MediaAdminDashboardData {
  stats: MediaEmpireStats;
  aiDrafts: AIConsentNode[];
  adPerformance: AdPerformanceNode[];
  recentActivity: Array<{
    id: string;
    admin: string;
    action: string;
    timestamp: string;
  }>;
}
