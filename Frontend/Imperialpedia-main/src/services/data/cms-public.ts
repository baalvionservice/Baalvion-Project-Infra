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

const CMS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL || 'http://localhost:3018/api/v1/public';
const SITE_SLUG = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || 'imperialpedia';

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
}

// ── low-level fetchers (throw on transport/5xx so callers can fall back) ─────
async function cmsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_PUBLIC_URL}/${SITE_SLUG}${path}`, {
    headers: { Accept: 'application/json' },
    // Content is editorial and changes on publish — keep it fresh, not statically frozen.
    cache: 'no-store',
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

export async function listCmsContent(
  params: CmsListParams = {},
): Promise<{ items: CmsContent[]; total: number }> {
  const q = new URLSearchParams();
  if (params.contentType) q.set('contentType', params.contentType);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.categorySlug) q.set('categorySlug', params.categorySlug);
  const qs = q.toString();
  const env = await cmsFetch<CmsListEnvelope>(`/content${qs ? `?${qs}` : ''}`);
  return { items: env.data ?? [], total: env.pagination?.total ?? (env.data?.length ?? 0) };
}

export async function getCmsContentBySlug(slug: string): Promise<CmsContent> {
  const env = await cmsFetch<CmsItemEnvelope>(`/content/${encodeURIComponent(slug)}`);
  return env.data;
}

// ── block → HTML (trusted, internally-authored content) ─────────────────────
const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function blockToHtml(b: CmsBlock): string {
  const c = b.content || {};
  switch (b.type) {
    case 'paragraph':
      return `<p>${esc(c.text)}</p>`;
    case 'heading': {
      const level = Math.min(Math.max(Number(c.level) || 2, 1), 6);
      return `<h${level}>${esc(c.text)}</h${level}>`;
    }
    case 'quote':
      return `<blockquote><p>${esc(c.text)}</p>${c.cite ? `<cite>${esc(c.cite)}</cite>` : ''}</blockquote>`;
    case 'code':
      return `<pre><code>${esc(c.code)}</code></pre>`;
    case 'callout':
      return `<div class="callout callout-${esc(c.variant) || 'info'}">${esc(c.text)}</div>`;
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
  return [...blocks]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(blockToHtml)
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
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.excerpt ?? '',
    body: blocksToHtml(raw.contentBlocks) || undefined,
    authorId: String(raw.authorId ?? 'imperialpedia'),
    publishedAt: raw.publishedAt ?? undefined,
    updatedAt: raw.updatedAt ?? raw.publishedAt ?? new Date().toISOString(),
    category: raw.category?.name ?? 'General',
    tags: raw.tagIds ?? [],
    status: 'published' as ArticleStatus,
    readingTime: Math.max(1, Math.round(words / 200)),
    featuredImage: raw.featuredImage || `https://picsum.photos/seed/${raw.slug}/800/600`,
    seoTitle: raw.seoMetadata?.title || raw.title,
    seoDescription: raw.seoMetadata?.description || raw.excerpt || '',
    seoKeywords: raw.seoMetadata?.keywords || raw.tagIds || [],
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
      default:
        if (c.text) out.push({ type: 'paragraph', text: String(c.text) });
    }
  }
  return out;
}

export function cmsContentToNews(raw: CmsContent): NewsArticle {
  const words = plainTextLength(raw.contentBlocks, raw.excerpt);
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.excerpt ?? '',
    category: toNewsCategory(raw.category?.name),
    author: { name: 'Imperialpedia Newsroom' },
    publishedAt: raw.publishedAt ?? raw.updatedAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? undefined,
    readTimeMinutes: Math.max(1, Math.round(words / 200)),
    imageUrl: raw.featuredImage || `https://picsum.photos/seed/${raw.slug}/1200/675`,
    slug: raw.slug,
    featured: false,
    body: blocksToNewsBody(raw.contentBlocks),
    tags: raw.tagIds ?? [],
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
