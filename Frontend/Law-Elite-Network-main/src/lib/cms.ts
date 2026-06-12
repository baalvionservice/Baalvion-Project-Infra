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
const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3011/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'law-elite-network';
const BASE = `${CMS_BASE}/${SITE}`;

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
  status: string;
  publishedAt?: string | null;
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

async function fetchJSON(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function getContent(slug: string): Promise<CmsContent | null> {
  const j = await fetchJSON(`${BASE}/content/${encodeURIComponent(slug)}`);
  return j && j.data ? (j.data as CmsContent) : null;
}

async function listContent(params: Record<string, string | number> = {}): Promise<CmsContent[]> {
  const qs = new URLSearchParams();
  qs.set('limit', String(params.limit ?? 200));
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'limit') qs.set(k, String(v));
  }
  const j = await fetchJSON(`${BASE}/content?${qs.toString()}`);
  return j && Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
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
  category?: { name: string; slug?: string };
  readingTime?: string;
  featured?: boolean;
  updatedAt?: string;
}

function toArticle(c: CmsContent): CmsArticle {
  const cf = c.customFields || {};
  const rawLetter = (cf.alphabet || (c.title || '#').charAt(0) || '#').toString().toUpperCase();
  const alphabet = /[A-Z]/.test(rawLetter.charAt(0)) ? rawLetter.charAt(0) : '#';
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? undefined,
    alphabet,
    content: blocksToHtml(c.contentBlocks),
    category: c.category ? { name: c.category.name, slug: c.category.slug } : undefined,
    readingTime: typeof cf.readingTime === 'string' ? cf.readingTime : undefined,
    featured: !!cf.featured,
    updatedAt: c.publishedAt ?? undefined,
  };
}

/** List published encyclopedia articles, optionally filtered to one A–Z letter. */
export async function cmsGetArticles(letter?: string): Promise<CmsArticle[]> {
  const items = await listContent({ contentType: 'article', limit: 200 });
  let arts = items.map(toArticle);
  if (letter) {
    const L = letter.toUpperCase().charAt(0);
    arts = arts.filter((a) => a.alphabet === L);
  }
  return arts.sort((a, b) => a.title.localeCompare(b.title));
}

/** Fetch a single CMS article by slug (used as a fallback on the article page). */
export async function cmsGetArticleBySlug(slug: string): Promise<CmsArticle | null> {
  const c = await getContent(slug);
  return c ? toArticle(c) : null;
}
