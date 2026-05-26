import { ApiResponse } from '@/types';
import { 
  CommunityData, 
  Comment, 
  Poll, 
  UserReputation, 
  LeaderboardEntry, 
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
  ReputationSystemData,
  ReputationUser,
  DebateNode,
  DebateLeaderboardEntry
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
    avatar: 'https://picsum.photos/seed/user1/200/200',
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
        avatar: 'https://picsum.photos/seed/wealth/200/200',
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
    avatar: 'https://picsum.photos/seed/alpha/200/200',
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
    authorAvatar: "https://picsum.photos/seed/david/100/100",
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
    authorAvatar: "https://picsum.photos/seed/sophia/100/100",
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

/**
 * Prompt 66: Debate Room Mock Data
 */
const mockDebates: DebateNode[] = [
  {
    id: 'deb-1',
    topic: "Will Bitcoin reach $100k this cycle?",
    asset: "BTC",
    category: "Cryptocurrency",
    bull_participants: 4,
    bear_participants: 3,
    comments: 182,
    views: 9400,
    status: "Active",
    summary: "A structured clash between institutional-adoption bulls and regulatory-headwind bears.",
    moderator_notes: "Focus on spot ETF flows vs. potential QT tightening cycles.",
    bull_arguments: [
      { id: 'arg-1', user: "Julian Wealth", avatar: "https://picsum.photos/seed/julian/100/100", role: "Expert Analyst", reputation: 8500, content: "The institutional bid from Spot ETFs creates a supply-demand imbalance that hasn't been priced in. 100k is the psychological floor.", likes: 42, replies: 12, timestamp: "2h ago" },
      { id: 'arg-2', user: "Sarah Crypto", avatar: "https://picsum.photos/seed/sarah/100/100", role: "Analyst", reputation: 3200, content: "Post-halving cycles historically show 3x returns. We're only 40% into the expansion phase.", likes: 15, replies: 4, timestamp: "1h ago" }
    ],
    bear_arguments: [
      { id: 'arg-3', user: "Eleanor Vance", avatar: "https://picsum.photos/seed/eleanor/100/100", role: "Market Strategist", reputation: 9200, content: "Inflation remains sticky. If the Fed maintains 'Higher for Longer', the liquidity needed for a 100k push won't materialize.", likes: 38, replies: 8, timestamp: "3h ago" }
    ],
    timeline: [
      { timestamp: "2026-03-10", event: "Debate node established.", type: "start" },
      { timestamp: "2026-03-12", event: "Julian Wealth posted the Primary Bull Case.", type: "argument" },
      { timestamp: "2026-03-14", event: "Community vote threshold reached.", type: "vote" }
    ],
    community_votes: { bull: 65, bear: 25, neutral: 10 }
  },
  {
    id: 'deb-2',
    topic: "Is Tesla still overvalued?",
    asset: "TSLA",
    category: "Stocks",
    bull_participants: 2,
    bear_participants: 4,
    comments: 124,
    views: 6800,
    status: "Active",
    summary: "Analyzing Tesla as an AI/Robotics play vs. a traditional automotive manufacturer.",
    bull_arguments: [], bear_arguments: [], timeline: [], community_votes: { bull: 40, bear: 50, neutral: 10 }
  }
];

const mockDebateLeaderboard: DebateLeaderboardEntry[] = [
  { rank: 1, name: "Andrew Collins", debates_won: 14, reputation: 91, avatar: "https://picsum.photos/seed/andrew/100/100" },
  { rank: 2, name: "Lina Rodriguez", debates_won: 11, reputation: 88, avatar: "https://picsum.photos/seed/lina/100/100" },
  { rank: 3, name: "Mark Sterling", debates_won: 9, reputation: 82, avatar: "https://picsum.photos/seed/mark/100/100" }
];

export const getDebates = async (): Promise<ApiResponse<DebateNode[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { data: mockDebates, status: 200 };
};

export const getDebateLeaderboard = async (): Promise<ApiResponse<DebateLeaderboardEntry[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { data: mockDebateLeaderboard, status: 200 };
};

export const getReputationData = async (): Promise<ApiResponse<ReputationSystemData>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { data: mockReputationData, status: 200 };
};

const mockReputationData: ReputationSystemData = {
  currentUser: {
    id: 'u-current',
    name: 'Eleanor Vance',
    username: 'econvance',
    avatar: 'https://picsum.photos/seed/eleanor/200/200',
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
      topics: mockTopics,
      debates: mockDebates,
      debate_leaderboard: mockDebateLeaderboard
    },
    status: 200,
  };
};
