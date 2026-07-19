/**
 * @fileOverview Live data layer for content authored & published in the Baalvion CMS
 * (admin-platform → cms-service). Imperialpedia is registered as a CMS "website"
 * (slug `imperialpedia`); this module reads its *published, public* content from the
 * unauthenticated public delivery API:
 *
 *   GET {CMS_PUBLIC_URL}/{site}/content?contentType=article    → list
 *   GET {CMS_PUBLIC_URL}/{site}/content/{slug}                 → single (incl. contentBlocks)
 *
 * These calls are meant to run server-side (RSC / route handlers) — cms-service only
 * allow-lists a few dev origins for browser CORS, and server fetches avoid it entirely.
 *
 * The shapes returned by cms-service are normalized to Imperialpedia's `Article` model
 * so the existing content-engine components render them unchanged.
 */

import { Article, ArticleStatus } from '@/modules/content-engine/types/article';
import type { NewsArticle, NewsBodyBlock, NewsCategory } from '@/lib/data.news';
import { articleArtDataUri } from '@baalvion/illustrations';
import { safeImageUrl } from '@/lib/safe-image';
import { getAuthorBySlug as getStaticAuthorBySlug } from '@/config/authors';
import type { EntityMention } from '@/lib/entityLinkInjector';

// In production default to the API gateway's public delivery host (not localhost,
// and not an empty string that silently forced the built-in fallback). A deploy
// can still override via NEXT_PUBLIC_CMS_PUBLIC_URL.
const CMS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.baalvion.com/api/v1/public'
    : 'http://localhost:3018/api/v1/public');
const SITE_SLUG = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || 'imperialpedia';

// Validates Google's publisher-ID shape ("ca-pub-" + 10–20 digits). Anything else
// (placeholder text, a stray paste) is treated as "no ad client" so we never emit a
// broken AdSense tag.
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
 * the CMS is unreachable or hasn't been configured yet. Cached for an hour
 * (revalidate) rather than `no-store` so it doesn't opt the whole site into
 * dynamic rendering.
 */
