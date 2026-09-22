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
 * Live, admin-published homepage entries. Short cache on purpose: a breaking
 * item has an expiry, and the generic 24h content cache would keep it up long
 * after. Falls back to "nothing" (every widget hides) when law-service is down.
 */
export async function getHomeWidgets(): Promise<HomeWidgets> {
  if (!/^https?:\/\//i.test(BASE_URL)) return empty();
  try {
    const r = await fetch(`${BASE_URL}/home-widgets`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
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
