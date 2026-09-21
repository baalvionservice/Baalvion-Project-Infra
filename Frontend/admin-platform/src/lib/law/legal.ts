import { serviceClients, cmsApiClient } from '@/lib/api/client';
import { rowOf, rowsOf, slugify } from '@/lib/law/people';

export { rowsOf, slugify };

/** Mirror law-service utils/legalValidation.js and the site's types/legal.ts. */
export const COURT_LEVELS = ['trial', 'appellate', 'supreme', 'international', 'other'] as const;
export const CASE_STATUSES = ['ongoing', 'concluded', 'settled', 'dismissed', 'appealed'] as const;

type Row = Record<string, unknown>;

export interface CourtRecord {
  id: number; slug: string; name: string; level: string; country_code?: string | null; description: string; url?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export interface CaseRecord {
  id: number; slug: string; case_name: string; court_slug: string; jurisdiction: string; country_code?: string | null; status: string; summary: string;
  parties: Row[]; lawyers: Row[]; judges: Row[]; important_dates: Row[]; timeline: Row[]; documents: Row[]; related_article_slugs: string[];
  seo_title?: string | null; seo_description?: string | null; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

const law = serviceClients.law;

function resource<T extends { id: number }>(name: string) {
  return {
    list: (params: Record<string, unknown>) => law.get(`/admin/${name}`, { params }).then((r) => r.data),
    get: (id: number | string) => law.get(`/admin/${name}/${id}`).then((r) => rowOf<T>(r.data)),
    create: (body: Partial<T>) => law.post(`/admin/${name}`, body).then((r) => rowOf<T>(r.data)),
    update: (id: number, body: Partial<T>) => law.patch(`/admin/${name}/${id}`, body).then((r) => rowOf<T>(r.data)),
  };
}

export const courtsApi = resource<CourtRecord>('court_profiles');
export const casesApi = resource<CaseRecord>('case_profiles');

/** Mirrors law-service utils/entertainmentValidation.js and the site's ENTERTAINMENT_TYPES. */
export const ENTERTAINMENT_TYPES = [
  ['movie', 'Movie'], ['tv-show', 'TV show'], ['streaming-show', 'Streaming show'], ['music-release', 'Music release'],
  ['album', 'Album'], ['song', 'Song'], ['award', 'Award'], ['event', 'Entertainment event'],
] as const;

export interface EntertainmentRecord {
  id: number; slug: string; title: string; type: string; release_date?: string | null; description: string;
  people_involved: Row[]; related_entities: Row[]; related_article_slugs: string[]; videos: Row[]; interviews: Row[];
  seo_title?: string | null; seo_description?: string | null; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const entertainmentApi = resource<EntertainmentRecord>('entertainment_entities');

export const COMPETITION_LEVELS = ['olympic', 'championship', 'tournament', 'league', 'other'] as const;
export const COMMON_SPORTS = ['Basketball', 'American Football', 'Football (Soccer)', 'Baseball', 'Tennis', 'Golf', 'Athletics', 'Swimming', 'Boxing', 'Motorsport', 'Cricket', 'Other'] as const;

export interface SportsTeamRecord {
  id: number; slug: string; name: string; sport: string; country_code?: string | null; description: string; url?: string | null;
  verified: boolean; source_note?: string | null; published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export interface SportsCompetitionRecord {
  id: number; slug: string; name: string; sport: string; level: string; country_code?: string | null; description: string; event_date?: string | null;
  people_involved: Row[]; related_article_slugs: string[]; videos: Row[]; verified: boolean; source_note?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const sportsTeamsApi = resource<SportsTeamRecord>('sports_teams');
export const sportsCompetitionsApi = resource<SportsCompetitionRecord>('sports_competitions');

export const TOPIC_PILLARS = ['legal', 'entertainment', 'sports', 'general'] as const;

export interface TopicRecord {
  id: number; slug: string; name: string; pillar: string; aliases: string[]; description?: string | null;
  published: boolean; indexable: boolean; archived: boolean; updated_at?: string;
}

export const topicsApi = resource<TopicRecord>('topics');

/** Mirror law-service utils/homeWidgetValidation.js and the site's lib/home-widgets.ts. */
export const HOME_WIDGETS = [
  { kind: 'breaking', label: 'Breaking bar', hint: 'A short-lived headline strip at the very top. Needs a source and an expiry (max 48 hours), so it never goes stale.' },
  { kind: 'ticker', label: 'Ticker', hint: 'Label and value pairs in the thin bar under the header. Only put figures you can source.' },
  { kind: 'audio', label: 'Audio briefing', hint: 'A real audio file. The player is hidden unless one is published.' },
  { kind: 'docket', label: 'Court docket', hint: 'Public cases to follow. Link the official docket or a court page.' },
  { kind: 'gallery', label: 'Photo gallery', hint: 'Photos you have the right to use. A credit or licence line is required.' },
  { kind: 'shorts', label: 'Video shorts', hint: 'Links to videos you own or may embed.' },
] as const;
export type HomeWidgetKind = (typeof HOME_WIDGETS)[number]['kind'];

export interface HomeWidgetRecord {
  id: number; widget: HomeWidgetKind; title: string; summary?: string | null; source_name?: string | null; url?: string | null; image_url?: string | null;
  credit?: string | null; value?: string | null; extra?: Record<string, string>; event_at?: string | null; expires_at?: string | null; sort_order: number;
  region?: string | null; source_key?: string | null; published: boolean; archived: boolean; updated_at?: string;
}

export interface IngestReport { created: number; alreadyKnown: number; tooOld: number; invalid: number; sources: { id: string; label: string; created: number; error: string | null }[] }

export const homeWidgetsApi = resource<HomeWidgetRecord>('home_widget_items');

export interface LawOverviewSection { key: string; label: string; href: string; published: number; draft: number; archived: number; unverified: number }
export interface LawOverviewWidget { widget: HomeWidgetKind; live: number; drafts: number; expiringSoon: number; lapsed: number }
export interface LawOverview { generatedAt: string; sections: LawOverviewSection[]; widgets: LawOverviewWidget[] }

export const lawOverviewApi = {
  get: () => law.get('/admin/law-overview').then((r) => (r.data?.data ?? r.data) as LawOverview),
};

/** Drafts new candidates from the official feeds once. Never publishes. */
export const ingestHomeWidgets = () => law.post('/admin/home-widget-ingest').then((r) => (r.data?.data ?? r.data) as IngestReport);

export const REGION_NAMES: Record<string, string> = { US: 'United States', GB: 'United Kingdom', KE: 'Kenya', IN: 'India', CA: 'Canada', AU: 'Australia', ZA: 'South Africa', NG: 'Nigeria', INTL: 'International' };
/** Country or body a fetched item came from, for display next to a draft. */
export const regionLabel = (code?: string | null) => (code ? REGION_NAMES[code] ?? code : null);

/** "3 h ago" / "2 days ago" from an ISO time. */
export function timeAgo(iso?: string | null, now = Date.now()): string {
  if (!iso) return '';
  const mins = Math.round((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/** "in 5 h" / "expired" for a hide-after time. */
export function expiresIn(iso?: string | null, now = Date.now()): string {
  if (!iso) return 'no expiry';
  const mins = Math.round((new Date(iso).getTime() - now) / 60000);
  if (mins <= 0) return 'expired';
  if (mins < 90) return `expires in ${mins} min`;
  return `expires in ${Math.round(mins / 60)} h`;
}

export interface SourceStat {
  id: string; label: string; url: string; waiting: number; live: number; skipped: number; expired: number; total: number; latestItemAt: string | null;
  lastRun: { ok: boolean; error: string | null; drafted: number } | null;
}
export interface CountryStat { region: string; sources: SourceStat[]; waiting: number; live: number; skipped: number; expired: number; total: number }
export interface SourcesBreakdown { generatedAt: string; lastRunAt: string | null; countries: CountryStat[]; manualEntries: number }

export const homeSourcesApi = { get: () => law.get('/admin/home-widget-sources').then((r) => (r.data?.data ?? r.data) as SourcesBreakdown) };

/* ── From a fetched item to a real website article ─────────────────────────────────────────────
 * The article itself is a normal CMS draft on the Law Elite Network website, so it goes through the
 * CMS's own editor, review and publish workflow. Only the headline, the source's name and its link
 * are carried over (never the source's text): the editor writes the article. */

export interface CmsCategoryOption { id: string; name: string }

const lawWebsiteId = async (): Promise<string> => {
  const res = await cmsApiClient.get('/cms/websites', { params: { limit: 100 } });
  const list = (res.data?.data ?? []) as { id: string; slug: string }[];
  const site = list.find((w) => w.slug === 'law-elite-network');
  if (!site) throw new Error('The Law Elite Network website is not set up in the CMS.');
  return site.id;
};

/**
 * Categories the Law Elite Network site actually shows. A post filed under any other category is
 * published in the CMS but never appears on the site, so the picker offers only these.
 * MIRROR of CURRENT_CATEGORY_SLUGS in Frontend/Law-Elite-Network-main/src/lib/category-slugs.ts: keep in sync.
 */
const SITE_VISIBLE_CATEGORY_SLUGS = new Set([
  'maritime-offshore-injury-law', 'cruise-ship-passenger-vessel-accidents', 'personal-injury-lawyer', 'law-school-success',
  'movies', 'music', 'television', 'streaming', 'celebrity-news',
]);

/** The website's id plus the categories it can publish to, for the "Write article" picker. */
export const lawArticleTargets = async (): Promise<{ websiteId: string; categories: CmsCategoryOption[] }> => {
  const websiteId = await lawWebsiteId();
  const res = await cmsApiClient.get(`/cms/websites/${websiteId}/categories`);
  const cats = ((res.data?.data ?? []) as { id: string; name: string; slug: string }[]).filter((c) => SITE_VISIBLE_CATEGORY_SLUGS.has(c.slug)).map((c) => ({ id: c.id, name: c.name }));
  return { websiteId, categories: cats };
};

/** Creates the draft and remembers it on the homepage item, so the card can say "article started" instead of offering to start it twice. */
export async function startArticleFromItem(item: HomeWidgetRecord, opts: { websiteId: string; categoryId?: string; title: string; summary?: string }) {
  const res = await cmsApiClient.post(`/cms/websites/${opts.websiteId}/content`, {
    title: opts.title,
    excerpt: opts.summary || null,
    contentType: 'article',
    categoryId: opts.categoryId || null,
    externalSourceName: item.source_name || null,
    externalSourceUrl: item.url || null,
    customFields: { startedFromHomepageItem: item.id, sourceRegion: item.region ?? item.extra?.region ?? null },
  });
  const content = (res.data?.data ?? res.data) as { id: string };
  await homeWidgetsApi.update(item.id, { extra: { ...(item.extra ?? {}), cms_content_id: content.id, cms_website_id: opts.websiteId } });
  return { contentId: content.id, websiteId: opts.websiteId };
}
