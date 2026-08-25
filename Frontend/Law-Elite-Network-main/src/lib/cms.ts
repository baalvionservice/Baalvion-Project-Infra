/**
 * Central Baalvion CMS reader (server-side).
 *
 * Editorial content for Law Elite Network — homepage promo, membership plans,
 * and the static / legal pages (about, careers, contact, editorial-process,
 * privacy, terms, advertise) — is managed in the admin-platform CMS console and
 * served read-only from the cms-service public delivery API.
 *
 * Practitioner directory, bookings, cases, and chat stay on law-service; this
 * module only covers CMS-managed editorial surfaces and degrades gracefully to
 * `null` when the CMS is unreachable so callers can fall back to built-in copy.
 */
import { toNewCategorySlug } from '@/lib/category-slugs';

// In production default to the API gateway's public delivery host (the former
// fail-fast refused to start without CMS_PUBLIC_URL, so a forgotten deploy var
// silently forced the static fallback). A deploy can still override via
// CMS_PUBLIC_URL. The `law-elite-network` slug matches the central CMS.
const IS_PROD = process.env.NODE_ENV === 'production';
const CMS_BASE = process.env.CMS_PUBLIC_URL?.trim()
  || (IS_PROD ? 'https://api.baalvion.com/api/v1/public' : 'http://localhost:3011/api/v1/public');
const SITE = process.env.CMS_WEBSITE_SLUG || 'law-elite-network';
const BASE = `${CMS_BASE}/${SITE}`;

// Hard cap on every CMS fetch so a slow/hung CMS degrades to the caller's
// fallback instead of hanging the page — this module backs the root layout
// (every page on the site), so an unguarded fetch here blocks the whole site.
const FETCH_TIMEOUT_MS = 4000;

// Validates Google's publisher-ID shape ("ca-pub-" + 10–20 digits). Anything else
// is treated as "no ad client" so we never emit a broken AdSense tag.
const ADSENSE_RE = /^ca-pub-\d{10,20}$/;

// AdSense application in progress (Google Search Console verification) for this
// property. Publisher IDs are not secrets — Google's own onboarding instructs
// pasting this exact value directly into every page's HTML — so a code-level
// default is safe. The CMS admin panel (Website → SEO → Monetization) or
// NEXT_PUBLIC_ADSENSE_CLIENT still take priority and can replace it without a
// redeploy once the site is managed there.
const DEFAULT_ADSENSE_CLIENT = 'ca-pub-8968452296456450';

/**
 * Per-site AdSense publisher ID, managed in the CMS admin panel
 * (Website → SEO → Monetization) and exposed on the public website-info endpoint
 * `GET {CMS_PUBLIC_URL}/{site}` as `config.ads.adsensePublisherId`.
 *
 * Falls back to NEXT_PUBLIC_ADSENSE_CLIENT, then DEFAULT_ADSENSE_CLIENT, when
 * the CMS is unreachable or unset. Cached for an hour rather than `no-store` so
 * it doesn't force dynamic rendering.
 */
export async function cmsGetAdsenseClient(): Promise<string | null> {
  const envFallback = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(BASE, { next: { revalidate: 3600 }, signal: controller.signal });
    if (r.ok) {
      const j = (await r.json()) as { data?: { config?: { ads?: { adsensePublisherId?: string } } } };
      const fromCms = j?.data?.config?.ads?.adsensePublisherId?.trim();
      if (fromCms && ADSENSE_RE.test(fromCms)) return fromCms;
    }
  } catch {
    // CMS unreachable or timed out — fall through to env fallback.
  } finally {
    clearTimeout(timer);
  }
  if (envFallback && ADSENSE_RE.test(envFallback)) return envFallback;
  return DEFAULT_ADSENSE_CLIENT;
}

interface Block { id: string; type: string; order: number; content: Record<string, any> }
interface CmsContent {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  contentType: string;
  contentBlocks?: Block[];
  customFields?: Record<string, any> | null;
  seoMetadata?: Record<string, any> | null;
  category?: { id: string; name: string; slug: string } | null;
  /**
   * Every category tagged on this content (public-service resolves `categoryIds`
   * into full records). Includes both the top-level practice-area category and,
   * when assigned in the admin panel's "add sub-category under X" control, its
   * child — `parentId` is null for the former, set for the latter.
   */
  categories?: Array<{ id: string; name: string; slug: string; parentId: string | null }> | null;
  status: string;
  publishedAt?: string | null;
  // BIGINT column -- the API actually returns this as a numeric string (see
  // toArticle()'s `views` mapping below), not a number.
  viewCount?: number | string;
}

