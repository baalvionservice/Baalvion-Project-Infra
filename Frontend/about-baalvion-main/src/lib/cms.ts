/**
 * Live CMS data client (server-side).
 *
 * About Baalvion content is now managed centrally in the Baalvion CMS
 * (cms-service) and edited from the admin-platform console. This module reads
 * the public delivery API and maps CMS content back to the frontend's existing
 * types (Project, Article, EcosystemItem, OperationalUpdate, Page sections) so
 * the UI components stay unchanged.
 *
 * Replaces the former in-memory mock in `@/lib/db`. All functions run on the
 * server (route handlers / server components) and degrade gracefully to empty
 * results if the CMS is unreachable.
 */
import type {
  Project,
  ProjectStatus,
  Article,
  EcosystemItem,
  OperationalUpdate,
  UpdateCategory,
  UpdateStatus,
  ImpactLevel,
  Section,
  SEOMetadata,
} from '@/lib/db';

const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3018/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'about-baalvion';
const BASE = `${CMS_BASE}/${SITE}`;

export interface PopulatedPage {
  id: string;
  slug: string;
  title: string;
  sections: string[];
  sectionData: Section[];
  seo?: SEOMetadata;
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

async function listContent(params: Record<string, string | number | undefined> = {}): Promise<CmsContent[]> {
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

// ── mappers ───────────────────────────────────────────────────────────────
function mapSeo(s?: Record<string, any> | null): SEOMetadata | undefined {
  if (!s) return undefined;
  return {
    title: s.title,
    description: s.description,
    ogImage: s.ogImage,
    canonical: s.canonicalUrl,
    keywords: s.keywords,
  };
}

function blocksToText(blocks?: Block[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b) => {
      const c = b.content || {};
      if (b.type === 'html') {
        // Strip tags repeatedly until stable so overlapping/nested constructs (e.g. "<<x>>")
        // cannot reconstitute a tag after a single pass (incomplete-multi-character-sanitization).
        let s = String(c.html || '');
        let prev;
        do { prev = s; s = s.replace(/<[^>]+>/g, ''); } while (s !== prev);
        return s;
      }
      return String(c.text ?? '');
    })
    .filter(Boolean)
    .join('\n\n');
}

function mapProject(c: CmsContent): Project {
  const cf = c.customFields || {};
  return {
    id: c.slug, // route by slug: /projects/[id] resolves via getContent(slug)
    name: c.title,
    category: cf.category || c.category?.name || 'Core Platform',
    type: cf.type || 'Platform',
    description: c.excerpt || '',
    longDescription: cf.longDescription,
    ecosystemRole: cf.ecosystemRole,
    futureScope: cf.futureScope,
    status: (cf.status as ProjectStatus) || 'Active',
    domain: cf.domain,
    subdomain: cf.subdomain,
    isFeatured: !!cf.isFeatured,
    priority: typeof cf.priority === 'number' ? cf.priority : 10,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    seo: mapSeo(c.seoMetadata),
  };
}

function mapArticle(c: CmsContent): Article {
  const cf = c.customFields || {};
  const date =
    cf.date ||
    (c.publishedAt
      ? new Date(c.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '');
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: cf.category || c.category?.slug || 'updates',
    date,
    image: c.featuredImage || `https://picsum.photos/seed/${c.slug}/600/400`,
    author: cf.author || 'Baalvion Staff',
    readTime: cf.readTime || '2 min read',
    content: blocksToText(c.contentBlocks),
    status: 'Published',
    isTrending: !!cf.isTrending,
    seo: mapSeo(c.seoMetadata),
  };
}

function mapEcosystem(c: CmsContent): EcosystemItem {
  const cf = c.customFields || {};
  return {
    id: c.id,
    layer: (cf.layer as EcosystemItem['layer']) || 'Infrastructure',
    name: c.title,
    description: c.excerpt || '',
    domain: cf.domain,
  };
}

function mapUpdate(c: CmsContent): OperationalUpdate {
  const cf = c.customFields || {};
  return {
    id: c.id,
    updateId: cf.updateId || c.slug,
    date: cf.date || (c.publishedAt ? String(c.publishedAt).slice(0, 10) : ''),
    category: (cf.category as UpdateCategory) || 'Other',
    title: c.title,
    description: c.excerpt || blocksToText(c.contentBlocks),
    responsiblePerson: cf.responsiblePerson || '',
    reference: cf.reference,
    status: (cf.status as UpdateStatus) || 'Completed',
    impactLevel: (cf.impactLevel as ImpactLevel) || 'Medium',
    followUpActions: cf.followUpActions,
    tags: Array.isArray(cf.tags) ? cf.tags : [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    seo: mapSeo(c.seoMetadata),
  };
}

function mapPage(c: CmsContent): PopulatedPage {
  const cf = c.customFields || {};
  const sections: Section[] = Array.isArray(cf.sections) ? cf.sections : [];
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    sections: sections.map((s) => s.id),
    sectionData: sections,
    seo: mapSeo(c.seoMetadata),
  };
}

// ── public API ──────────────────────────────────────────────────────────────
export async function cmsGetProjects(): Promise<Project[]> {
  const items = await listContent({ contentType: 'portfolio_item' });
  return items.map(mapProject).sort((a, b) => (a.priority || 10) - (b.priority || 10));
}

export async function cmsGetProject(idOrSlug: string): Promise<Project | null> {
  const c = await getContent(idOrSlug);
  return c ? mapProject(c) : null;
}

export async function cmsGetArticles(category?: string): Promise<Article[]> {
  const items = await listContent({ contentType: 'news' });
  let arts = items.map(mapArticle);
  if (category) arts = arts.filter((a) => a.category === category);
  return arts;
}

export async function cmsGetArticle(slug: string): Promise<Article | null> {
  const c = await getContent(slug);
  return c ? mapArticle(c) : null;
}

export async function cmsGetEcosystem(): Promise<EcosystemItem[]> {
  const items = await listContent({ contentType: 'post', limit: 100 });
  return items.filter((c) => (c.customFields || {}).kind === 'ecosystem').map(mapEcosystem);
}

export async function cmsGetUpdates(): Promise<OperationalUpdate[]> {
  const items = await listContent({ contentType: 'post', limit: 100 });
  return items.filter((c) => (c.customFields || {}).kind === 'operational-update').map(mapUpdate);
}

export async function cmsGetPage(slug: string): Promise<PopulatedPage | null> {
  const c = await getContent(slug);
  return c ? mapPage(c) : null;
}

export async function cmsGetPages(): Promise<PopulatedPage[]> {
  const items = await listContent({ contentType: 'page', limit: 100 });
  return items.map(mapPage);
}
