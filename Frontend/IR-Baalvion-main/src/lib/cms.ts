/**
 * Live CMS data client (server-side) for Baalvion Investor Relations editorial
 * content. Press releases and news are now managed centrally in the Baalvion CMS
 * (admin-platform console) and served via the public delivery API. Structured
 * investor data (capital calls, NAV, votes, distributions) is intentionally NOT
 * here — it stays in its own backend.
 */
const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3018/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'baalvion-ir';
const BASE = `${CMS_BASE}/${SITE}`;

interface CmsContent {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentType: string;
  customFields?: Record<string, any> | null;
  category?: { id: string; name: string; slug: string } | null;
  publishedAt?: string | null;
}

export interface PressRelease {
  title: string;
  date: string;
  link: string;
  download?: string;
  webcast?: string;
  supplement?: string;
}

export interface NewsArticle {
  title: string;
  excerpt: string;
  date: string;
  imageId?: string;
}

async function listNews(): Promise<CmsContent[]> {
  try {
    const r = await fetch(`${BASE}/content?contentType=news&limit=100`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
  } catch {
    return [];
  }
}

export async function cmsGetPressReleases(): Promise<PressRelease[]> {
  const items = await listNews();
  return items
    .filter((c) => (c.customFields || {}).kind === 'press-release')
    .map((c) => {
      const cf = c.customFields || {};
      return {
        title: c.title,
        date: cf.date || (c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''),
        link: cf.link || '#',
        download: cf.download,
        webcast: cf.webcast,
        supplement: cf.supplement,
      };
    });
}

export async function cmsGetNews(): Promise<NewsArticle[]> {
  const items = await listNews();
  return items
    .filter((c) => {
      const kind = (c.customFields || {}).kind;
      // news-article, or legacy editorial news with no kind that isn't a press release
      return kind === 'news-article' || (!kind && c.contentType === 'news');
    })
    .map((c) => {
      const cf = c.customFields || {};
      return {
        title: c.title,
        excerpt: c.excerpt || '',
        date: cf.date || (c.publishedAt ? String(c.publishedAt).slice(0, 10) : ''),
        imageId: cf.imageId,
      };
    });
}

// ── Page-builder definitions + navigation (the former StorageAdapter/MOCK_PAGES) ──────
// Each IR page is a cms-service 'page' content item carrying the full PageDefinition in
// customFields.pageDefinition; the nav tree is a 'post' (slug 'primary-navigation') in
// customFields.items. Reads are server-side (CMS_PUBLIC_URL); the frontend reaches them
// through same-origin BFF routes (/api/cms/pages, /api/cms/navigation).
async function listByType(contentType: string): Promise<CmsContent[]> {
  try {
    const r = await fetch(`${BASE}/content?contentType=${contentType}&limit=200`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
  } catch {
    return [];
  }
}

export async function cmsListPages(): Promise<any[]> {
  const items = await listByType('page');
  return items
    .map((c) => (c.customFields || {}).pageDefinition)
    .filter((p): p is Record<string, any> => !!p && Array.isArray((p as any).sections));
}

export async function cmsGetNavigation(): Promise<any[]> {
  const posts = await listByType('post');
  const nav = posts.find((c) => c.slug === 'primary-navigation' || (c.customFields || {}).kind === 'navigation');
  const items = nav && (nav.customFields || {}).items;
  return Array.isArray(items) ? items : [];
}