export interface CmsSitePage {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  bodyHtml: string;
  custom: Record<string, any>;
  seo?: Record<string, any>;
}

export interface CmsHomepage {
  hero?: { label?: string; title?: string; subtitle?: string; ctaPrimary?: string; ctaSecondary?: string };
  popularTopics: Array<{ name: string; slug: string }>;
  trustStats: Array<{ icon: string; label: string; value: string }>;
}

// Public editorial content changes by admin action, not by the second — a short
// revalidation window keeps pages fast (served from cache, no live round-trip
// on every visitor/Googlebot hit) while still picking up new publishes quickly.
const DEFAULT_REVALIDATE_SECONDS = 300;

/**
 * `revalidate: false` opts a call out of caching entirely (`no-store`) for
 * genuinely real-time reads (the draft-preview endpoint). `strict: true` makes
 * a network-level failure (timeout/abort/DNS/connection error) reject instead
 * of resolving `null` — callers that need to tell "CMS confirms this doesn't
 * exist" apart from "CMS is unreachable right now" (so they don't 404 a page
 * that only *might* be gone) opt into this; every other caller keeps the
 * original null-on-any-failure behavior by leaving it off.
 */
async function fetchJSON(
  url: string,
  opts: { revalidate?: number | false; strict?: boolean } = {},
): Promise<any | null> {
  const { revalidate = DEFAULT_REVALIDATE_SECONDS, strict = false } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      ...(revalidate === false ? { cache: 'no-store' as const } : { next: { revalidate } }),
      signal: controller.signal,
    });
    if (!r.ok) return null; // clean HTTP response: CMS confirms no such record — not a failure.
    return await r.json();
  } catch (err) {
    if (strict) throw err; // network/timeout failure — let the caller decide, don't paper over it as "not found".
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getContent(slug: string, strict = false): Promise<CmsContent | null> {
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}`, { strict });
  return j && j.data ? (j.data as CmsContent) : null;
}

// The CMS delivery API silently clamps every page to 100 items regardless of
// the `limit` sent (confirmed: `limit=200` still returns exactly 100, with
// `pagination.limit` echoed back as 100) -- so a caller asking for more than
// 100 (cmsGetArticles requests 200) got only page 1 and silently lost
// everything past it. With 150 published articles, that meant the last ~50
// were absent from every CMS-list-backed page (homepage, category grids)
// even though their OWN detail page (a direct per-slug fetch, not this list)
// found them fine -- on pages with a bundled/static fallback for the same
// slug, that showed as the generic placeholder art instead of the article's
// real uploaded photo; on pages without one, the article just didn't appear
// at all. Loop pages until we've collected what the caller actually asked
// for (or the API runs out), instead of trusting one request to cover it.
const LIST_CONTENT_MAX_PAGES = 20;

async function listContent(params: Record<string, string | number> = {}): Promise<CmsContent[]> {
  const requestedLimit = Number(params.limit ?? 200);
  const all: CmsContent[] = [];
  for (let page = 1; page <= LIST_CONTENT_MAX_PAGES && all.length < requestedLimit; page++) {
    const qs = new URLSearchParams();
    qs.set('limit', String(requestedLimit));
    qs.set('page', String(page));
    for (const [k, v] of Object.entries(params)) {
      if (k !== 'limit' && k !== 'page') qs.set(k, String(v));
    }
    const j = await fetchJSON(`${BASE}/content?${qs.toString()}`);
    const items = j && Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
    if (items.length === 0) break;
    all.push(...items);
    if (!j?.pagination?.hasNext) break;
  }
  return all.slice(0, requestedLimit);
}

/**
 * Same as `listContent`, but also surfaces the response's pagination total so
 * callers (the /news infinite-scroll feed) can tell when there's another page.
 */
async function listContentPaged(
  params: Record<string, string | number> = {},
): Promise<{ items: CmsContent[]; total: number }> {
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? 200));
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'limit') qs.set(k, String(v));
  }
  const j = await fetchJSON(`${BASE}/content?${qs.toString()}`);
  const items = j && Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
  const total = typeof j?.pagination?.total === 'number' ? j.pagination.total : items.length;
  return { items, total };
}

function blocksToHtml(blocks?: Block[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b) => {
      const c = b.content || {};
      if (b.type === 'heading') {
        const level = Number(c.level) || 2;
        return `<h${level}>${String(c.text ?? '')}</h${level}>`;
      }
      if (b.type === 'html') return String(c.html ?? '');
      return `<p>${String(c.text ?? '')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

/** Read a static / legal page (about-us, careers, contact-us, privacy-policy, ...). */
export async function cmsGetSitePage(slug: string): Promise<CmsSitePage | null> {
  const c = await getContent(slug);
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? undefined,
    bodyHtml: blocksToHtml(c.contentBlocks),
    custom: c.customFields || {},
    seo: c.seoMetadata ?? undefined,
  };
}

/** Read the homepage promo block (hero, popular topics, trust stats). */
export async function cmsGetHomepage(): Promise<CmsHomepage | null> {
  const c = await getContent('home');
  if (!c) return null;
  const cf = c.customFields || {};
  return {
    hero: cf.hero,
    popularTopics: Array.isArray(cf.popularTopics) ? cf.popularTopics : [],
    trustStats: Array.isArray(cf.trustStats) ? cf.trustStats : [],
  };
}

/** Read the membership plans (client + lawyer tiers). */
export async function cmsGetPlans(): Promise<{ client: any[]; lawyer: any[] } | null> {
  const c = await getContent('plans');
  if (!c) return null;
  const plans = (c.customFields || {}).plans || {};
  return { client: Array.isArray(plans.client) ? plans.client : [], lawyer: Array.isArray(plans.lawyer) ? plans.lawyer : [] };
}

// ── Legal encyclopedia articles (A–Z) ────────────────────────────────────────
export interface CmsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  /** First letter for the A–Z index (customFields.alphabet, else first letter of title). */
  alphabet: string;
  /** Rendered HTML body for the article detail page. */
  content: string;
  category?: { id?: string; name: string; slug?: string };
  /**
   * Practice-area sub-topic (e.g. "Bail" under "Criminal Law"), when the admin
   * panel's nested-category control was used to tag this article. Matched
   * against law-service/bundled subcategories by `slug` — the two systems use
   * unrelated ids, so slug is the only key that lines up across both. Absent
   * when the article carries only its top-level category.
   */
  subcategory?: { id: string; name: string; slug: string };
  /** Named byline (E-E-A-T) — matches the bundled/law-service string convention. */
  author?: string;
  readingTime?: string;
  featured?: boolean;
  updatedAt?: string;
  /** CMS content type, e.g. 'article' or 'news' — drives NewsArticle JSON-LD. */
  contentType?: string;
  /**
   * Real featured image set in the CMS admin panel, if any. Was previously
   * dropped during normalization — every renderer had to synthesize a picsum
   * placeholder instead, so admin-set images never appeared on the site. Now
   * carried through; renderers should fall back to `articleArtDataUri` (never
   * to a stock/placeholder image) when this is absent.
   */
  featuredImage?: string;
  /** View count, when the CMS tracks it — omit from UI when absent rather than fabricating a number. */
  views?: number;
  /** Raw CMS custom fields (e.g. `breaking`, `videoUrl`) passed through for data-gated UI like the breaking ticker and video carousel. */
  customFields?: Record<string, any>;
  /** Country this guide is jurisdiction-specific to (customFields.country), e.g. "United States". Absent for worldwide-general content. */
  country?: string;
  /**
   * Real, checkable source citations, admin-entered via CitationsPanel into
   * `customFields.citations` as `{ title, url }[]` -- remapped to `label` here
   * to match the public `primarySources` shape shared with bundled LawArticle
   * data (@/data/law-content).
   */
  primarySources?: { label: string; url?: string }[];
  /**
   * Raw reviewer fields set by the admin ReviewerPanel -- `reviewerSlug`
   * resolves against the cms_authors/bundled author directory (the same
   * extension point the primary byline uses), so the display name and
   * credentials line come from there, not from a fabricated string here.
   * `reviewerJurisdiction`/`reviewerBarLicense` are per-article (the same
   * reviewer can be barred differently depending on which article they
   * reviewed) rather than fields on the author's general profile.
   */
  reviewerSlug?: string;
  reviewedAt?: string;
  reviewerJurisdiction?: string;
  reviewerBarLicense?: string;
  /**
   * Raw fact-checker fields set by the admin FactCheckerPanel -- same
   * pattern as reviewerSlug above, resolved against the author directory
   * rather than trusting a fabricated name/date here.
   */
  factCheckerSlug?: string;
  factCheckedAt?: string;
  /**
   * Raw series fields set by the admin SeriesPanel -- `seriesSlug` is
   * auto-derived there from `seriesTitle` (never hand-typed), so any two
   * articles sharing a series reliably share this slug. Powers the "Part of
   * the Series" panel on the public article (see SeriesNotice.tsx).
   */
  seriesTitle?: string;
  seriesSlug?: string;
  seriesOrder?: number;
  /** Optional named sub-group within the series (e.g. "Saving for College") -- articles with no section render as flat top-level entries. */
  seriesSectionTitle?: string;
}

