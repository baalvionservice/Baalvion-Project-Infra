import * as mockApi from "@/services/mock-api/creators";
import { CreatorProfile, ApiResponse, CreatorLeaderboard, CreatorVerification } from "@/types";
import { TopCreator } from "@/types/analytics";
import { errorHandler } from "@/lib/errors/error-handler";
import authClient from "@/lib/auth-client";

/**
 * @fileOverview Creator data — LIVE from imperialpedia-service (`/creators`), where each row
 * carries the full public profile in `meta`. Falls back to the mock set when the service has
 * no creators yet or is unreachable.
 */

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || "http://localhost:3004/api/v1";

type Row = {
  meta?: Partial<CreatorProfile>;
  user_id?: number;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  specialization?: string[];
  article_count?: number;
  followers_count?: number;
  total_views?: number;
  is_verified?: boolean;
  created_at?: string;
};

// Build a complete, render-safe CreatorProfile from a row. Profiles created via the rich
// seed carry the full object in `meta`; profiles created via updateCreator only have base
// columns (meta = {}), so we synthesize the required fields from them. Never returns a
// profile with undefined displayName/bio/specialties/stats (the discovery UI assumes them).
function rowToProfile(r: Row): CreatorProfile | null {
  if (r.meta && r.meta.displayName) return r.meta as CreatorProfile;
  if (!r.user_id && !r.display_name) return null;
  return {
    id: String(r.user_id ?? ""),
    username: String(r.user_id ?? ""),
    displayName: r.display_name || `Creator ${r.user_id ?? ""}`,
    title: "Contributor",
    bio: r.bio || "",
    avatar: r.avatar_url || `https://picsum.photos/seed/creator-${r.user_id}/200/200`,
    joinedDate: r.created_at || new Date().toISOString(),
    specialties: Array.isArray(r.specialization) ? r.specialization : [],
    category: "General",
    region: "Global",
    verified: !!r.is_verified,
    stats: {
      followersCount: r.followers_count || 0,
      followingCount: 0,
      articlesCount: r.article_count || 0,
      totalViews: r.total_views || 0,
    },
    content: { recentArticles: [] },
    socialLinks: [],
  };
}

async function fetchCreatorProfiles(): Promise<CreatorProfile[]> {
  const res = await fetch(`${IMP_API}/creators?limit=100`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  const items: Row[] = json?.data?.items ?? [];
  return items.map(rowToProfile).filter(Boolean) as CreatorProfile[];
}

const toTopCreator = (p: CreatorProfile): TopCreator => ({
  id: p.id,
  name: p.displayName,
  avatar: p.avatar,
  totalContent: p.stats.articlesCount,
  likes: Math.floor((p.stats.totalViews || 0) * 0.05),
  comments: Math.floor((p.stats.totalViews || 0) * 0.02),
  shares: Math.floor((p.stats.totalViews || 0) * 0.01),
  followers: p.stats.followersCount,
  engagementRate: p.stats.engagementScore || 5,
  revenue: 0,
  verified: p.verified,
  category: p.category,
});

export const creatorsService = {
  async getCreators(): Promise<ApiResponse<CreatorProfile[]>> {
    try {
      const live = await fetchCreatorProfiles();
      if (live.length > 0) return { data: live, status: 200 };
      return await mockApi.getCreators();
    } catch (error) {
      try {
        return await mockApi.getCreators();
      } catch {
        const appError = errorHandler.handleError(error);
        return { data: [], status: appError.statusCode, error: appError.message };
      }
    }
  },

  async getCreatorByUsername(
    username: string
  ): Promise<ApiResponse<CreatorProfile | null>> {
    try {
      const live = await fetchCreatorProfiles();
      const found = live.find((c) => c.username === username || c.id === username);
      if (found) return { data: found, status: 200 };
      return await mockApi.getCreatorByUsername(username);
    } catch (error) {
      try {
        return await mockApi.getCreatorByUsername(username);
      } catch {
        const appError = errorHandler.handleError(error);
        return { data: null, status: appError.statusCode, error: appError.message };
      }
    }
  },

  async getTopCreators(): Promise<ApiResponse<TopCreator[]>> {
    try {
      const live = await fetchCreatorProfiles();
      if (live.length > 0) {
        const data = live
          .map(toTopCreator)
          .sort((a, b) => (b.followers || 0) - (a.followers || 0));
        return { data, status: 200 };
      }
      return await mockApi.getTopCreators();
    } catch (error) {
      try {
        return await mockApi.getTopCreators();
      } catch {
        const appError = errorHandler.handleError(error);
        return { data: [], status: appError.statusCode, error: appError.message };
      }
    }
  },
};

// Creator leaderboard (ranked directory) — derived from the live creator profiles so it
// stays consistent with /creators; mock fallback when the service is empty/unreachable.
export async function getLeaderboardData(): Promise<ApiResponse<CreatorLeaderboard[]>> {
  try {
    const live = await fetchCreatorProfiles();
    if (live.length > 0) {
      const data: CreatorLeaderboard[] = live
        .map((p) => ({
          creatorId: p.id,
          name: p.displayName,
          profileImage: p.avatar,
          category: p.category,
          region: p.region,
          verified: p.verified,
          totalRevenue: Math.round((p.stats.totalViews || 0) * 0.01),
          totalViews: p.stats.totalViews || 0,
          totalLikes: Math.round((p.stats.totalViews || 0) * 0.05),
        }))
        .sort((a, b) => b.totalViews - a.totalViews);
      return { data, status: 200 };
    }
    return await mockApi.getLeaderboardData();
  } catch {
    return mockApi.getLeaderboardData();
  }
}

// ── Creator verification (admin workflow) — LIVE from imperialpedia-service ─────
// No mock fallback: the admin queue must reflect real pending requests (empty if none).
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await authClient.getValidToken().catch(() => null);
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init.headers as Record<string, string>) || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${IMP_API}${path}`, { ...init, headers });
}

export async function getPendingVerifications(): Promise<ApiResponse<CreatorVerification[]>> {
  try {
    const res = await authedFetch(`/creators/verifications/pending`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return { data: (json?.data ?? []) as CreatorVerification[], status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: [], status: appError.statusCode, error: appError.message };
  }
}

export async function getCreatorVerificationStatus(creatorId: string): Promise<ApiResponse<CreatorVerification>> {
  try {
    const res = await fetch(`${IMP_API}/creators/${creatorId}/verification`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return { data: json?.data as CreatorVerification, status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: null as unknown as CreatorVerification, status: appError.statusCode, error: appError.message };
  }
}

export async function requestVerification(documentsProvided: string[] = []): Promise<ApiResponse<CreatorVerification>> {
  const res = await authedFetch(`/creators/me/verification/request`, {
    method: "POST", body: JSON.stringify({ documentsProvided }),
  });
  const json = await res.json().catch(() => ({}));
  return { data: json?.data as CreatorVerification, status: res.status, error: res.ok ? undefined : json?.error?.message };
}

export async function decideVerification(creatorId: string, decision: "approve" | "reject", rejectionReason?: string): Promise<ApiResponse<CreatorVerification>> {
  const res = await authedFetch(`/creators/${creatorId}/verification/decide`, {
    method: "POST", body: JSON.stringify({ decision, rejectionReason }),
  });
  const json = await res.json().catch(() => ({}));
  return { data: json?.data as CreatorVerification, status: res.status, error: res.ok ? undefined : json?.error?.message };
}

// Export individual functions for convenience
export const getCreators = creatorsService.getCreators;
export const getCreatorByUsername = creatorsService.getCreatorByUsername;
export const getTopCreators = creatorsService.getTopCreators;
