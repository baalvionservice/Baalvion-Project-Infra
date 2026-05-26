import { ApiResponse } from '@/types';
import { MediaAdminDashboardData } from '@/types/admin-media';

/**
 * @fileOverview Mock API service for the Media Admin Panel.
 */

const mockMediaAdminData: MediaAdminDashboardData = {
  stats: {
    activeArticles: 1248000,
    aiGeneratedCount: 45200,
    avgReadTime: "6m 42s",
    totalSubscribers: 85400,
    monthlyRevenue: 124500.00,
    fxRate: "1.00 USD"
  },
  aiDrafts: [
    { id: 'ai-1', topic: "Q2 Fed Liquidity Cycle", provider: 'Claude 3.5', status: 'drafting', wordCount: 1200, seoScore: 94, createdAt: '2024-03-15T10:00:00Z' },
    { id: 'ai-2', topic: "DeFi Yield Benchmarks", provider: 'Gemini 1.5 Pro', status: 'review', wordCount: 2400, seoScore: 88, createdAt: '2024-03-15T09:15:00Z' },
    { id: 'ai-3', topic: "Tech Sector Rotation", provider: 'Claude 3.5', status: 'ready', wordCount: 1850, seoScore: 91, createdAt: '2024-03-14T16:45:00Z' }
  ],
  adPerformance: [
    { id: 'ad-1', placement: "Header Leaderboard", impressions: 1250000, ctr: 1.2, revenue: 12500, type: 'display' },
    { id: 'ad-2', placement: "In-Article Sponsorship", impressions: 450000, ctr: 3.5, revenue: 22400, type: 'sponsored' },
    { id: 'ad-3', placement: "Sidebar Tools Widget", impressions: 850000, ctr: 0.8, revenue: 4200, type: 'display' }
  ],
  recentActivity: [
    { id: 'act-1', admin: "Eleanor Vance", action: "Approved AI Research: Fed Liquidity", timestamp: "10m ago" },
    { id: 'act-2', admin: "System Kernel", action: "Re-indexed 12,000 pSEO nodes", timestamp: "42m ago" },
    { id: 'act-3', admin: "Julian Wealth", action: "Modified Ad Placement: Sidebar", timestamp: "1h ago" }
  ]
};

export const getMediaAdminData = async (): Promise<ApiResponse<MediaAdminDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: mockMediaAdminData,
    status: 200
  };
};
