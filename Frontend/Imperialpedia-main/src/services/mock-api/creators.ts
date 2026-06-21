/**
 * @deprecated Use `creatorApi` from `@/lib/api-client` instead.
 * This file is kept for backwards compatibility with existing imports.
 */
import {
  CreatorProfile,
  ApiResponse,
  CreatorContentItem,
  CreatorDashboardAnalytics,
  CreatorVerification,
  CreatorLeaderboard,
  ScheduledContent,
  CreatorSettings,
  CreatorDashboardStats,
  Follower,
  CreatorRevenue,
  CreatorRevenueSummary,
  AdminCreatorAnalytics,
} from "@/types";
import { TopCreator } from "@/types/analytics";
import { Notification } from "@/modules/content-engine/types/article";
import { TrustRankedContributor, ContributorTrustData } from "@/types/trust";

/**
 * @fileOverview Mock service for managing creator profiles, stats, and discovery data.
 */

const mockCreators: CreatorProfile[] = [
  {
    id: "creator-michael",
    username: "mroberts",
    displayName: "Michael Roberts",
    title: "Senior Market Analyst",
    company: "Roberts Asset Management",
    bio: "Specializing in equity research and macro-economic cycles. Over 12 years of institutional experience. Focused on identifying asymmetric yield opportunities.",
    avatar: "https://picsum.photos/seed/michael/200/200",
    joinedDate: "2022-10-15T00:00:00Z",
    specialties: ["Equity Research", "Macroeconomics", "Portfolio Management"],
    category: "Economics",
    region: "North America",
    verified: true,
    yearsExperience: 12,
    education: "London School of Economics",
    badges: ["Verified Analyst", "Senior Analyst", "CFA Certified"],
    stats: {
      followersCount: 15400,
      followingCount: 85,
      articlesCount: 56,
      totalViews: 1250000,
      totalReads: 502000,
      engagementScore: 92,
      credibilityScore: 92,
      accuracyScore: 88,
    },
    content: {
      recentArticles: [
        {
          id: "art-m1",
          title: "Global Liquidity and Stock Market Cycles",
          slug: "global-liquidity-cycles",
          category: "Macro Analysis",
          publishedAt: "2024-03-10T10:00:00Z",
          reads: 50200,
          likes: 4200,
          comments: 124,
        },
        {
          id: "art-m2",
          title: "Equity Valuation in a High-Interest Environment",
          slug: "equity-valuation-trends",
          category: "Equity Research",
          publishedAt: "2024-03-05T08:00:00Z",
          reads: 28400,
          likes: 1500,
          comments: 85,
        },
      ],
    },
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "LinkedIn", url: "#" },
    ],
  },
  {
    id: "creator-elena",
    username: "egarcia",
    displayName: "Elena Garcia",
    title: "Crypto Research Analyst",
    company: "Independent Analyst",
    bio: "Focused on blockchain protocol architecture and the transition to algorithmic fiscal policy. Analyzing the intersection of DeFi and institutional finance.",
    avatar: "https://picsum.photos/seed/elena/200/200",
    joinedDate: "2023-03-20T00:00:00Z",
    specialties: ["Cryptocurrency", "Blockchain", "Risk Management"],
    category: "Crypto",
    region: "Europe",
    verified: true,
    yearsExperience: 8,
    education: "MIT Sloan",
    badges: ["Verified Analyst", "Crypto Market Specialist"],
    stats: {
      followersCount: 9800,
      followingCount: 120,
      articlesCount: 34,
      totalViews: 850000,
      totalReads: 384000,
      engagementScore: 88,
      credibilityScore: 88,
      accuracyScore: 94,
    },
    content: {
      recentArticles: [
        {
          id: "art-e1",
          title: "Ethereum ETF Impact Explained",
          slug: "ethereum-etf-impact",
          category: "Crypto Analysis",
          publishedAt: "2024-03-12T11:00:00Z",
          reads: 38400,
          likes: 3100,
          comments: 240,
        },
      ],
    },
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "Github", url: "#" },
    ],
  },
  {
    id: "creator-sarah",
    username: "smitchell",
    displayName: "Sarah Mitchell",
    title: "Market Strategist",
    bio: "Specializing in macro-economic cycles and global interest rate arbitrage. Over 15 years of institutional research experience.",
    avatar: "https://picsum.photos/seed/sarah/200/200",
    joinedDate: "2023-01-15T00:00:00Z",
    specialties: ["Macroeconomics", "Market Analysis", "Bonds"],
    category: "Economics",
    region: "North America",
    verified: true,
    yearsExperience: 15,
    education: "Wharton MBA, CFA",
    badges: ["Verified Analyst", "Top Contributor", "Market Strategist"],
    stats: {
      followersCount: 12800,
      followingCount: 142,
      articlesCount: 42,
      totalViews: 850000,
      totalReads: 452000,
      engagementScore: 94,
      credibilityScore: 95,
      accuracyScore: 91,
    },
    content: {
      recentArticles: [
        {
          id: "art-1",
          title: "Understanding Market Cycles",
          slug: "understanding-market-cycles",
          category: "Market Analysis",
          publishedAt: "2024-03-01T10:00:00Z",
          reads: 45200,
          likes: 3200,
        },
      ],
    },
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "LinkedIn", url: "#" },
    ],
  },
  {
    id: "creator-4",
    username: "econvance",
    displayName: "Eleanor Vance",
    title: "Lead Administrator",
    bio: "Lead Administrator and Content Strategist at Imperialpedia. Focused on platform growth and institutional research.",
    avatar: "https://picsum.photos/seed/eleanor/200/200",
    joinedDate: "2022-12-01T00:00:00Z",
    specialties: ["Economics", "Growth", "Strategy"],
    category: "Economics",
    region: "North America",
    verified: true,
    stats: {
      followersCount: 25000,
      followingCount: 500,
      articlesCount: 120,
      totalViews: 4500000,
      engagementScore: 96,
      credibilityScore: 98,
      accuracyScore: 92,
    },
    content: {
      recentArticles: [],
    },
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "LinkedIn", url: "#" },
    ],
  },
];

