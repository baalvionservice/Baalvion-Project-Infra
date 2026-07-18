// Real community-service integration — replaces the mock forum data model entirely
// (src/lib/mock-forum-data.ts, the forum-related exports in src/lib/api-mock.ts, and
// types.ts's ForumThread/ForumReply/Thread). Every call goes through the same-origin
// /api/community-proxy/* bridge (see src/app/api/community-proxy/[...path]/route.ts),
// which is the one place the httpOnly access_token cookie gets translated into the
// Bearer header community-service's authMiddleware expects — this file never touches
// tokens directly, so it works the same from Server Components, Client Components, and
// Route Handlers alike.

const PROXY_BASE = '/api/community-proxy';

export type CommunityAccessModel = 'free' | 'invite_only' | 'request_approval' | 'paid';
export type MembershipStatus = 'invited' | 'requested' | 'approved' | 'paid' | 'rejected' | 'banned' | 'cancelled' | 'expired';

export interface Community {
    slug: string;
    name: string;
    description: string | null;
    accessModel: CommunityAccessModel;
    // False for the platform-wide access tiers (marketplace-access/global-elite/vip-access) —
    // they're modeled as communities for shared membership/billing plumbing but have no NodeBB
    // category and aren't discussion forums. Used to keep the forum hub from listing them.
    isForum: boolean;
}

export interface CommunityDetail extends Community {
    membership: { role: string; status: MembershipStatus; tier: string | null } | null;
}

interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    error?: { code: string; message: string };
}

function absoluteUrl(path: string): string {
    // Server Components need an absolute URL; the browser resolves a relative one fine.
    if (typeof window !== 'undefined') return path;
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return `${base}${path}`;
}

async function communityFetch<T>(path: string, init: RequestInit = {}, revalidate?: number): Promise<T> {
    const res = await fetch(absoluteUrl(`${PROXY_BASE}${path}`), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers || {}) },
        credentials: 'include',
        ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
    });
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    if (!res.ok || body.success === false) {
        throw new Error(body.error?.message || `community API ${path} failed: ${res.status}`);
    }
    return body.data;
}

export async function getCommunities(): Promise<Community[]> {
    try {
        return await communityFetch<Community[]>('/public/communities', {}, 60);
    } catch {
        return [];
    }
}

export async function getCommunity(slug: string): Promise<CommunityDetail | null> {
    try {
        return await communityFetch<CommunityDetail>(`/communities/${slug}`);
    } catch {
        return null;
    }
}

export async function joinCommunity(slug: string, message?: string) {
    return communityFetch<{ slug: string; membership: { role: string; status: MembershipStatus } }>(
        `/communities/${slug}/join`,
        { method: 'POST', body: JSON.stringify({ message }) },
    );
}

export async function redeemInvite(token: string) {
    return communityFetch<{ slug: string; membership: { role: string; status: MembershipStatus } }>(
        `/invites/${token}/redeem`,
        { method: 'POST' },
    );
}

export interface ForumThread {
    tid: string;
    title: string;
    slug?: string;
    timestamp: number;
    postcount: number;
    viewcount: number;
    user?: { username?: string; picture?: string | null };
}

export interface ForumPost {
    pid: string;
    content: string;
    timestamp: number;
    user?: { username?: string; picture?: string | null };
}

export async function getThreads(slug: string): Promise<ForumThread[]> {
    try {
        const data = await communityFetch<{ topics?: ForumThread[] } | ForumThread[]>(`/communities/${slug}/threads`);
        return Array.isArray(data) ? data : data.topics ?? [];
    } catch {
        return [];
    }
}

interface ForumThreadDetail extends ForumThread {
    posts?: ForumPost[];
}

export async function getThread(slug: string, tid: string): Promise<{ thread: ForumThread; posts: ForumPost[] } | null> {
    try {
        const data = await communityFetch<ForumThreadDetail>(`/communities/${slug}/threads/${tid}`);
        return { thread: data, posts: data.posts ?? [] };
    } catch {
        return null;
    }
}

