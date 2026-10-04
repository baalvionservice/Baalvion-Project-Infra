// The signed-in user's notification feed from community-service (browser only, cookie session).
export interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
}

const BASE = '/api/community-proxy/notifications';

async function call<T>(path = '', method = 'GET'): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, { method, credentials: 'include', cache: 'no-store' });
  if (res.status === 401) return null; // signed out: nothing to show, not an error
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as T;
}

export const feed = {
  list: () => call<{ items: FeedItem[]; unread: number }>('?limit=50'),
  markRead: (id: string) => call<{ updated: number }>(`/${id}/read`, 'POST'),
  markAllRead: () => call<{ updated: number }>('/read-all', 'POST'),
  remove: (id: string) => call<{ deleted: number }>(`/${id}`, 'DELETE'),
};