/**
 * Prompt 70: Trusted Contributor Matrix
 */
const mockTrustDirectory: TrustRankedContributor[] = [
  {
    id: "cont-1",
    name: "Dr. Andrew Miller",
    username: "amiller_phd",
    avatar: "https://picsum.photos/seed/andrew/200/200",
    title: "Macro Economic Analyst",
    trust_score: 93,
    verification: ["Identity Verified", "Credentials Verified"],
    followers: 18200,
    articles: 64,
  },
  {
    id: "cont-2",
    name: "Laura Chen",
    username: "lchen_crypto",
    avatar: "https://picsum.photos/seed/laura/200/200",
    title: "Cryptocurrency Researcher",
    trust_score: 87,
    verification: ["Identity Verified", "Professional Verified"],
    followers: 12400,
    articles: 42,
  },
  {
    id: "cont-3",
    name: "Eleanor Vance",
    username: "econvance",
    avatar: "https://picsum.photos/seed/eleanor/200/200",
    title: "Market Strategist",
    trust_score: 98,
    verification: [
      "Identity Verified",
      "Professional Verified",
      "Credentials Verified",
    ],
    followers: 25000,
    articles: 120,
  },
];

export const getTrustDirectory = async (): Promise<
  ApiResponse<TrustRankedContributor[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { data: mockTrustDirectory, status: 200 };
};

export const getContributorTrustData = async (
  id: string
): Promise<ApiResponse<ContributorTrustData>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: {
      trust_score: 93,
      level: "Highly Trusted",
      organization: "Global Macro Research Institute",
      certifications: [
        "CFA Charterholder",
        "FINRA Series 7",
        "PhD in Economics",
      ],
      avg_engagement: "14.2%",
      verification_flags: [
        {
          type: "identity",
          status: "verified",
          label: "Identity Authenticated",
        },
        {
          type: "professional",
          status: "verified",
          label: "Professional History Validated",
        },
        {
          type: "credentials",
          status: "verified",
          label: "Academic Credentials Sealed",
        },
      ],
      milestones: [
        {
          date: "Oct 2022",
          event: "Joined Imperialpedia Index",
          type: "joined",
        },
        {
          date: "Dec 2022",
          event: "First Institutional Audit Published",
          type: "published",
        },
        {
          date: "Jan 2023",
          event: "Verified Expert Status Approved",
          type: "verified",
        },
        {
          date: "June 2023",
          event: "Top 1% Precision Forecast Award",
          type: "award",
        },
        {
          date: "Mar 2024",
          event: "Crossed 1M Global Reads",
          type: "milestone",
        },
      ],
    },
    status: 200,
  };
};

const mockAdminCreatorAnalytics: AdminCreatorAnalytics[] = mockCreators.map(
  (c) => ({
    id: c.id,
    name: c.displayName,
    username: c.username,
    avatar: c.avatar,
    contentCount: c.stats.articlesCount,
    followers: c.stats.followersCount,
    engagementRate: c.stats.engagementScore || 5.0,
    totalViews: c.stats.totalViews,
    totalRevenue: 12450.0,
    lastActive: "2024-03-12T10:30:00Z",
    verified: c.verified,
    category: c.category,
  })
);

export const getAdminCreatorAnalytics = async (): Promise<
  ApiResponse<AdminCreatorAnalytics[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: mockAdminCreatorAnalytics,
    status: 200,
  };
};

