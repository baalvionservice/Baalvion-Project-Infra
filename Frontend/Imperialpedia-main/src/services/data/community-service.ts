import * as mockApi from '@/services/mock-api/community';
import { ApiResponse, CommunityData, CommunityRankingsData, AssetSentiment, UserSentimentVote, DiscussionNode, ReputationSystemData, DebateNode, DebateLeaderboardEntry } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Community/engagement data. Discussions are LIVE from imperialpedia-service's
 * forum (`/community/posts`); the richer debate/sentiment/reputation sub-features remain on
 * mock until they get dedicated backends. Mock fallback throughout.
 */

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3004/api/v1');

const DISCUSSION_CATEGORIES = new Set([
  'Stocks', 'Cryptocurrency', 'Macro', 'Economy', 'Trading', 'Personal Finance', 'Options Trading', 'Commodities',
]);

// Forum post (community_posts) → DiscussionNode.
function postToDiscussion(p: {
  id: number | string; title: string; content: string; category?: string | null;
  author_name?: string | null; upvotes?: number; comments_count?: number; tags?: string[];
  created_at?: string;
}): DiscussionNode {
  const category = (p.category && DISCUSSION_CATEGORIES.has(p.category) ? p.category : 'Macro') as DiscussionNode['category'];
  const likes = p.upvotes ?? 0;
  const comments = p.comments_count ?? 0;
  return {
    id: String(p.id),
    title: p.title,
    category,
    author: p.author_name || 'Member',
    authorAvatar: `https://picsum.photos/seed/${encodeURIComponent(p.author_name || String(p.id))}/80/80`,
    comments,
    likes,
    views: likes * 8 + comments * 3,
    timestamp: p.created_at || new Date().toISOString(),
    trending_score: likes + comments,
    content: p.content,
    asset_tag: p.tags?.[0],
  };
}

async function fetchLiveDiscussions(): Promise<DiscussionNode[]> {
  const res = await fetch(`${IMP_API}/community/posts?limit=50`, { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  const items = json?.data?.items ?? [];
  return items.map(postToDiscussion);
}

// Debates + sentiment are stored as full frontend objects (meta) on imperialpedia-service
// and returned as a plain array under `data`.
async function fetchLive<T>(path: string): Promise<T[]> {
  const res = await fetch(`${IMP_API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  return (json?.data ?? []) as T[];
}

export const communityService = {
  async getCommunityData(): Promise<ApiResponse<CommunityData | null>> {
    try {
      const base = await mockApi.getCommunityData();
      try {
        const live = await fetchLiveDiscussions();
        if (live.length > 0 && base.data) {
          return { ...base, data: { ...base.data, discussions: live } };
        }
      } catch {
        /* keep mock discussions */
      }
      return base;
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getReputationData(): Promise<ApiResponse<ReputationSystemData | null>> {
    try {
      return await mockApi.getReputationData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getRankings(): Promise<ApiResponse<CommunityRankingsData | null>> {
    try {
      return await mockApi.getCommunityRankings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAssetSentiment(): Promise<ApiResponse<AssetSentiment[]>> {
    try {
      const live = await fetchLive<AssetSentiment>('/community/sentiment');
      if (live.length > 0) return { data: live, status: 200 };
      return await mockApi.getAssetSentiment();
    } catch (error) {
      try { return await mockApi.getAssetSentiment(); } catch { /* noop */ }
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getUserSentimentHistory(): Promise<ApiResponse<UserSentimentVote[]>> {
    try {
      return await mockApi.getUserSentimentHistory();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDiscussions(): Promise<ApiResponse<DiscussionNode[]>> {
    try {
      const live = await fetchLiveDiscussions();
      if (live.length > 0) return { data: live, status: 200 };
      const response = await mockApi.getCommunityData();
      return { data: response.data?.discussions || [], status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getDebates(): Promise<ApiResponse<DebateNode[]>> {
    try {
      const live = await fetchLive<DebateNode>('/community/debates');
      if (live.length > 0) return { data: live, status: 200 };
      return await mockApi.getDebates();
    } catch (error) {
      try { return await mockApi.getDebates(); } catch { /* noop */ }
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getDebateLeaderboard(): Promise<ApiResponse<DebateLeaderboardEntry[]>> {
    try {
      const live = await fetchLive<DebateLeaderboardEntry>('/community/debates-leaderboard');
      if (live.length > 0) return { data: live, status: 200 };
      return await mockApi.getDebateLeaderboard();
    } catch (error) {
      try { return await mockApi.getDebateLeaderboard(); } catch { /* noop */ }
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  }
};
