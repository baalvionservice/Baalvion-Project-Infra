/**
 * @fileOverview Type definitions for the platform's community and engagement engine.
 */

export type VoteType = 'Bull' | 'Bear' | 'Neutral';

export interface Comment {
  id: string;
  comment_id: string | number;
  username: string;
  avatar?: string;
  reputation: number;
  reputationScore: number;
  badge?: string;
  timestamp: string;
  content: string;
  text?: string;
  upvotes: number;
  downvotes: number;
  bullBearVote: VoteType;
  bull_bear?: VoteType;
  replies?: Comment[];
  parent_id?: string | number;
  isFlagged?: boolean;
}

/**
 * Prompt 67: Comment Intelligence Types
 */
export type CommentLabel = 'Top Insight' | 'Most Helpful' | 'Expert Opinion' | 'Community Favorite';

export interface IntelligenceCommentNode extends Comment {
  label?: CommentLabel;
  isEditorPick?: boolean;
  isCommunityFavorite?: boolean;
  replies?: IntelligenceCommentNode[];
}

export interface CommentAnalytics {
  total_comments: number;
  top_commenter: string;
  top_liked_comment: number;
  avg_engagement: string;
  sentiment_bias: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface CommentIntelligenceData {
  comments: IntelligenceCommentNode[];
  analytics: CommentAnalytics;
  highlights: {
    editors_pick: IntelligenceCommentNode[];
    top_community: IntelligenceCommentNode[];
  };
}

export interface PollOption {
  option: string;
  votes: number;
}

export interface Poll {
  id: string;
  poll_id?: number | string;
  question: string;
  options: string[] | PollOption[];
  votes: number[]; // For legacy compatibility
  totalVotes: number;
  expiresAt: string;
  closing_date?: string;
  status: 'active' | 'closed' | 'ongoing';
}

export interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Expert';
}

export interface UserReputation {
  username: string;
  reputationScore: number;
  level: number;
  nextLevelProgress: number;
  activityPoints: number;
  badges: CommunityBadge[];
}

/**
 * Prompt 65: Reputation Engine Types
 */
export type ReputationLevelLabel = 'Beginner' | 'Contributor' | 'Trusted Member' | 'Expert Contributor' | 'Community Authority';

export interface ReputationUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  reputation_score: number;
  level: ReputationLevelLabel;
  followers: number;
  articles: number;
  comments: number;
  helpful_votes: number;
  engagement_score: number;
  rank?: number;
}

export interface ReputationHistoryNode {
  date: string;
  score: number;
  contributions: number;
}

export interface ReputationSystemData {
  currentUser: ReputationUser;
  leaderboard: ReputationUser[];
  history: ReputationHistoryNode[];
  available_badges: string[];
}

/**
 * Prompt 62: Prediction Contest Types
 */
export interface UserPrediction {
  id: string;
  contestName: string;
  asset: string;
  prediction: string;
  result: 'Correct' | 'Incorrect' | 'Pending';
  points: number;
  rank?: number;
  date: string;
  reasoning?: string;
  direction?: 'Bull' | 'Bear';
}

export interface ContestLeaderboardEntry {
  rank: number;
  user: string;
  avatar?: string;
  prediction: string;
  accuracy: string;
  points: number;
}

export interface PredictionContest {
  id: string;
  title: string;
  asset: string;
  question: string;
  description: string;
  participants: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  startDate: string;
  endDate: string;
  prize?: string;
  outcome?: string;
  winnerList?: string[];
  assets?: string[]; // Legacy mapping
}

/**
 * Prompt 63: Community Sentiment Types
 */
export interface SentimentTrendNode {
  date: string;
  bullish: number;
  price_proxy: number;
}

export interface AssetSentiment {
  id: string;
  name: string;
  ticker: string;
  bullish: number;
  bearish: number;
  votes: number;
  trend: 'Up' | 'Down' | 'Stable';
  history: SentimentTrendNode[];
}

export interface UserSentimentVote {
  id: string;
  asset: string;
  ticker: string;
  vote: 'Bull' | 'Bear';
  date: string;
  currentBullish: number;
}

/**
 * Prompt 64: Trending Discussion Types
 */
export interface DiscussionNode {
  id: string;
  title: string;
  category: 'Stocks' | 'Cryptocurrency' | 'Macro' | 'Economy' | 'Trading' | 'Personal Finance' | 'Options Trading' | 'Commodities';
  author: string;
  authorAvatar?: string;
  comments: number;
  likes: number;
  views: number;
  timestamp: string;
  trending_score: number;
  content: string;
  asset_tag?: string;
}

export interface TrendingTopic {
  name: string;
  engagement: number;
  count?: number;
}

/**
 * Prompt 66: Debate Room Types
 */
export interface DebateArgument {
  id: string;
  user: string;
  avatar: string;
  role: string;
  reputation: number;
  content: string;
  likes: number;
  replies: number;
  timestamp: string;
}

export interface DebateTimelineEvent {
  timestamp: string;
  event: string;
  type: 'start' | 'argument' | 'vote' | 'end';
}

export interface DebateNode {
  id: string;
  topic: string;
  asset?: string;
  category: 'Stocks' | 'Cryptocurrency' | 'Macro' | 'Economy';
  bull_participants: number;
  bear_participants: number;
  comments: number;
  views: number;
  status: 'Active' | 'Upcoming' | 'Completed';
  summary?: string;
  moderator_notes?: string;
  bull_arguments: DebateArgument[];
  bear_arguments: DebateArgument[];
  timeline: DebateTimelineEvent[];
  community_votes: { bull: number; bear: number; neutral: number };
}

export interface DebateLeaderboardEntry {
  rank: number;
  name: string;
  debates_won: number;
  reputation: number;
  avatar?: string;
}

export interface CommunityData {
  comments: Comment[];
  trendingDiscussions: string[];
  polls: Poll[];
  userReputation: UserReputation;
  leaderboard: LeaderboardEntry[];
  predictionContests: PredictionContest[];
  reputation_list: ReputationEntry[];
  leaderboards_full: LeaderboardItem[];
  discussions: DiscussionNode[];
  topics: TrendingTopic[];
  debates: DebateNode[];
  debate_leaderboard: DebateLeaderboardEntry[];
}

export interface ReputationContribution {
  posts: number;
  comments: number;
  polls: number;
}

export interface ReputationEntry {
  username: string;
  avatar: string;
  reputation_points: number;
  badges: string[];
  contributions: ReputationContribution;
}

export interface LeaderboardItem {
  rank: number;
  username: string;
  avatar: string;
  total_points: number;
  badges?: string[];
  trend?: 'up' | 'down' | 'stable';
}

export interface LeaderboardEntry {
  rank?: number;
  username: string;
  avatar?: string;
  reputation: number;
  reputationScore?: number;
  badges?: string[];
  trend?: 'up' | 'down' | 'stable';
}

export interface RankedUser {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: 'Author' | 'Analyst' | 'Member';
  articles: number;
  followers: number;
  engagement_score: number;
  badge: string;
  reputation: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CommunityRankingsData {
  leaderboard: RankedUser[];
  categories: string[];
}
