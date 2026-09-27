import { ID, Timestamp } from './common';

/**
 * @fileOverview Creator and Expert related types.
 */

export interface CreatorStats {
  followersCount: number;
  followingCount: number;
  articlesCount: number;
  totalViews: number;
  engagementScore?: number; // 0-100
  totalReads?: number;
  credibilityScore?: number; // 0-100
  accuracyScore?: number;    // 0-100
}

export interface CreatorContent {
  recentArticles: Array<{
    id: ID;
    title: string;
    slug: string;
    publishedAt: Timestamp;
    category: string;
    reads?: number;
    likes?: number;
    comments?: number;
  }>;
}

export interface SocialLink {
  platform: 'Twitter' | 'LinkedIn' | 'Website' | 'Github' | 'YouTube';
  url: string;
}

export interface CreatorProfile {
  id: ID;
  username: string;
  displayName: string;
  title: string; // Professional title
  company?: string;
  bio: string;
  avatar: string;
  joinedDate: Timestamp;
  specialties: string[];
  category: string;
  region: string;
  verified: boolean;
  yearsExperience?: number;
  education?: string;
  badges?: string[];
  stats: CreatorStats;
  content: CreatorContent;
  socialLinks: SocialLink[];
}

export interface CreatorContentItem {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  createdAt: string;
  updatedAt?: string;
  views: number;
  likes: number;
  comments: number;
  slug: string;
  snippet?: string;
  scheduledAt?: string;
  reads?: number;
}

export interface CreatorDashboardSummary {
  totalArticles: number;
  totalFollowers: number;
  totalViews: number;
  engagementRate: number;
}

export interface CreatorDashboardStats {
  creatorId: string;
  totalFollowers: number;
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalRevenue: number;
  performanceTrends: Array<{
    date: string;
    reach: number;
    engagement: number;
  }>;
}

export interface CreatorAnalytics {
  contentId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  revenue: number;
  createdAt: string;
}

export interface CreatorDashboardAnalytics {
  totalRevenue: number;
  totalViews: number;
  totalEngagement: number;
  avgRpm: number;
  topContent: CreatorAnalytics[];
  dailyMetrics: Array<{
    date: string;
    views: number;
    revenue: number;
    engagement: number;
    followers: number;
  }>;
}

/**
 * Admin-specific analytical data for tracking platform-wide creator performance.
 */
export interface AdminCreatorAnalytics {
  id: string;
  name: string;
  username: string;
  avatar: string;
  contentCount: number;
  followers: number;
  engagementRate: number;
  totalViews: number;
  totalRevenue: number;
  lastActive: string;
  verified: boolean;
  category: string;
}

export interface CreatorVerification {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  verified: boolean;
  requestedAt?: string;
  approvedAt?: string;
  approverId?: string;
  status: "unverified" | "pending" | "verified" | "rejected";
  documentsProvided: string[];
  rejectionReason?: string;
}

export interface CreatorLeaderboard {
  creatorId: string;
  name: string;
  profileImage: string;
  category: string;
  region: string;
  verified: boolean;
  totalRevenue: number;
  totalViews: number;
  totalLikes: number;
}

export interface ScheduledContent {
  id: string;
  title: string;
  scheduledAt: string;
  status: "draft" | "scheduled";
  category: string;
  tags: string[];
}

export interface CreatorSettings {
  creatorId: string;
  name: string;
  displayName: string;
  bio: string;
  profileImage: string;
  email: string;
  notifications: {
    engagement: boolean;
    followers: boolean;
    announcements: boolean;
  };
  categories: string[];
  socialLinks: {
    platform: string;
    url: string;
  }[];
}

export interface Follower {
  id: string;
  name: string;
  username: string;
  profileImage: string;
  followedAt: string;
  status: "following" | "not_following";
  category?: string;
}

export interface CreatorRevenue {
  contentId: string;
  title: string;
  revenue: number;
  dateEarned: string;
}

export interface CreatorRevenueSummary {
  totalRevenue: number;
  availableBalance: number;
  pendingPayout: number;
  lastPayoutDate: string;
  topEarningContent: { contentId: string; title: string; revenue: number }[];
  revenueTrends: { date: string; amount: number }[];
}
