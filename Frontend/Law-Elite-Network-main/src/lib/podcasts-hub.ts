import { fetchPublicApi } from '@/lib/api/public-fetch';

export interface HubPodcast {
  /** Main photo held in our own storage, when one has been uploaded with its credit. */
  photo?: { url: string; alt: string; credit: string; license: string };
  slug: string;
  title: string;
  host?: string;
  publisher?: string;
  description: string;
  category?: string;
  countryCode?: string;
  language?: string;
  listenUrl?: string;
  websiteUrl?: string;
  coverUrl?: string;
  coverCredit?: string;
  rank?: number;
  rankingNote?: string;
  overview: string;
  firstAired?: string;
  frequency?: string;
  format?: string;
  bestFor?: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  seoTitle?: string;
  seoDescription?: string;
  reviewedAt?: string;
  indexable: boolean;
  listenLinks: { label: string; url: string }[];
  hosts: { name: string; bio: string; personSlug?: string }[];
  relatedArticleSlugs: string[];
  videos: { title: string; url: string; thumbnailUrl?: string; thumbnailCredit?: string; description?: string; publishedAt?: string }[];
  episodes: { title: string; url: string; note?: string; publishedAt?: string }[];
}

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

/** Live, admin-managed podcasts, ranked first. Empty when law-service is unreachable. */
export async function getPodcastHub(): Promise<HubPodcast[]> {
  const res = await fetchPublicApi('/podcasts');
  return (Array.isArray(res?.data) ? res.data : []).map((p: any): HubPodcast => ({
    slug: p.slug, title: p.title, host: clean(p.host), publisher: clean(p.publisher), description: p.description || '',
    category: clean(p.category), countryCode: clean(p.country_code), language: clean(p.language), listenUrl: clean(p.listen_url),
    websiteUrl: clean(p.website_url), coverUrl: clean(p.cover_url), coverCredit: clean(p.cover_credit),
    rank: typeof p.rank === 'number' ? p.rank : undefined, rankingNote: clean(p.ranking_note),
    overview: typeof p.overview === 'string' ? p.overview : '', firstAired: clean(p.first_aired), frequency: clean(p.frequency), format: clean(p.format), bestFor: clean(p.best_for),
    faq: Array.isArray(p.faq) ? p.faq.filter((f: any) => f?.q && f?.a) : [], sources: Array.isArray(p.sources) ? p.sources.filter((x: any) => x?.label && x?.url) : [],
    listenLinks: Array.isArray(p.listen_links) ? p.listen_links.filter((x: any) => x?.label && x?.url) : [],
    hosts: Array.isArray(p.hosts) ? p.hosts.filter((h: any) => h?.name).map((h: any) => ({ name: h.name, bio: h.bio || '', personSlug: clean(h.person_slug) })) : [],
    relatedArticleSlugs: Array.isArray(p.related_article_slugs) ? p.related_article_slugs : [],
    videos: Array.isArray(p.videos) ? p.videos.filter((v: any) => v?.title && v?.url).map((v: any) => ({ title: v.title, url: v.url, thumbnailUrl: clean(v.thumbnail_url), thumbnailCredit: clean(v.thumbnail_credit), description: clean(v.description), publishedAt: clean(v.published_at) })) : [],
    episodes: Array.isArray(p.episodes) ? p.episodes.filter((e: any) => e?.title && e?.url).map((e: any) => ({ title: e.title, url: e.url, note: clean(e.note), publishedAt: clean(e.published_at) })) : [],
    seoTitle: clean(p.seo_title), seoDescription: clean(p.seo_description), reviewedAt: clean(p.reviewed_at), indexable: !!p.indexable,
  }));
}

export function countryName(code?: string): string | undefined {
  if (!code) return undefined;
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; } catch { return code; }
}

export async function getHubPodcast(slug: string): Promise<HubPodcast | null> {
  return (await getPodcastHub()).find((p) => p.slug === slug) ?? null;
}

export const podcastUrl = (slug: string) => `/podcasts/${slug}`;