/**
 * `customFields` is arbitrary admin-entered JSON from a remote API -- narrow
 * it before trusting the shape. Reads the same `citations: { title, url }[]`
 * array CitationsPanel (admin-platform) writes.
 */
function readPrimarySources(value: unknown): { label: string; url?: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sources = value
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object' && typeof s.title === 'string')
    .map((s) => ({ label: s.title as string, url: typeof s.url === 'string' ? s.url : undefined }));
  return sources.length > 0 ? sources : undefined;
}

function toArticle(c: CmsContent): CmsArticle {
  const cf = c.customFields || {};
  const rawLetter = (cf.alphabet || (c.title || '#').charAt(0) || '#').toString().toUpperCase();
  const alphabet = /[A-Z]/.test(rawLetter.charAt(0)) ? rawLetter.charAt(0) : '#';
  const author = typeof cf.author === 'string' ? cf.author : cf.author?.name;
  // A non-null parentId marks a nested sub-category (e.g. "Bail" under
  // "Criminal Law") rather than the top-level practice area itself.
  const childCategory = c.categories?.find((cat) => cat.parentId);
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? undefined,
    alphabet,
    content: blocksToHtml(c.contentBlocks),
    // The CMS still tags content with the pre-rename category slug (e.g.
    // `business-corporate`), but every route/link on this site now uses the
    // renamed slug (`business`). Without normalizing here, category-page
    // filtering (`cmsGetArticles(_, categorySlug)`) never matches any article
    // in a renamed category — so those pages fall back to bundled placeholder
    // art instead of the article's real uploaded image — and article-url.ts /
    // Breadcrumbs / RelatedArticles build links to the dead old slug.
    category: c.category
      ? { id: c.category.id, name: c.category.name, slug: toNewCategorySlug(c.category.slug) }
      : undefined,
    subcategory: childCategory
      ? { id: childCategory.id, name: childCategory.name, slug: childCategory.slug }
      : undefined,
    author: typeof author === 'string' ? author : undefined,
    readingTime: typeof cf.readingTime === 'string' ? cf.readingTime : undefined,
    featured: !!cf.featured,
    updatedAt: c.publishedAt ?? undefined,
    contentType: c.contentType,
    featuredImage: c.featuredImage ?? undefined,
    // BIGINT column -- pg serializes it as a string ("58"), so the old strict
    // `typeof === 'number'` check here silently nulled out every view count.
    views: c.viewCount != null ? Number(c.viewCount) : undefined,
    customFields: c.customFields ?? undefined,
    country: typeof cf.country === 'string' ? cf.country : undefined,
    primarySources: readPrimarySources(cf.citations),
    reviewerSlug: typeof cf.reviewerSlug === 'string' ? cf.reviewerSlug : undefined,
    reviewedAt: typeof cf.reviewedAt === 'string' ? cf.reviewedAt : undefined,
    reviewerJurisdiction: typeof cf.reviewerJurisdiction === 'string' ? cf.reviewerJurisdiction : undefined,
    reviewerBarLicense: typeof cf.reviewerBarLicense === 'string' ? cf.reviewerBarLicense : undefined,
    factCheckerSlug: typeof cf.factCheckerSlug === 'string' ? cf.factCheckerSlug : undefined,
    factCheckedAt: typeof cf.factCheckedAt === 'string' ? cf.factCheckedAt : undefined,
    seriesTitle: typeof cf.seriesTitle === 'string' ? cf.seriesTitle : undefined,
    seriesSlug: typeof cf.seriesSlug === 'string' ? cf.seriesSlug : undefined,
    seriesOrder: typeof cf.seriesOrder === 'number' ? cf.seriesOrder : undefined,
    seriesSectionTitle: typeof cf.seriesSectionTitle === 'string' ? cf.seriesSectionTitle : undefined,
  };
}