export async function createThread(slug: string, title: string, content: string) {
    return communityFetch<{ tid: string }>(`/communities/${slug}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    });
}

export async function createReply(slug: string, tid: string, content: string) {
    return communityFetch<{ pid: string }>(`/communities/${slug}/threads/${tid}/posts`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

// Paid-tier checkout — crypto (USDT-TRC20, ETH-BEP20, or BTC) only, no other payment method
// exists for community/access-tier memberships. See community-service's service/billingService.js
// + payment-service's CryptoGateway for the full non-custodial flow (merchant's own wallet, no
// address generated or held by this app).
export type CryptoAsset = 'USDT_TRC20' | 'ETH_BEP20' | 'BTC';

export interface CryptoCheckout {
    chargeId: string;
    asset: CryptoAsset;
    network: string;
    address: string;
    /** Raw numeric amount, no unit suffix (e.g. "0.00081235") — for building a BIP21 QR URI. */
    amountValue: string;
    amountDisplay: string;
    expiresAt: string;
}

export async function checkoutCommunity(slug: string, asset: CryptoAsset): Promise<CryptoCheckout> {
    return communityFetch<CryptoCheckout>(`/communities/${slug}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ asset }),
    });
}

// Admin console (platform-admin only — see community-service's requirePlatformAdmin gate).
export interface PendingJoinRequest {
    id: string;
    user_id: string;
    message: string | null;
    created_at: string;
    community: { slug: string; name: string };
}

export interface ModerationLogEntry {
    id: string;
    action: string;
    actor_user_id: string;
    target_user_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
    community: { slug: string; name: string } | null;
}

export async function getAllPendingJoinRequests(): Promise<PendingJoinRequest[]> {
    try {
        return await communityFetch<PendingJoinRequest[]>('/admin/join-requests');
    } catch {
        return [];
    }
}

export async function decideJoinRequest(requestId: string, approve: boolean) {
    return communityFetch(`/admin/join-requests/${requestId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
    });
}

export async function getAllModerationLogs(): Promise<ModerationLogEntry[]> {
    try {
        return await communityFetch<ModerationLogEntry[]>('/admin/moderation-logs');
    } catch {
        return [];
    }
}

// Per-community member management (moderator+ can view, admin can change role/ban — see
// community-service's requireCommunityRole gate on GET/POST/DELETE .../members).
export type CommunityRole = 'member' | 'moderator' | 'admin';

export interface CommunityMember {
    userId: string;
    email: string | null;
    role: CommunityRole;
    status: MembershipStatus;
    tier: string | null;
    createdAt: string;
}

export async function getCommunityMembers(slug: string): Promise<CommunityMember[]> {
    try {
        return await communityFetch<CommunityMember[]>(`/admin/communities/${slug}/members`);
    } catch {
        return [];
    }
}

export async function setMemberRole(slug: string, userId: string, role: CommunityRole) {
    return communityFetch(`/admin/communities/${slug}/members/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ role }),
    });
}

export async function setMemberStatus(slug: string, userId: string, status: 'approved' | 'banned') {
    return communityFetch(`/admin/communities/${slug}/members/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ status }),
    });
}

export async function revokeMember(slug: string, userId: string) {
    return communityFetch(`/admin/communities/${slug}/members/${userId}`, { method: 'DELETE' });
}

// Reported content queue — flags live in NodeBB itself, community-service just relays +
// enriches them with the owning community (see adminController.listFlags).
export interface FlaggedContent {
    flagId: string;
    type: string;
    state: string;
    reasons: string[];
    reporter: { username?: string; uid?: string | number } | null;
    target: { id: string; content: string | null; title: string | null; author: string | null };
    community: { slug: string; name: string } | null;
    createdAt: string | null;
}

export async function getFlags(): Promise<FlaggedContent[]> {
    try {
        return await communityFetch<FlaggedContent[]>('/admin/flags');
    } catch {
        return [];
    }
}

export async function resolveFlag(
    flagId: string,
    action: 'dismiss' | 'remove',
    opts: { pid?: string; communitySlug?: string | null } = {},
) {
    return communityFetch(`/admin/flags/${flagId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action, pid: opts.pid, communitySlug: opts.communitySlug }),
    });
}
