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
  overview: string;
  facts: { label: string; value: string }[];
  seasons: HubSeason[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  seoTitle?: string;
  seoDescription?: string;
  reviewedAt?: string;
  updatedAt?: string;
  indexable: boolean;
}

export interface HubSeason {
  number: number;
  year?: number;
  firstAired?: string;
  host?: string;
  network?: string;
  days?: number;
  housemates?: number;
  winner?: string;
  runnerUp?: string;
  notes?: string;
  source?: string;
  participants: { name: string; result?: string }[];
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
  peopleSlugs: string[];
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
    overview: typeof s.overview === 'string' ? s.overview : '',
    facts: Array.isArray(s.facts) ? s.facts.filter((f: any) => f?.label && f?.value) : [],
    faq: Array.isArray(s.faq) ? s.faq.filter((f: any) => f?.q && f?.a) : [],
    sources: Array.isArray(s.sources) ? s.sources.filter((x: any) => x?.label && x?.url) : [],
    seasons: Array.isArray(s.seasons) ? s.seasons.map((x: any): HubSeason => ({
      number: Number(x.number), year: typeof x.year === 'number' ? x.year : undefined, firstAired: clean(x.first_aired), host: clean(x.host), network: clean(x.network),
      days: typeof x.days === 'number' ? x.days : undefined, housemates: typeof x.housemates === 'number' ? x.housemates : undefined,
      winner: clean(x.winner), runnerUp: clean(x.runner_up), notes: clean(x.notes), source: clean(x.source),
      participants: Array.isArray(x.participants) ? x.participants.filter((p: any) => p?.name).map((p: any) => ({ name: p.name, result: clean(p.result) })) : [],
    })).sort((a: HubSeason, b: HubSeason) => a.number - b.number) : [],
    seoTitle: clean(s.seo_title), seoDescription: clean(s.seo_description), reviewedAt: clean(s.reviewed_at), updatedAt: clean(s.updated_at ?? s.updatedAt), indexable: !!s.indexable,
  }));
  const videos: HubVideo[] = (Array.isArray(d?.videos) ? d.videos : []).map((v: any) => ({
    slug: v.slug, title: v.title, description: v.description || '', url: v.video_url, thumbnailUrl: clean(v.thumbnail_url) ?? autoThumbnail(v.video_url),
    thumbnailCredit: clean(v.thumbnail_credit), source: clean(v.source_name), showSlug: clean(v.show_slug), category: clean(v.category),
    scope: v.scope === 'international' ? 'international' : 'national', countryCode: clean(v.country_code),
    durationSeconds: typeof v.duration_seconds === 'number' ? v.duration_seconds : undefined, publishedAt: clean(v.published_at), featured: !!v.featured,
    peopleSlugs: Array.isArray(v.people_slugs) ? v.people_slugs : [],
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

export interface HubPerson {
  slug: string;
  showSlug: string;
  name: string;
  appearances: { season: number; year?: number; result?: string }[];
  knownFor?: string;
  overview: string;
  hasProfile: boolean;
  facts: { label: string; value: string }[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  seoTitle?: string;
  seoDescription?: string;
  reviewedAt?: string;
  indexable: boolean;
}

const mapPerson = (p: any): HubPerson => ({
  slug: p.slug, showSlug: p.show_slug, name: p.name,
  appearances: Array.isArray(p.appearances) ? p.appearances.map((a: any) => ({ season: Number(a.season), year: typeof a.year === 'number' ? a.year : undefined, result: clean(a.result) })).sort((a: any, b: any) => a.season - b.season) : [],
  knownFor: clean(p.known_for), overview: typeof p.overview === 'string' ? p.overview : '', hasProfile: p.has_profile === true || (typeof p.overview === 'string' && p.overview.trim().length > 0),
  facts: Array.isArray(p.facts) ? p.facts.filter((f: any) => f?.label && f?.value) : [], faq: Array.isArray(p.faq) ? p.faq.filter((f: any) => f?.q && f?.a) : [],
  sources: Array.isArray(p.sources) ? p.sources.filter((x: any) => x?.label && x?.url) : [], seoTitle: clean(p.seo_title), seoDescription: clean(p.seo_description),
  reviewedAt: clean(p.reviewed_at), indexable: !!p.indexable,
});

/** Everyone who took part in a show (no write-ups), for season pages and links. */
export async function getShowPeople(showSlug: string): Promise<HubPerson[]> {
  const res = await fetchPublicApi('/videos/people', { show: showSlug });
  return (Array.isArray(res?.data) ? res.data : []).map(mapPerson);
}

export async function getShowPerson(showSlug: string, slug: string): Promise<HubPerson | null> {
  const res = await fetchPublicApi(`/videos/people/${showSlug}/${slug}`);
  return res?.data ? mapPerson(res.data) : null;
}

export const seasonUrl = (showSlug: string, n: number) => `/videos/shows/${showSlug}/seasons/${n}`;
export const personUrl = (showSlug: string, slug: string) => `/videos/shows/${showSlug}/people/${slug}`;

const sameName = (a?: string, b?: string) => !!a && !!b && (a.toLowerCase() === b.toLowerCase() || a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase()));

/** Winner or runner-up for one person in one season. Setting the season's winner or runner-up name is enough; no per-person flag needed. */
export function resultFor(season: HubSeason | undefined, name: string, stored?: string): string | undefined {
  if (!season) return stored;
  const own = season.participants.find((p) => sameName(p.name, name))?.result;
  if (own) return own;
  if (sameName(season.winner, name)) return 'Winner';
  if (sameName(season.runnerUp, name)) return 'Runner-up';
  return stored;
}