/** List published encyclopedia articles, optionally filtered to one A–Z letter and/or category. */
export async function cmsGetArticles(letter?: string, categorySlug?: string): Promise<CmsArticle[]> {
  const items = await listContent({ contentType: 'article', limit: 200 });
  let arts = items.map(toArticle);
  if (letter) {
    const L = letter.toUpperCase().charAt(0);
    arts = arts.filter((a) => a.alphabet === L);
  }
  if (categorySlug) {
    arts = arts.filter((a) => a.category?.slug === categorySlug);
  }
  return arts.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Fetch a single CMS article by slug (used as a fallback on the article page).
 * Pass `strict: true` to reject on a network failure instead of resolving
 * `null` — see fetchJSON's `strict` doc for why the render/metadata paths need it.
 */
export async function cmsGetArticleBySlug(slug: string, strict = false): Promise<CmsArticle | null> {
  const c = await getContent(slug, strict);
  return c ? toArticle(c) : null;
}

/** List published news content (contentType: 'news'), most recent first. */
export async function cmsGetNews(limit = 50): Promise<CmsArticle[]> {
  const items = await listContent({ contentType: 'news', limit });
  return items
    .map(toArticle)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/** Paginated news content for the /news infinite-scroll feed. */
export async function cmsGetNewsPage(
  page: number,
  limit = 12,
): Promise<{ items: CmsArticle[]; hasMore: boolean }> {
  const { items, total } = await listContentPaged({ contentType: 'news', page, limit });
  const sorted = items
    .map(toArticle)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return { items: sorted, hasMore: page * limit < total };
}

/**
 * Draft-safe article fetch for the admin CMS live-preview iframe. `exp`/`token` come from
 * the preview URL (issued by cms-service, validated there too) — this app never holds
 * CMS_PREVIEW_SECRET, it only relays the token back to cms-service's preview endpoint.
 */
export async function cmsGetPreviewContent(slug: string, exp: string, token: string): Promise<CmsArticle | null> {
  const qs = new URLSearchParams({ exp, token }).toString();
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}/preview?${qs}`, { revalidate: false });
  return j && j.data ? toArticle(j.data as CmsContent) : null;
}

// ── Author / contributor profiles (E-E-A-T) ──────────────────────────────────
export interface CmsAuthor {
  slug: string;
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
  avatarUrl?: string;
  expertise?: string[];
  /** Degrees/schools, e.g. "M.D. — University of Mississippi". Empty unless verified in the CMS. */
  education?: string[];
  /** Professional certifications, e.g. "CFP®". Empty unless verified in the CMS. */
  certifications?: string[];
  social?: { x?: string; linkedin?: string; facebook?: string; instagram?: string };
}

function toAuthor(raw: any): CmsAuthor | null {
  if (!raw || !raw.slug || !raw.name) return null;
  return {
    slug: String(raw.slug),
    name: String(raw.name),
    title: raw.title ?? undefined,
    credentials: raw.credentials ?? undefined,
    bio: raw.bio ?? undefined,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? undefined,
    expertise: Array.isArray(raw.expertise) ? raw.expertise : undefined,
    education: Array.isArray(raw.education) && raw.education.length ? raw.education : undefined,
    certifications: Array.isArray(raw.certifications) && raw.certifications.length ? raw.certifications : undefined,
    social: raw.social && typeof raw.social === 'object' ? raw.social : undefined,
  };
}

/**
 * List author/contributor profiles managed in the CMS. The endpoint is part of
 * the public delivery API once cms-service ships the Author entity; until then
 * this returns [] and callers fall back to the bundled profiles in
 * `@/data/authors`.
 */
export async function cmsGetAuthors(): Promise<CmsAuthor[]> {
  const j = await fetchJSON(`${BASE}/authors`);
  if (!j || !Array.isArray(j.data)) return [];
  return j.data.map(toAuthor).filter(Boolean) as CmsAuthor[];
}

/**
 * Fetch a single CMS author profile by slug (null until the backend ships it,
 * or when the CMS confirms no such profile). Pass `strict: true` to reject on
 * a network failure instead — see fetchJSON's `strict` doc.
 */
export async function cmsGetAuthorBySlug(slug: string, strict = false): Promise<CmsAuthor | null> {
  const j = await fetchJSON(`${BASE}/authors/${encodeURIComponent(slug)}`, { strict });
  return j && j.data ? toAuthor(j.data) : null;
}

// ── Subcategory delivery (hierarchical taxonomy) ─────────────────────────────
export interface CmsTaxonomyNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentSlug?: string;
  seo?: Record<string, any>;
}

/**
 * Resolve a subcategory under a parent category from the CMS taxonomy. Returns
 * null until the public taxonomy endpoint is live; callers fall back to bundled
 * article taxonomy refs.
 */
export async function cmsGetSubcategory(categorySlug: string, subSlug: string): Promise<CmsTaxonomyNode | null> {
  const j = await fetchJSON(`${BASE}/categories/${encodeURIComponent(categorySlug)}/subcategories/${encodeURIComponent(subSlug)}`);
  if (!j || !j.data) return null;
  const d = j.data;
  return {
    id: String(d.id ?? subSlug),
    name: String(d.name ?? subSlug),
    slug: String(d.slug ?? subSlug),
    description: d.description ?? undefined,
    parentSlug: d.parentSlug ?? categorySlug,
    seo: d.seoMetadata ?? d.seo ?? undefined,
  };
}

// ── Reader engagement: comments + "was this helpful?" feedback ──────────────
// Real, backend-persisted data only -- see cms-service's service/engagementService.js.
// Comments start 'pending' and only ever surface here once an editor approves
// them; feedback counts are a live DB count, never a display-only placeholder.

async function postJSON(url: string, body: unknown): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface CmsArticleComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/** Approved comments for an article, newest first. Empty until any exist. */
export async function cmsGetComments(slug: string): Promise<CmsArticleComment[]> {
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}/comments`, { revalidate: false });
  return j && Array.isArray(j.data) ? (j.data as CmsArticleComment[]) : [];
}

