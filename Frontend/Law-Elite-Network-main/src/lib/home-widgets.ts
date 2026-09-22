import { CONTENT_CACHE_TAG } from '@/lib/cache-tags';

export type HomeWidgetKind = 'breaking' | 'ticker' | 'audio' | 'docket' | 'gallery' | 'shorts';

export interface HomeWidgetItem {
  id: number;
  widget: HomeWidgetKind;
  title: string;
  summary?: string | null;
  source_name?: string | null;
  url?: string | null;
  image_url?: string | null;
  credit?: string | null;
  value?: string | null;
  extra?: Record<string, string> | null;
  event_at?: string | null;
  expires_at?: string | null;
}

export type HomeWidgets = Record<HomeWidgetKind, HomeWidgetItem[]>;

const KINDS: HomeWidgetKind[] = ['breaking', 'ticker', 'audio', 'docket', 'gallery', 'shorts'];
const empty = (): HomeWidgets => Object.fromEntries(KINDS.map((k) => [k, []])) as unknown as HomeWidgets;

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

/**
 * Live, admin-published homepage entries. Tagged with CONTENT_CACHE_TAG so an
 * admin save busts this immediately via /api/revalidate's revalidateTag(),
 * the same as every other CMS/law-service read on the site -- that, not the
 * window below, is what makes a save appear. The window is only the safety
 * net for when that webhook never fires (see cache-tags.ts), so it can be the
 * site's normal minimum: an expired breaking item still gets filtered out of
 * the response below on every regenerate, it just lingers up to 15 extra
 * minutes past its expiry in the worst case, which costs far less than the
 * 24x-a-day regeneration a short fetch window silently forces on every route
 * that reaches this (this exact mistake already blew through Vercel's ISR
 * quota once — see scripts/check-cache-hygiene.mjs). Falls back to "nothing"
 * (every widget hides) when law-service is down.
 */
export async function getHomeWidgets(): Promise<HomeWidgets> {
  if (!/^https?:\/\//i.test(BASE_URL)) return empty();
  try {
    const r = await fetch(`${BASE_URL}/home-widgets`, { next: { revalidate: 900, tags: [CONTENT_CACHE_TAG] }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return empty();
    const body = await r.json();
    const out = empty();
    const now = Date.now();
    for (const k of KINDS) {
      const rows: HomeWidgetItem[] = Array.isArray(body?.data?.[k]) ? body.data[k] : [];
      out[k] = rows.filter((i) => !i.expires_at || new Date(i.expires_at).getTime() > now);
    }
    return out;
  } catch {
    return empty();
  }
}