export const getTopCreators = async (): Promise<ApiResponse<TopCreator[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const data: TopCreator[] = mockAdminCreatorAnalytics
    .map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      totalContent: c.contentCount,
      likes: Math.floor(c.totalViews * 0.05), // Estimate likes as 5% of views
      comments: Math.floor(c.totalViews * 0.02), // Estimate comments as 2% of views
      shares: Math.floor(c.totalViews * 0.01), // Estimate shares as 1% of views
      followers: c.followers,
      engagementRate: c.engagementRate,
      revenue: c.totalRevenue,
      verified: c.verified,
      category: c.category,
    }))
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  return { data, status: 200 };
};

export const getCreators = async (): Promise<ApiResponse<CreatorProfile[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockCreators,
    status: 200,
  };
};

export const getCreatorById = async (
  id: string
): Promise<ApiResponse<CreatorProfile | null>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const creator =
    mockCreators.find((c) => c.id === id || c.username === id) || null;
  return {
    data: creator,
    status: creator ? 200 : 404,
  };
};

export const getCreatorByUsername = async (
  username: string
): Promise<ApiResponse<CreatorProfile | null>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const creator = mockCreators.find((c) => c.username === username) || null;
  return {
    data: creator,
    status: creator ? 200 : 404,
  };
};

export const getCreatorDashboardStats = async (
  creatorId: string
): Promise<ApiResponse<CreatorDashboardStats>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: {
      creatorId,
      totalFollowers: 25000,
      totalContent: 120,
      totalViews: 4500000,
      totalLikes: 42000,
      totalComments: 8400,
      totalRevenue: 28900.0,
      performanceTrends: [
        { date: "2024-03-01", reach: 45000, engagement: 1200 },
        { date: "2024-03-02", reach: 52000, engagement: 1500 },
        { date: "2024-03-03", reach: 48000, engagement: 1100 },
        { date: "2024-03-04", reach: 61000, engagement: 1800 },
        { date: "2024-03-05", reach: 75000, engagement: 2200 },
        { date: "2024-03-06", reach: 68000, engagement: 1900 },
        { date: "2024-03-07", reach: 82000, engagement: 2500 },
      ],
    } as any,
    status: 200,
  };
};

export const getCreatorContent = async (
  creatorId: string
): Promise<ApiResponse<CreatorContentItem[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const creator = mockCreators.find(
    (c) => c.id === creatorId || c.username === creatorId
  );
  const articles = creator?.content.recentArticles || [];

  const extendedContent: CreatorContentItem[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    snippet:
      "Strategic overview of current market dynamics and node transitions.",
    body: "Full analysis text content...",
    category: a.category,
    tags: ["Macro", "Alpha"],
    status: "published",
    createdAt: a.publishedAt,
    views: a.reads || 1200,
    likes: a.likes || 100,
    comments: a.comments || 42,
    reads: a.reads || 1200,
    slug: a.slug,
  }));

  return {
    data: extendedContent,
    status: 200,
  };
};

export const getCreatorAnalytics = async (
  creatorId: string
): Promise<ApiResponse<CreatorDashboardAnalytics>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: {
      totalRevenue: 12450.75,
      totalViews: 1250000,
      totalEngagement: 45800,
      avgRpm: 9.96,
      topContent: [
        {
          contentId: "c-1",
          title: "Quantitative Easing vs Tightening: A 2026 Outlook",
          views: 45000,
          likes: 1200,
          comments: 240,
          shares: 350,
          revenue: 448.2,
          createdAt: "2024-03-01T10:00:00Z",
        },
      ],
      dailyMetrics: [
        {
          date: "2024-03-01",
          views: 12000,
          revenue: 119.5,
          engagement: 450,
          followers: 12,
        },
        {
          date: "2024-03-02",
          views: 15400,
          revenue: 153.2,
          engagement: 580,
          followers: 24,
        },
      ],
    },
    status: 200,
  };
};

export const getPendingVerifications = async (): Promise<
  ApiResponse<CreatorVerification[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockPendingVerifications,
    status: 200,
  };
};

export const getLeaderboardData = async (): Promise<
  ApiResponse<CreatorLeaderboard[]>
> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const mockLeaderboard: CreatorLeaderboard[] = mockCreators.map((c) => ({
    creatorId: c.id,
    name: c.displayName,
    profileImage: c.avatar,
    category: c.category,
    region: c.region,
    verified: c.verified,
    totalRevenue: 15400.5,
    totalViews: c.stats.totalViews,
    totalLikes: 12400,
  }));
  return {
    data: mockLeaderboard,
    status: 200,
  };
};

export const getCreatorNotifications = async (
  creatorId: string
): Promise<ApiResponse<Notification[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockNotifications,
    status: 200,
  };
};

export const getScheduledContent = async (
  creatorId: string
): Promise<ApiResponse<ScheduledContent[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockScheduledContent,
    status: 200,
  };
};

