/**
 * Live CMS data client (server-side).
 *
 * Baalvion Mining ("Trade Insights" blog) content is now managed centrally in
 * the Baalvion CMS (cms-service) and edited from the admin-platform console.
 * This module reads the public delivery API and maps CMS content back to the
 * blog page's existing shape so the UI stays unchanged.
 *
 * All functions run on the server (server components / route handlers) and
 * degrade gracefully — they return [] / null if the CMS is unreachable, so the
 * blog pages fall back to their built-in seed content.
 */

import { BRAND_IMAGES } from './brand-assets';

const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3018/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'baalvion-mining';
const BASE = `${CMS_BASE}/${SITE}`;

export interface MiningPost {
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  image: string;
  /** Sanitized-at-source HTML body (CMS is admin-authored, trusted). Empty for list items. */
  contentHtml: string;
}

interface Block {
  id: string;
  type: string;
  order: number;
  content: Record<string, any>;
}

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
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchJSON(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function listContent(
  params: Record<string, string | number | undefined> = {},
): Promise<CmsContent[]> {
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? 100));
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'limit' && v !== undefined && v !== null) qs.set(k, String(v));
  }
  const j = await fetchJSON(`${BASE}/content?${qs.toString()}`);
  return j && Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
}

async function getContent(slug: string): Promise<CmsContent | null> {
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}`);
  return j && j.data ? (j.data as CmsContent) : null;
}

// ── mappers ─────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Render CMS content blocks to the HTML the blog detail page expects. */
function blocksToHtml(blocks?: Block[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b) => {
      const c = b.content || {};
      switch (b.type) {
        case 'heading': {
          const level = Number(c.level) >= 1 && Number(c.level) <= 6 ? Number(c.level) : 2;
          return `<h${level}>${escapeHtml(String(c.text ?? ''))}</h${level}>`;
        }
        case 'html':
          // Trusted: authored in the central CMS by admin/editor roles.
          return String(c.html ?? '');
        case 'quote':
          return `<blockquote>${escapeHtml(String(c.text ?? ''))}</blockquote>`;
        case 'code':
          return `<pre><code>${escapeHtml(String(c.code ?? c.text ?? ''))}</code></pre>`;
        case 'divider':
          return '<hr />';
        case 'paragraph':
        default:
          return c.text ? `<p>${escapeHtml(String(c.text))}</p>` : '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

function formatDate(c: CmsContent): string {
  const cf = c.customFields || {};
  if (cf.date) return String(cf.date);
  if (c.publishedAt) {
    return new Date(c.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return '';
}

function mapPost(c: CmsContent): MiningPost {
  const cf = c.customFields || {};
  return {
    slug: c.slug,
    title: c.title,
    category: cf.category || c.category?.name || 'Market Insights',
    author: cf.author || 'Baalvion Mining Desk',
    date: formatDate(c),
    readTime: cf.readTime || '4 min read',
    excerpt: c.excerpt || '',
    image: c.featuredImage || BRAND_IMAGES.insight,
    contentHtml: blocksToHtml(c.contentBlocks),
  };
}

// ── public API ────────────────────────────────────────────────────────────────
/** All published blog/insight posts for the cards grid (no body — list is lightweight). */
export async function cmsGetPosts(): Promise<MiningPost[]> {
  const items = await listContent({ contentType: 'news' });
  return items.map(mapPost);
}

/** A single post with full HTML body, by slug. Null if not found / CMS down. */
export async function cmsGetPost(slug: string): Promise<MiningPost | null> {
  const c = await getContent(slug);
  return c ? mapPost(c) : null;
}
