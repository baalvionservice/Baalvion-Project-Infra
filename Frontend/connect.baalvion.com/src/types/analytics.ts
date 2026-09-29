
export interface CampaignAnalytics {
  campaignId: string;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  engagementRate: number;
  roi: number;
  spend: number;
  revenueGenerated: number;
  timeline: Array<{
    date: string;
    impressions: number;
    clicks: number;
  }>;
}

export interface CreatorAnalytics {
  creatorId: string;
  name: string;
  avatar?: string;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  roiScore: number;
}

export interface AnalyticsOverview {
  totalCampaigns: number;
  totalRevenue: number;
  totalSpend: number;
  avgROI: number;
  conversionRate: number;
  activeCreators: number;
}
