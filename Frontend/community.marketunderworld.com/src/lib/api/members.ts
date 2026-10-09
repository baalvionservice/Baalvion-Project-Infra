// Member profiles: every buyer and seller has a permanent member number (HR-12345678) and a public
// profile at /u/HR-12345678/<name>. Calls go through the same-origin commerce proxy.

const PROXY_BASE = '/api/commerce-proxy';

export interface RoadmapStep { key: string; label: string; done: boolean; href: string }

export interface SellerOverview {
  application: { id: string; status: 'pending' | 'approved' | 'rejected'; storeName: string; rejectionReason: string | null };
  tokens: number;
  rating: { average: number | null; count: number };
  listings: { draft: number; pending_review: number; published: number; rejected: number; archived: number };
  categories: { id: string; categoryId: string; name: string | null; status: string }[];
  sales: { orders: number; paid: number; toFulfil: number; shipped: number; delivered: number; toRate: number; revenue: Record<string, number> };
  roadmap: { steps: RoadmapStep[]; next: RoadmapStep | null; completed: number; total: number };
}

export interface MyMember {
  memberNumber: string;
  displayName: string;
  customName: boolean;
  profilePath: string;
  memberSince: string;
  isSeller: boolean;
  seller: SellerOverview | null;
}

export interface PublicMember {
  memberNumber: string;
  displayName: string;
  profilePath: string;
  memberSince: string;
  isSeller: boolean;
  seller: { storeName: string; categories: string[]; liveListings: number; completedSales: number; rating: { average: number | null; count: number } } | null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const getMyMember = () => call<MyMember>('/members/me');
export const setMyDisplayName = (displayName: string) =>
  call<MyMember>('/members/me', { method: 'PUT', body: JSON.stringify({ displayName }) });

// Server-side only (the public profile page): reads the upstream directly.
export async function getPublicMember(memberNumber: string): Promise<PublicMember | null> {
  const base = process.env.COMMERCE_UPSTREAM_URL ?? '';
  try {
    const res = await fetch(`${base}/members/${encodeURIComponent(memberNumber)}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()).data as PublicMember;
  } catch {
    return null;
  }
}

export interface MemberListing { id: string; name: string; slug: string; categorySlug: string | null; price: number | null; currency: string | null; imageUrl: string | null }

// Server-side only (the public profile page). Members with marketplace access see a seller's live
// listings; everyone else gets a reason so the page can show the right prompt.
export async function getMemberListings(memberNumber: string, accessToken: string | undefined): Promise<{ status: 'ok'; items: MemberListing[] } | { status: 'signin' | 'pass' | 'error' }> {
  if (!accessToken) return { status: 'signin' };
  const base = process.env.COMMERCE_UPSTREAM_URL ?? '';
  try {
    const res = await fetch(`${base}/members/${encodeURIComponent(memberNumber)}/listings`, { headers: { authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    if (res.status === 401) return { status: 'signin' };
    if (res.status === 402) return { status: 'pass' };
    if (!res.ok) return { status: 'error' };
    return { status: 'ok', items: (await res.json()).data as MemberListing[] };
  } catch {
    return { status: 'error' };
  }
}