export async function getSiteAdsenseClient(): Promise<string | null> {
  const envFallback = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  try {
    const res = await fetch(`${CMS_PUBLIC_URL}/${SITE_SLUG}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: { config?: { ads?: { adsensePublisherId?: string } } } };
      const fromCms = json?.data?.config?.ads?.adsensePublisherId?.trim();
      if (fromCms && ADSENSE_RE.test(fromCms)) return fromCms;
    }
  } catch {
    // CMS unreachable — fall through to env fallback below.
  }
  if (envFallback && ADSENSE_RE.test(envFallback)) return envFallback;
  return DEFAULT_ADSENSE_CLIENT;
}

// ── cms-service wire shapes ─────────────────────────────────────────────────
export interface CmsBlock {
  id: string;
  type: string;
  order: number;
  content: Record<string, unknown>;
}

export interface CmsContent {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  galleryImages?: string[] | null;
  videoUrl?: string | null;
  readingTimeMinutes?: number | null;
  isFeatured?: boolean;
  isBreaking?: boolean;
  isTrending?: boolean;
  isEditorsPick?: boolean;
  isPremium?: boolean;
  newsLabels?: string[] | null;
  externalSourceName?: string | null;
  externalSourceUrl?: string | null;
  contentType: string;
  contentBlocks?: CmsBlock[];
  tagIds?: string[];
  seoMetadata?: { title?: string; description?: string; keywords?: string[] } | null;
  status: string;
  visibility?: string;
  authorId?: string | number | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string; name: string; slug: string } | null;
  customFields?: Record<string, unknown> | null;
  // Persisted, save-time entity-mention detections — see publicService.js's
  // `entityMentions` include (cms-service) and
  // entityMentionDetectionService.js (imperialpedia-service). Absent/empty
  // means no confidently-resolved mentions, never a fabricated placeholder.
  entityMentions?: EntityMention[];
}

interface CmsListEnvelope {
  success: boolean;
  data: CmsContent[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CmsItemEnvelope {
  success: boolean;
  data: CmsContent;
}

export interface CmsListParams {
  contentType?: string;
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  authorSlug?: string;
  featured?: boolean;
  breaking?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
  premium?: boolean;
  label?: string;
  sort?: 'views';
}

// Admin-managed author/contributor profile (cms_authors) — powers /authors pages.
export interface CmsAuthor {
  id: string;
  slug: string;
  name: string;
  title?: string | null;
  credentials?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  expertise?: string[];
  social?: { x?: string; linkedin?: string } | null;
  seoMetadata?: { title?: string; description?: string; keywords?: string[]; ogImage?: string; noIndex?: boolean } | null;
}

// ── low-level fetchers (throw on transport/5xx so callers can fall back) ─────
// A brief backend blip (deploy rollover, DB reconnect, one dropped connection)
// otherwise turns straight into a hard 404 on the very next line — callers only
// distinguish "not found" from "unreachable" by HTTP status, and a network
// error or 5xx looks identical to "give up" unless retried first. One retry
// after a short delay absorbs that class of transient failure without masking
// a real 404 (which short-circuits below, before the retry loop).
const TRANSIENT_RETRY_DELAY_MS = 300;

async function cmsFetchOnce<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_PUBLIC_URL}/${SITE_SLUG}${path}`, {
    headers: { Accept: 'application/json' },
    // Content is editorial and changes on publish — keep it fresh, not statically frozen.
    cache: 'no-store',
    // Without a bound, a hung cms-service connection hangs every page that
    // renders through this shared fetcher (news, categories, the article
    // catch-all) for the full request lifetime instead of failing over to
    // the caller's fallback.
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    // 404 (e.g. unknown slug) is an expected "not found", not a transport failure.
    if (res.status === 404) {
      const err = new Error('CMS_NOT_FOUND') as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    throw new Error(`cms-service ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

async function cmsFetch<T>(path: string): Promise<T> {
  try {
    return await cmsFetchOnce<T>(path);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) throw error;
    await new Promise((resolve) => setTimeout(resolve, TRANSIENT_RETRY_DELAY_MS));
    return cmsFetchOnce<T>(path);
  }
}

export async function listCmsContent(
  params: CmsListParams = {},
): Promise<{ items: CmsContent[]; total: number }> {
  const q = new URLSearchParams();
  if (params.contentType) q.set('contentType', params.contentType);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.categorySlug) q.set('categorySlug', params.categorySlug);
  if (params.authorSlug) q.set('authorSlug', params.authorSlug);
  if (params.featured) q.set('featured', 'true');
  if (params.breaking) q.set('breaking', 'true');
  if (params.trending) q.set('trending', 'true');
  if (params.editorsPick) q.set('editorsPick', 'true');
  if (params.premium) q.set('premium', 'true');
  if (params.label) q.set('label', params.label);
  if (params.sort) q.set('sort', params.sort);
  const qs = q.toString();
  const env = await cmsFetch<CmsListEnvelope>(`/content${qs ? `?${qs}` : ''}`);
  return { items: env.data ?? [], total: env.pagination?.total ?? (env.data?.length ?? 0) };
}

export async function getCmsContentBySlug(slug: string): Promise<CmsContent> {
  const env = await cmsFetch<CmsItemEnvelope>(`/content/${encodeURIComponent(slug)}`);
  return env.data;
}

// ── Author/contributor profiles (cms_authors, admin-managed) ────────────────
interface CmsAuthorListEnvelope {
  success: boolean;
  data: CmsAuthor[];
}

interface CmsAuthorItemEnvelope {
  success: boolean;
  data: CmsAuthor;
}

/** All active authors for this site, ordered by sortOrder then name. [] on any failure. */
export async function getPublicAuthors(): Promise<CmsAuthor[]> {
  try {
    const env = await cmsFetch<CmsAuthorListEnvelope>('/authors');
    return env.data ?? [];
  } catch {
    return [];
  }
}

/** A single active author profile by slug, or null if unknown/unreachable. */
export async function getPublicAuthorBySlug(slug: string): Promise<CmsAuthor | null> {
  try {
    const env = await cmsFetch<CmsAuthorItemEnvelope>(`/authors/${encodeURIComponent(slug)}`);
    return env.data ?? null;
  } catch {
    return null;
  }
}

// Author profile shape used across the author page and article-page credibility card —
// merges the admin-managed cms_authors record (preferred) with the small static roster in
// config/authors.ts (fallback for when the CMS has no record yet or is unreachable).
export interface ResolvedAuthor {
  slug: string;
  name: string;
  title: string;
  bio: string;
  credentials?: string;
  expertise?: string[];
  avatarUrl?: string;
  videoUrl?: string;
  social: { twitter?: string; linkedin?: string; website?: string };
}

/**
 * Resolves an author profile from the live CMS (admin-managed — see admin-platform's
 * CMS → Websites → Authors screen) first, falling back to the small static roster in
 * src/config/authors.ts when the CMS has no record yet or is unreachable.
 */
export async function resolveAuthor(slug: string): Promise<ResolvedAuthor | null> {
  const live = await getPublicAuthorBySlug(slug);
  if (live) {
    return {
      slug: live.slug,
      name: live.name,
      title: live.title || 'Contributor',
      bio: live.bio || '',
      credentials: live.credentials || undefined,
      expertise: live.expertise?.length ? live.expertise : undefined,
      avatarUrl: live.avatarUrl || undefined,
      videoUrl: live.videoUrl || undefined,
      social: { twitter: live.social?.x || undefined, linkedin: live.social?.linkedin || undefined },
    };
  }

  const fallback = getStaticAuthorBySlug(slug);
  if (fallback) {
    return {
      slug: fallback.slug,
      name: fallback.name,
      title: fallback.title,
      bio: fallback.bio,
      avatarUrl: fallback.avatarUrl,
      social: {
        twitter: fallback.social?.twitter,
        linkedin: fallback.social?.linkedin,
        website: fallback.social?.website,
      },
    };
  }

  return null;
}

// ── block → HTML (trusted, internally-authored content) ─────────────────────
const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function blockToHtml(b: CmsBlock, headingState: { seenH2: boolean }): string {
  const c = b.content || {};
  switch (b.type) {
    // paragraph/heading/quote/callout text is authored as trusted HTML by the CMS rich-text
    // editor (bold/links/lists), same trust level as the raw `html` block below — must not
    // be escaped or that formatting renders as literal text on the live site.
    case 'paragraph':
      return `<p>${(c.text as string) || ''}</p>`;
    case 'heading': {
      let level = Math.min(Math.max(Number(c.level) || 2, 1), 6);
      // At most one <h2> per article (SEO: single-H2 hierarchy) — the page's own H1
      // is the title, so the first level-2 section stays H2 and every later one
      // demotes to H3 rather than repeating H2 for each major section.
      if (level === 2) {
        if (headingState.seenH2) level = 3;
        else headingState.seenH2 = true;
      }
      return `<h${level}>${(c.text as string) || ''}</h${level}>`;
    }
    case 'quote':
      return `<blockquote><p>${(c.text as string) || ''}</p>${c.cite ? `<cite>${esc(c.cite)}</cite>` : ''}</blockquote>`;
    case 'code':
      return `<pre><code>${esc(c.code)}</code></pre>`;
    case 'callout':
      return `<div class="callout callout-${esc(c.variant) || 'info'}">${(c.text as string) || ''}</div>`;
    case 'divider':
      return '<hr />';
    case 'image':
      return c.src
        ? `<figure><img src="${esc(c.src)}" alt="${esc(c.alt)}" />${c.caption ? `<figcaption>${esc(c.caption)}</figcaption>` : ''}</figure>`
        : '';
    case 'html':
      // Author-supplied raw HTML, passed through as-is by design.
      return typeof c.html === 'string' ? c.html : '';
    case 'button':
      return c.href ? `<a class="btn" href="${esc(c.href)}">${esc(c.text) || 'Open'}</a>` : '';
    case 'embed':
      return c.url ? `<p><a href="${esc(c.url)}">${esc(c.url)}</a></p>` : '';
    case 'table': {
      const headers = Array.isArray(c.headers) ? (c.headers as unknown[]) : [];
      const rows = Array.isArray(c.rows) ? (c.rows as unknown[][]) : [];
      const thead = headers.length
        ? `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`
        : '';
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${(Array.isArray(r) ? r : []).map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      return `<table>${thead}${tbody}</table>`;
    }
    default:
      return c.text ? `<p>${esc(c.text)}</p>` : '';
  }
}

export function blocksToHtml(blocks?: CmsBlock[]): string {
  if (!blocks || !blocks.length) return '';
  const headingState = { seenH2: false };
  return [...blocks]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => blockToHtml(b, headingState))
    .filter(Boolean)
    .join('\n');
}

function plainTextLength(blocks?: CmsBlock[], excerpt?: string | null): number {
  if (blocks?.length) {
    return blocks.reduce((n, b) => {
      const c = b.content || {};
      const text =
        (typeof c.text === 'string' && c.text) ||
        (typeof c.code === 'string' && c.code) ||
        (typeof c.html === 'string' && c.html) ||
        '';
      return n + String(text).split(/\s+/).filter(Boolean).length;
    }, 0);
  }
  return String(excerpt ?? '').split(/\s+/).filter(Boolean).length;
}

// ── CMS content → Imperialpedia Article ─────────────────────────────────────
export function cmsContentToArticle(raw: CmsContent): Article {
  const words = plainTextLength(raw.contentBlocks, raw.excerpt);
  const cf = (raw.customFields ?? {}) as Record<string, unknown>;
  const rawFaq = Array.isArray(cf.faq) ? (cf.faq as unknown[]) : [];
  const faq = rawFaq
    .map((f) => f as { question?: unknown; answer?: unknown })
    .filter((f) => f && f.question && f.answer)
    .map((f) => ({ question: String(f.question), answer: String(f.answer) }));
  const author = cf.author as { name?: unknown } | undefined;
  const authorName = author && typeof author.name === 'string' ? author.name : undefined;
  const authorSlug = typeof cf.authorSlug === 'string' ? cf.authorSlug : undefined;
  const reviewerSlug = typeof cf.reviewerSlug === 'string' ? cf.reviewerSlug : undefined;
  const reviewedAt = typeof cf.reviewedAt === 'string' ? cf.reviewedAt : undefined;
  const rawCitations = Array.isArray(cf.citations) ? (cf.citations as unknown[]) : [];
  const citations = rawCitations
    .map((c) => c as { title?: unknown; url?: unknown })
    .filter((c) => c && typeof c.title === 'string' && typeof c.url === 'string')
    .map((c) => ({ title: String(c.title), url: String(c.url) }));
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.excerpt ?? '',
    body: blocksToHtml(raw.contentBlocks) || undefined,
    authorId: String(raw.authorId ?? 'imperialpedia'),
    authorName,
    authorSlug,
    reviewerSlug,
    reviewedAt,
    citations: citations.length ? citations : undefined,
    publishedAt: raw.publishedAt ?? undefined,
    updatedAt: raw.updatedAt ?? raw.publishedAt ?? new Date().toISOString(),
    category: raw.category?.name ?? 'General',
    categorySlug: raw.category?.slug,
    tags: raw.tagIds ?? [],
    status: 'published' as ArticleStatus,
    contentType: raw.contentType,
    readingTime: Math.max(1, Math.round(words / 200)),
    // The CMS never falls back to stock/placeholder imagery — cms-service generates
    // real original artwork on create/update (@baalvion/illustrations); this inline
    // data-URI is only a safety net for rows that somehow still have none.
    featuredImage: safeImageUrl(
      raw.featuredImage,
      articleArtDataUri({ title: raw.title, category: raw.category?.name, tags: raw.tagIds, excerpt: raw.excerpt, seed: raw.id }),
    ),
    seoTitle: raw.seoMetadata?.title || raw.title,
    seoDescription: raw.seoMetadata?.description || raw.excerpt || '',
    seoKeywords: raw.seoMetadata?.keywords || raw.tagIds || [],
    faq: faq.length ? faq : undefined,
  };
}

// ── CMS content → News (src/lib/data.news shape) ────────────────────────────
const NEWS_CATEGORIES: NewsCategory[] = [
  'Markets', 'Economy', 'Stocks', 'Crypto', 'PersonalFinance',
  'RealEstate', 'ETFs', 'Editorial', 'Guides', 'Bonds',
];

function toNewsCategory(name?: string | null): NewsCategory {
  if (!name) return 'Editorial';
  const norm = name.replace(/\s+/g, '').toLowerCase();
  return NEWS_CATEGORIES.find((c) => c.toLowerCase() === norm) ?? 'Editorial';
}

// CMS content blocks → the News page's NewsBodyBlock union.
function blocksToNewsBody(blocks?: CmsBlock[]): NewsBodyBlock[] {
  if (!blocks?.length) return [];
  const out: NewsBodyBlock[] = [];
  for (const b of [...blocks].sort((a, z) => (a.order ?? 0) - (z.order ?? 0))) {
    const c = b.content || {};
    switch (b.type) {
      case 'paragraph':
        if (c.text) out.push({ type: 'paragraph', text: String(c.text) });
        break;
      case 'heading':
        out.push({ type: (Number(c.level) || 2) <= 2 ? 'heading' : 'subheading', text: String(c.text ?? '') });
        break;
      case 'quote':
        out.push({ type: 'quote', text: String(c.text ?? ''), attribution: c.cite ? String(c.cite) : undefined });
        break;
      case 'callout':
        out.push({ type: 'callout', text: String(c.text ?? '') });
        break;
      case 'image':
        if (c.src) out.push({ type: 'image', url: String(c.src), caption: c.caption ? String(c.caption) : undefined });
        break;
      case 'code':
        if (c.code) out.push({ type: 'paragraph', text: String(c.code) });
        break;
      case 'html':
        // News renders block.text as plain JSX text (no dangerouslySetInnerHTML), unlike
        // the Article path — strip tags instead of dumping raw markup as visible text.
        if (c.html) {
          const stripped = String(c.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (stripped) out.push({ type: 'paragraph', text: stripped });
        }
        break;
      default:
        if (c.text) out.push({ type: 'paragraph', text: String(c.text) });
    }
  }
  return out;
}

export function cmsContentToNews(raw: CmsContent): NewsArticle {
  const words = plainTextLength(raw.contentBlocks, raw.excerpt);
  const cf = (raw.customFields ?? {}) as Record<string, unknown>;
  const author = cf.author as { name?: unknown } | undefined;
  const authorName = author && typeof author.name === 'string' ? author.name : undefined;
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.excerpt ?? '',
    category: toNewsCategory(raw.category?.name),
    categorySlug: raw.category?.slug,
    author: { name: authorName || 'Imperialpedia Newsroom' },
    publishedAt: raw.publishedAt ?? raw.updatedAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? undefined,
    // The backend now computes this from the real article body (contentService's
    // _estimateReadingTime) — only fall back to a client-side word-count estimate
    // for rows written before that field existed.
    readTimeMinutes: raw.readingTimeMinutes ?? Math.max(1, Math.round(words / 200)),
    imageUrl: safeImageUrl(
      raw.featuredImage,
      articleArtDataUri({ title: raw.title, category: raw.category?.name, tags: raw.tagIds, excerpt: raw.excerpt, seed: raw.id }),
    ),
    slug: raw.slug,
    // isFeatured is the real modeled column; customFields.featured is a legacy
    // fallback for content authored before it existed.
    featured: raw.isFeatured === true || cf.featured === true,
    isBreaking: raw.isBreaking === true,
    isTrending: raw.isTrending === true,
    isEditorsPick: raw.isEditorsPick === true,
    isPremium: raw.isPremium === true,
    newsLabels: raw.newsLabels ?? undefined,
    galleryImages: raw.galleryImages ?? undefined,
    videoUrl: raw.videoUrl ?? undefined,
    externalSourceName: raw.externalSourceName ?? undefined,
    externalSourceUrl: raw.externalSourceUrl ?? undefined,
    body: blocksToNewsBody(raw.contentBlocks),
    tags: raw.tagIds ?? [],
    views: typeof raw.viewCount === 'number' ? raw.viewCount : undefined,
    customFields: raw.customFields ?? undefined,
    contentType: raw.contentType,
    entityMentions: raw.entityMentions?.length ? raw.entityMentions : undefined,
  };
}

// Convenience wrappers for the News pages — swallow failures so callers can fall
// back to the static set without try/catch noise.
export async function getPublishedNews(limit = 50): Promise<NewsArticle[]> {
  try {
    const { items } = await listCmsContent({ contentType: 'news', limit });
    return items.map(cmsContentToNews);
  } catch {
    return [];
  }
}

/**
 * Published articles for a single category slug (e.g. "banking", "investing"),
 * normalized to the News shape so topic pages can render them with the existing
 * cards. Returns [] on any failure so callers fall back to static content.
 */
export async function getCategoryArticles(
  categorySlug: string,
  limit = 30,
): Promise<NewsArticle[]> {
  try {
    const { items } = await listCmsContent({ categorySlug, limit });
    return items.map(cmsContentToNews);
  } catch {
    return [];
  }
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsArticle | null> {
  try {
    return cmsContentToNews(await getCmsContentBySlug(slug));
  } catch {
    return null;
  }
}

// ── CMS `page` documents (About / Contact / Privacy, etc.) ──────────────────
export interface CmsPage {
  title: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  updatedAt?: string;
}

/**
 * Fetch a published CMS `page` document by slug and return it ready to render.
 * Returns null on any failure (unknown slug, cms-service unreachable) so route
 * components can fall back to their built-in static content during cutover or
 * when the CMS is offline.
 */
export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const raw = await getCmsContentBySlug(slug);
    if (raw.contentType && raw.contentType !== 'page') return null;
    const bodyHtml = blocksToHtml(raw.contentBlocks);
    if (!bodyHtml) return null;
    return {
      title: raw.title,
      bodyHtml,
      seoTitle: raw.seoMetadata?.title || raw.title,
      seoDescription: raw.seoMetadata?.description || raw.excerpt || '',
      seoKeywords: raw.seoMetadata?.keywords || [],
      updatedAt: raw.updatedAt ?? raw.publishedAt ?? undefined,
    };
  } catch {
    return null;
  }
}