/**
 * Submit a reader comment. Held for moderation on the backend (status
 * defaults to 'pending') -- never shown as published immediately. Returns
 * null on failure so the caller can show a real error instead of a fake
 * success state.
 */
export async function cmsSubmitComment(
  slug: string,
  data: { authorName: string; authorEmail: string; body: string },
): Promise<{ id: string; status: string } | null> {
  const j = await postJSON(`${BASE}/content/${encodeURIComponent(slug)}/comments`, data);
  return j && j.data ? j.data : null;
}

export interface CmsFeedbackSummary {
  helpful: number;
  notHelpful: number;
}

/** Live "was this helpful?" vote counts for an article. */
export async function cmsGetFeedback(slug: string): Promise<CmsFeedbackSummary | null> {
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}/feedback`, { revalidate: false });
  return j && j.data ? (j.data as CmsFeedbackSummary) : null;
}

/**
 * Cast (or re-cast) a "was this helpful?" vote. `voterToken` is a
 * client-generated id stored in localStorage so the same browser can't vote
 * twice -- see ArticleFeedback.tsx. Returns the updated live summary.
 */
export async function cmsSubmitFeedback(
  slug: string,
  data: { vote: 'helpful' | 'not_helpful'; voterToken: string },
): Promise<CmsFeedbackSummary | null> {
  const j = await postJSON(`${BASE}/content/${encodeURIComponent(slug)}/feedback`, data);
  return j && j.data ? (j.data as CmsFeedbackSummary) : null;
}
