import { fetchPublicApi } from '@/lib/api/public-fetch';
import { embedUrl } from '@/lib/media-url';

export type VideoScope = 'national' | 'international';

export interface HubShow {
  slug: string;
  name: string;
  description: string;
  scope: VideoScope;
  countryCode?: string;
  network?: string;
  coverUrl?: string;
  coverCredit?: string;
  featured: boolean;
}

export interface HubVideo {
  slug: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  thumbnailCredit?: string;
  source?: string;
  showSlug?: string;
  category?: string;
  scope: VideoScope;
  countryCode?: string;
  durationSeconds?: number;
  publishedAt?: string;
  featured: boolean;
}

export interface VideoHub {
  shows: HubShow[];
  videos: HubVideo[];
}

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

/** Live shows and videos from law-service. Empty when it is unreachable, so the page hides rather than erroring. */
export async function getVideoHub(): Promise<VideoHub> {
  const res = await fetchPublicApi('/videos');
  const d = res?.data;
  const shows: HubShow[] = (Array.isArray(d?.shows) ? d.shows : []).map((s: any) => ({
    slug: s.slug, name: s.name, description: s.description || '', scope: s.scope === 'international' ? 'international' : 'national',
    countryCode: clean(s.country_code), network: clean(s.network), coverUrl: clean(s.cover_url), coverCredit: clean(s.cover_credit), featured: !!s.featured,
  }));
  const videos: HubVideo[] = (Array.isArray(d?.videos) ? d.videos : []).map((v: any) => ({
    slug: v.slug, title: v.title, description: v.description || '', url: v.video_url, thumbnailUrl: clean(v.thumbnail_url) ?? autoThumbnail(v.video_url),
    thumbnailCredit: clean(v.thumbnail_credit), source: clean(v.source_name), showSlug: clean(v.show_slug), category: clean(v.category),
    scope: v.scope === 'international' ? 'international' : 'national', countryCode: clean(v.country_code),
    durationSeconds: typeof v.duration_seconds === 'number' ? v.duration_seconds : undefined, publishedAt: clean(v.published_at), featured: !!v.featured,
  }));
  return { shows, videos };
}

export async function getHubVideo(slug: string): Promise<HubVideo | null> {
  return (await getVideoHub()).videos.find((v) => v.slug === slug) ?? null;
}

/** YouTube hosts its own poster frames; any other host needs an admin-supplied thumbnail. */
function autoThumbnail(raw: string): string | undefined {
  const m = embedUrl(raw)?.match(/youtube-nocookie\.com\/embed\/([\w-]{11})/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg` : undefined;
}

export const showUrl = (slug: string) => `/videos/shows/${slug}`;

export function formatDuration(sec?: number): string | null {
  if (!sec || sec <= 0) return null;
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