export const getCreatorSettings = async (
  creatorId: string
): Promise<ApiResponse<CreatorSettings>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const mockCreatorSettings: CreatorSettings = {
    creatorId: "u-1",
    name: "Eleanor Vance",
    displayName: "Eleanor Vance",
    bio: "Lead Administrator and Content Strategist at Imperialpedia.",
    profileImage: "https://picsum.photos/seed/eleanor/200/200",
    email: "eleanor@imperialpedia.com",
    notifications: {
      engagement: true,
      followers: true,
      announcements: false,
    },
    categories: ["Economics", "Growth", "Strategy"],
    socialLinks: [
      { platform: "Twitter", url: "#" },
      { platform: "LinkedIn", url: "#" },
    ],
  };
  return {
    data: mockCreatorSettings,
    status: 200,
  };
};

export const getFollowers = async (
  creatorId: string
): Promise<ApiResponse<Follower[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const mockFollowers: Follower[] = [
    {
      id: "f-1",
      name: "Julian Wealth",
      username: "wealthbuilder",
      profileImage: "https://picsum.photos/seed/wealth/200/200",
      followedAt: "2024-03-01T10:00:00Z",
      status: "following",
      category: "Investing",
    },
    {
      id: "f-2",
      name: "Sarah Crypto",
      username: "defianalyst",
      profileImage: "https://picsum.photos/seed/defi/200/200",
      followedAt: "2024-03-05T14:30:00Z",
      status: "not_following",
      category: "Crypto",
    },
  ];
  return {
    data: mockFollowers,
    status: 200,
  };
};

export const getFollowing = async (
  creatorId: string
): Promise<ApiResponse<Follower[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const mockFollowers: Follower[] = [
    {
      id: "f-1",
      name: "Julian Wealth",
      username: "wealthbuilder",
      profileImage: "https://picsum.photos/seed/wealth/200/200",
      followedAt: "2024-03-01T10:00:00Z",
      status: "following",
      category: "Investing",
    },
  ];
  return {
    data: mockFollowers,
    status: 200,
  };
};

export const getCreatorVerificationStatus = async (
  creatorId: string
): Promise<ApiResponse<CreatorVerification>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (
    creatorId === "u-1" ||
    creatorId === "creator-4" ||
    creatorId.includes("michael") ||
    creatorId.includes("elena")
  ) {
    return {
      data: {
        creatorId,
        creatorName: "Verified Expert",
        creatorAvatar: "",
        verified: true,
        status: "verified",
        requestedAt: "2023-12-01T10:00:00Z",
        approvedAt: "2023-12-05T14:30:00Z",
        documentsProvided: ["LinkedIn Profile", "FINRA Certification"],
      },
      status: 200,
    };
  }

  return {
    data: {
      creatorId,
      creatorName: "Standard User",
      creatorAvatar: "",
      verified: false,
      status: "unverified",
      documentsProvided: [],
    },
    status: 200,
  };
};

export const getCreatorRevenue = async (
  creatorId: string
): Promise<ApiResponse<CreatorRevenueSummary>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: {
      totalRevenue: 28900.0,
      availableBalance: 12450.75,
      pendingPayout: 3200.0,
      lastPayoutDate: "2024-03-01T10:00:00Z",
      topEarningContent: [
        {
          contentId: "c-1",
          title: "Quantitative Easing vs Tightening",
          revenue: 448.2,
        },
      ],
      revenueTrends: [{ date: "2024-03-01", amount: 119.5 }],
    },
    status: 200,
  };
};

export const getPayoutHistory = async (
  creatorId: string
): Promise<ApiResponse<CreatorRevenue[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: [
      {
        contentId: "c-1",
        title: "Quantitative Easing vs Tightening",
        revenue: 124.5,
        dateEarned: "2024-03-07T10:00:00Z",
      },
    ],
    status: 200,
  };
};

const mockScheduledContent: ScheduledContent[] = [
  {
    id: "sc-1",
    title: "Macro Trends in 2026",
    scheduledAt: "2024-04-10T10:00:00Z",
    status: "scheduled",
    category: "Economics",
    tags: ["Macro", "Future"],
  },
];

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    userId: "u-1",
    type: "follower",
    message: "Ken Macro started following your expert profile.",
    createdAt: new Date().toISOString(),
    read: false,
    relatedId: "creator-5",
  },
];

const mockPendingVerifications: CreatorVerification[] = [
  {
    creatorId: "u-4",
    creatorName: "Wealth Builder",
    creatorAvatar: "https://picsum.photos/seed/wealth/200/200",
    verified: false,
    requestedAt: "2024-03-10T10:00:00Z",
    status: "pending",
    documentsProvided: ["LinkedIn Profile", "FINRA Certification"],
  },
];
