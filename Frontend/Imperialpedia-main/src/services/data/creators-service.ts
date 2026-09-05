import { CreatorProfile, ApiResponse, CreatorLeaderboard, CreatorVerification, CreatorContentItem, Follower } from "@/types";
import { TopCreator } from "@/types/analytics";
import { errorHandler } from "@/lib/errors/error-handler";
import authClient from "@/lib/auth-client";
import { personSilhouetteDataUri } from "@baalvion/illustrations";

/**
 * @fileOverview Creator data — LIVE from imperialpedia-service (`/creators`), where each row
 * carries the full public profile in `meta`.
 *
 * Deliberately has NO mock-data fallback. This used to fall back to `@/services/mock-api/creators`
 * (fabricated creators with invented follower/revenue/engagement numbers, e.g. every leaderboard
 * entry sharing an identical hardcoded $15,400.50 "revenue" figure) whenever the live set was
 * empty or unreachable — which meant deleting real creator data made the fake data silently
 * reappear instead of the page going honestly empty. See FeatureUnavailable's doc comment for
 * the site-wide policy this violated. Every function below now returns real data or an honest
 * empty/error result — nothing fabricated, ever.
 */

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1"
    : "http://localhost:3004/api/v1");

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
    avatar:
      r.avatar_url ||
      personSilhouetteDataUri({
        name: r.display_name || `Creator ${r.user_id ?? ""}`,
        seed: String(r.user_id),
      }),
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

// Cached, not `no-store`: this is reached from /transparency (a public page that
// declares `revalidate = 3600`), and a no-store fetch silently overrode that —
// the build failed the page's prerender with DYNAMIC_SERVER_USAGE and shipped it
// as ƒ, so every crawler hit re-rendered it from scratch. The creator roster
// changes on the order of weeks; an hour is far fresher than it needs to be.
const CREATOR_ROSTER_REVALIDATE_SECONDS = 3600;

async function fetchCreatorProfiles(): Promise<CreatorProfile[]> {
  const res = await fetch(`${IMP_API}/creators?limit=100`, {
    next: { revalidate: CREATOR_ROSTER_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  const items: Row[] = json?.data?.items ?? [];
  return items.map(rowToProfile).filter(Boolean) as CreatorProfile[];
}

// likes/comments/shares/revenue are 0, not estimated — there is no real engagement
// or revenue backend for creators yet, and inventing numbers from a view-count
// multiplier (the previous `views * 0.05` etc.) presents fabricated data as if real.
const toTopCreator = (p: CreatorProfile): TopCreator => ({
  id: p.id,
  name: p.displayName,
  avatar: p.avatar,
  totalContent: p.stats.articlesCount,
  likes: 0,
  comments: 0,
  shares: 0,
  followers: p.stats.followersCount,
  engagementRate: p.stats.engagementScore || 0,
  revenue: 0,
  verified: p.verified,
  category: p.category,
});

export const creatorsService = {
  async getCreators(): Promise<ApiResponse<CreatorProfile[]>> {
    try {
      return { data: await fetchCreatorProfiles(), status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getCreatorByUsername(
    username: string
  ): Promise<ApiResponse<CreatorProfile | null>> {
    try {
      const live = await fetchCreatorProfiles();
      const found = live.find((c) => c.username === username || c.id === username);
      return { data: found ?? null, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },

  async getTopCreators(): Promise<ApiResponse<TopCreator[]>> {
    try {
      const live = await fetchCreatorProfiles();
      const data = live
        .map(toTopCreator)
        .sort((a, b) => (b.followers || 0) - (a.followers || 0));
      return { data, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  // Individual creator profile — LIVE via the same `/creators` list the discovery
  // page and leaderboard already use, so `/creator/[id]` always shows the exact
  // same record as `/creators`.
  async getCreatorById(id: string): Promise<ApiResponse<CreatorProfile | null>> {
    try {
      const live = await fetchCreatorProfiles();
      const found = live.find((c) => c.id === id || c.username === id);
      return { data: found ?? null, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: null, status: appError.statusCode, error: appError.message };
    }
  },
};

type ArticleRow = {
  id?: number | string;
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: string;
  published_at?: string;
  created_at?: string;
  views_count?: number;
  likes_count?: number;
};

function rowToContentItem(r: ArticleRow): CreatorContentItem {
  return {
    id: String(r.id ?? r.slug ?? ""),
    title: r.title || "",
    body: r.content || r.summary || "",
    snippet: r.summary || "",
    category: r.category || "General",
    tags: Array.isArray(r.tags) ? r.tags : [],
    status: (r.status === "draft" || r.status === "scheduled" ? r.status : "published") as CreatorContentItem["status"],
    createdAt: r.published_at || r.created_at || new Date().toISOString(),
    views: r.views_count || 0,
    likes: r.likes_count || 0,
    comments: 0,
    reads: r.views_count || 0,
    slug: r.slug || "",
  };
}

// Creator's own published articles — LIVE from `/creators/:id/articles`. No mock
// fallback: an honest empty list when a creator has no live articles yet.
export async function getCreatorContent(creatorId: string): Promise<ApiResponse<CreatorContentItem[]>> {
  try {
    const res = await fetch(`${IMP_API}/creators/${encodeURIComponent(creatorId)}/articles?limit=100`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const items: ArticleRow[] = json?.data?.items ?? [];
    return { data: items.map(rowToContentItem), status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: [], status: appError.statusCode, error: appError.message };
  }
}

// Follower/following graphs — imperialpedia-service has no social-graph endpoint yet.
// No mock fallback: an honest empty list rather than fabricated follower names.
export async function getFollowers(creatorId: string): Promise<ApiResponse<Follower[]>> {
  try {
    const res = await fetch(`${IMP_API}/creators/${encodeURIComponent(creatorId)}/followers`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const items: Follower[] = json?.data ?? [];
    return { data: items, status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: [], status: appError.statusCode, error: appError.message };
  }
}

export async function getFollowing(creatorId: string): Promise<ApiResponse<Follower[]>> {
  try {
    const res = await fetch(`${IMP_API}/creators/${encodeURIComponent(creatorId)}/following`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const items: Follower[] = json?.data ?? [];
    return { data: items, status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: [], status: appError.statusCode, error: appError.message };
  }
}

// Creator leaderboard (ranked directory) — derived from the live creator profiles so it
// stays consistent with /creators. No mock fallback: an honest empty list when there
// are no live creators, rather than fabricated names with an identical invented
// "revenue" figure (the previous mock set's totalRevenue: 15400.5 on every entry).
// totalRevenue/totalLikes are real 0, not a views-based estimate — there is no real
// revenue or likes backend for creators yet.
export async function getLeaderboardData(): Promise<ApiResponse<CreatorLeaderboard[]>> {
  try {
    const live = await fetchCreatorProfiles();
    const data: CreatorLeaderboard[] = live
      .map((p) => ({
        creatorId: p.id,
        name: p.displayName,
        profileImage: p.avatar,
        category: p.category,
        region: p.region,
        verified: p.verified,
        totalRevenue: 0,
        totalViews: p.stats.totalViews || 0,
        totalLikes: 0,
      }))
      .sort((a, b) => b.totalViews - a.totalViews);
    return { data, status: 200 };
  } catch (error) {
    const appError = errorHandler.handleError(error);
    return { data: [], status: appError.statusCode, error: appError.message };
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
export const getCreatorById = creatorsService.getCreatorById;
