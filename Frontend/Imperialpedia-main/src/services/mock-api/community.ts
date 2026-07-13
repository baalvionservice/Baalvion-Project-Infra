import { ApiResponse } from '@/types';
import { personSilhouetteDataUri } from '@baalvion/illustrations';
import {
  CommunityData,
  Comment,
  PredictionContest,
  ReputationEntry,
  LeaderboardItem,
  CommunityRankingsData,
  RankedUser,
  ContestLeaderboardEntry,
  UserPrediction,
  AssetSentiment,
  UserSentimentVote,
  DiscussionNode,
  TrendingTopic,
  ReputationSystemData
} from '@/types/community';

/**
 * @fileOverview Mock service for the Community and Engagement engine.
 */

const mockComments: Comment[] = [
  {
    id: 'c-1',
    comment_id: 1,
    username: 'MarketWatchdog',
    reputation: 1240,
    reputationScore: 1240,
    badge: 'Elite Analyst',
    avatar: personSilhouetteDataUri({ name: 'MarketWatchdog', seed: 'user1' }),
    timestamp: '2h ago',
    content: 'The 2-10 spread inversion is widening. Historical data suggests a 12-18 month lead time to a full fiscal contraction.',
    text: 'The 2-10 spread inversion is widening. Historical data suggests a 12-18 month lead time to a full fiscal contraction.',
    upvotes: 42,
    downvotes: 3,
    bullBearVote: 'Bear',
    bull_bear: 'Bear',
    replies: [
      {
        id: 'c-1-1',
        comment_id: 2,
        parent_id: 1,
        username: 'Julian Wealth',
        reputation: 8500,
        reputationScore: 8500,
        badge: 'Verified Expert',
        avatar: personSilhouetteDataUri({ name: 'Julian Wealth', seed: 'wealth' }),
        timestamp: '1h ago',
        content: 'Correct, but we should also consider the high consumer cash reserves which might buffer the landing.',
        text: 'Correct, but we should also consider the high consumer cash reserves which might buffer the landing.',
        upvotes: 12,
        downvotes: 1,
        bullBearVote: 'Neutral',
        bull_bear: 'Neutral',
      }
    ]
  },
  {
    id: 'c-3',
    comment_id: 3,
    username: 'AlphaHunter',
    reputation: 3200,
    reputationScore: 3200,
    badge: 'Precision Lead',
    avatar: personSilhouetteDataUri({ name: 'AlphaHunter', seed: 'alpha' }),
    timestamp: '4h ago',
    content: 'Retail is heavily shorting this level. Liquidity grab to the upside seems inevitable before any real correction.',
    text: 'Retail is heavily shorting this level. Liquidity grab to the upside seems inevitable before any real correction.',
    upvotes: 85,
    downvotes: 12,
    bullBearVote: 'Bull',
    bull_bear: 'Bull',
  }
];

const mockDiscussions: DiscussionNode[] = [
  {
    id: 'd-1',
    title: "Will Bitcoin hit $100k this cycle?",
    category: "Cryptocurrency",
    author: "David Kim",
    authorAvatar: personSilhouetteDataUri({ name: "David Kim", seed: "david" }),
    comments: 284,
    likes: 1250,
    views: 18200,
    timestamp: "2h ago",
    trending_score: 98,
    content: "The institutional absorption rate of the Spot ETFs is unprecedented. If we maintain the current daily inflow of $500M, the supply crunch alone could push us past six figures by Q4. What is the community consensus on the next major resistance node?",
    asset_tag: "BTC"
  },
  {
    id: 'd-2',
    title: "Are AI stocks in a technical bubble?",
    category: "Stocks",
    author: "Sophia Martinez",
    authorAvatar: personSilhouetteDataUri({ name: "Sophia Martinez", seed: "sophia" }),
    comments: 192,
    likes: 840,
    views: 13400,
    timestamp: "5h ago",
    trending_score: 85,
    content: "Valuations for NVDA and the secondary chip cluster are reaching 2000-era dotcom levels on a price-to-sales basis. While revenue growth is real, is the forward guidance pricing in too much perfection? Analyzing the historical exit of late-cycle retail buyers.",
    asset_tag: "NVDA"
  }
];

const mockTopics: TrendingTopic[] = [
  { name: "Bitcoin ETFs", engagement: 8200, count: 12 },
  { name: "AI Stocks", engagement: 7600, count: 8 },
  { name: "Federal Reserve Policy", engagement: 6900, count: 15 },
  { name: "Recession Risk", engagement: 5400, count: 6 },
  { name: "Tech Earnings Season", engagement: 4200, count: 9 },
];

export const getReputationData = async (): Promise<ApiResponse<ReputationSystemData>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { data: mockReputationData, status: 200 };
};

const mockReputationData: ReputationSystemData = {
  currentUser: {
    id: 'u-current',
    name: 'Eleanor Vance',
    username: 'econvance',
    avatar: personSilhouetteDataUri({ name: 'Eleanor Vance', seed: 'econvance' }),
    reputation_score: 92,
    level: 'Community Authority',
    followers: 21500,
    articles: 84,
    comments: 520,
    helpful_votes: 1240,
    engagement_score: 96
  },
  leaderboard: [],
  history: [],
  available_badges: ["Top Author", "Market Expert", "Community Helper", "Research Specialist", "Discussion Leader"]
};

export const getAssetSentiment = async (): Promise<ApiResponse<AssetSentiment[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { data: [], status: 200 };
};

export const getUserSentimentHistory = async (): Promise<ApiResponse<UserSentimentVote[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { data: [], status: 200 };
};

export const getPredictionContests = async (): Promise<ApiResponse<PredictionContest[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { data: [], status: 200 };
};

export const getContestLeaderboard = async (id: string): Promise<ApiResponse<ContestLeaderboardEntry[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { data: [], status: 200 };
};

export const getUserPredictions = async (): Promise<ApiResponse<UserPrediction[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { data: [], status: 200 };
};

const mockReputationList: ReputationEntry[] = [];
const mockLeaderboardsFull: LeaderboardItem[] = [];
const mockRankedUsers: RankedUser[] = [];

const mockCommunityRankings: CommunityRankingsData = {
  leaderboard: mockRankedUsers,
  categories: ["Global Rankings"]
};

export const getCommunityRankings = async (): Promise<ApiResponse<CommunityRankingsData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockCommunityRankings,
    status: 200,
  };
};

export const getCommunityData = async (): Promise<ApiResponse<CommunityData>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: {
      comments: mockComments,
      trendingDiscussions: ['Yield Curve 2026', 'Fed Liquidity', 'AI Chip Wars'],
      polls: [],
      userReputation: {
        username: 'User123',
        reputationScore: 120,
        level: 14,
        nextLevelProgress: 65,
        activityPoints: 120,
        badges: []
      },
      leaderboard: [],
      predictionContests: [],
      reputation_list: [],
      leaderboards_full: [],
      discussions: mockDiscussions,
      topics: mockTopics
    },
    status: 200,
  };
};
