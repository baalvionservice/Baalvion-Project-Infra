/**
 * Dynamic sitemap data layer for ir.baalvion.com.
 *
 * Collects every PUBLIC, indexable URL from the central CMS (page-builder pages,
 * leadership/board people) plus the curated static IR routes, with real `lastmod`
 * pulled from each content item's updatedAt/publishedAt. The route handlers
 * (app/sitemap.xml + app/sitemaps/[id]) turn this into a Google-standard sitemap
 * index + 50k-URL chunked child sitemaps, regenerated on every request (no-store)
 * so new/edited/deleted content is reflected in near-real-time.
 *
 * Scale note: each sitemap request re-collects from the paginated CMS API (100/page).
 * This comfortably handles thousands of URLs. For 1M+ URLs a streaming/backend-
 * generated sitemap service would be the next step; the chunking + index structure
 * here is already designed for that volume (50k URLs per child, unbounded children).
 */
import { AppConfig } from '@/config';

const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3011/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'ir.baalvion.com';
const BASE = `${CMS_BASE}/${SITE}`;

// Google allows up to 50,000 URLs (and 50MB) per sitemap file.
export const SITEMAP_CHUNK_SIZE = 50000;

export type ChangeFreq =
  | 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFreq;
  priority: number;
}

interface CmsRow {
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  customFields?: Record<string, any> | null;
}

// Curated public IR routes. Gated investor surfaces (dashboard, capital-ops,
// onboarding, phase*, my-voting) and admin/api are intentionally excluded —
// they require auth and must not be indexed.
const STATIC_PUBLIC: Array<{ path: string; changeFrequency: ChangeFreq; priority: number }> = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/governance/overview', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/governance/leadership', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/governance/board-of-directors', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/governance/committee-composition', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/news-and-events/news', changeFrequency: 'daily', priority: 0.8 },
  { path: '/news-and-events/press-releases', changeFrequency: 'daily', priority: 0.8 },
  { path: '/news-and-events/events', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/news-and-events/investor-day', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/news-and-events/webcast', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/resources/contact-ir', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/resources/email-alerts', changeFrequency: 'yearly', priority: 0.4 },
];

async function fetchAll(query: string): Promise<CmsRow[]> {
  const out: CmsRow[] = [];
  for (let page = 1; page <= 1000; page++) {
    try {
      const r = await fetch(`${BASE}/content?${query}&limit=100&page=${page}`, { cache: 'no-store' });
      if (!r.ok) break;
      const j = await r.json();
      const rows: CmsRow[] = Array.isArray(j.data) ? j.data : [];
      out.push(...rows);
      const p = j.pagination;
      if (!rows.length || !p || page >= p.totalPages) break;
    } catch {
      break;
    }
  }
  return out;
}

const toDate = (row: CmsRow, fallback: Date): Date => {
  const d = row.updatedAt || row.publishedAt;
  const parsed = d ? new Date(d) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
};

/** Collect every indexable public URL with real lastmod. Deduplicated by URL. */
export async function collectSitemapEntries(): Promise<SitemapEntry[]> {
  const base = AppConfig.baseUrl.replace(/\/$/, '');
  const now = new Date();
  const entries: SitemapEntry[] = STATIC_PUBLIC.map((s) => ({
    url: `${base}${s.path}`,
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  // CMS page-builder pages (path lives in customFields.pageSlug).
  const pages = await fetchAll('contentType=page');
  for (const p of pages) {
    const cf = p.customFields || {};
    const path: string = cf.pageSlug || (p.slug === 'home' ? '/' : `/${p.slug}`);
    if (!path || path === '/') continue; // home already covered by STATIC_PUBLIC
    entries.push({
      url: `${base}${path}`,
      lastModified: toDate(p, now),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // Leadership / board people -> /governance/leadership/[slug] detail pages.
  const posts = await fetchAll('contentType=post');
  for (const c of posts) {
    if ((c.customFields || {}).kind !== 'leadership') continue;
    entries.push({
      url: `${base}/governance/leadership/${c.slug}`,
      lastModified: toDate(c, now),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  const seen = new Set<string>();
  const deduped: SitemapEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    deduped.push(e);
  }
  return deduped;
}

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Build a <urlset> XML document from a slice of entries. */
export function buildUrlsetXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(e.url)}</loc>\n` +
        `    <lastmod>${e.lastModified.toISOString()}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority.toFixed(1)}</priority>\n` +
        `  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Build a <sitemapindex> XML document listing child sitemaps. */
export function buildSitemapIndexXml(children: Array<{ url: string; lastModified: Date }>): string {
  const items = children
    .map(
      (c) =>
        `  <sitemap>\n` +
        `    <loc>${escapeXml(c.url)}</loc>\n` +
        `    <lastmod>${c.lastModified.toISOString()}</lastmod>\n` +
        `  </sitemap>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}
