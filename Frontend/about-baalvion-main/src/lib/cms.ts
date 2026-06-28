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

// Strip HTML tags idempotently. A single regex pass is not sufficient because
// removing an inner match can re-form a new tag from the surrounding characters
// (e.g. `<<script>>` or `<scr<b>ipt>`). Re-apply until the output stabilizes so
// no residual tag fragments remain.
function stripHtmlTags(input: string): string {
  let out = input;
  let prev: string;
  do {
    prev = out;
    out = out.replace(/<[^>]+>/g, '');
  } while (out !== prev);
  return out;
}

// Resolve the CMS delivery API base.
//   1. An explicit `CMS_PUBLIC_URL` ALWAYS wins — set it per-environment (Vercel
//      project env, Docker `.env`, or local `.env.local`). This is the canonical knob.
//   2. On Vercel with no override, default to the public CMS host instead of a
//      `localhost` that does not exist in the cloud — that localhost fallback was the
//      direct cause of the home page's "Service Temporarily Unavailable" 500.
//   3. Everywhere else (local dev) fall back to a local cms-service.
// Trailing slashes are stripped so `${BASE}/...` never produces a `//`.
// The canonical production CMS delivery host is the API gateway. The former
// `cms.baalvion.com` host does not resolve in production (DNS fails), which sent
// every CMS fetch to a dead host and forced the static fallback on; use the
// gateway's public delivery path instead. A deploy can still override via
// `CMS_PUBLIC_URL`.
const PROD_CMS_BASE = 'https://api.baalvion.com/api/v1/public';
const CMS_BASE = (
  process.env.CMS_PUBLIC_URL ||
  (process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? PROD_CMS_BASE
    : 'http://localhost:3018/api/v1/public')
).replace(/\/+$/, '');
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

// Per-request timeout so a slow/hung CMS can never stall a page render indefinitely;
// an aborted attempt is treated like any other transient failure and retried.
const REQUEST_TIMEOUT_MS = 8000;

async function fetchJSON(url: string, attempts = 3): Promise<any | null> {
  // Retry transient failures (network errors / timeouts / 5xx) with small backoff so a
  // brief CMS hiccup at build or revalidation time doesn't surface as a hard null. A 4xx
  // (e.g. 404) is a genuine "not found" and returns null immediately without retry.
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      // Fully dynamic delivery: every request fetches live content from the central
      // CMS (admin platform) with no caching, so editorial changes appear instantly
      // and no stale/static snapshot is ever served. `no-store` opts every route that
      // reads the CMS into dynamic rendering, which is why content pages also export
      // `dynamic = 'force-dynamic'`.
      const r = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (r.ok) return await r.json();
      if (r.status >= 400 && r.status < 500) return null; // not-found / client error → don't retry
      // 5xx → fall through and retry
    } catch {
      // network error / timeout (abort) → fall through and retry
    } finally {
      clearTimeout(timer);
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
    }
  }
  return null;
}

// The CMS delivery API caps a single page at 100 items and returns pagination meta.
const CMS_PAGE_MAX = 100;
// Safety ceiling for "fetch every item of a type" so an unbounded dataset (e.g. tens of
// thousands of articles) can never pull every row into a single server render. Index
// pages that can grow without bound use the paginated readers (`listContentPage`) and
// page through the UI instead of relying on this.
const AGGREGATE_CAP = 2000;

export interface CmsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function buildContentQuery(
  params: Record<string, string | number | undefined>,
  page: number,
  limit: number,
): string {
  const qs = new URLSearchParams();
  qs.set('page', String(Math.max(page, 1)));
  qs.set('limit', String(Math.min(Math.max(limit, 1), CMS_PAGE_MAX)));
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'limit' && k !== 'page' && v !== undefined && v !== null) qs.set(k, String(v));
  }
  return qs.toString();
}

/** A single page of content plus its pagination meta — for index pages with UI paging. */
async function listContentPage(
  params: Record<string, string | number | undefined> = {},
  page = 1,
  limit = 24,
): Promise<{ items: CmsContent[]; pagination: CmsPagination | null }> {
  const j = await fetchJSON(`${BASE}/content?${buildContentQuery(params, page, limit)}`);
  const items = j && Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
  const pagination = j && j.pagination ? (j.pagination as CmsPagination) : null;
  return { items, pagination };
}

/**
 * Every item matching a query, paginating through all pages up to AGGREGATE_CAP.
 * Replaces the former silent 100-item cap that dropped any content beyond the first
 * page — so all content authored in the admin panel is actually fetched.
 */
async function fetchAllContent(
  params: Record<string, string | number | undefined> = {},
  cap = AGGREGATE_CAP,
): Promise<CmsContent[]> {
  const out: CmsContent[] = [];
  let page = 1;
  // Bounded by the page count needed to reach `cap`, plus one — so a misreporting API
  // can never spin this loop forever.
  const maxPages = Math.ceil(cap / CMS_PAGE_MAX) + 1;
  for (let guard = 0; guard < maxPages; guard++) {
    const { items, pagination } = await listContentPage(params, page, CMS_PAGE_MAX);
    out.push(...items);
    if (out.length >= cap) return out.slice(0, cap);
    if (!pagination || !pagination.hasNext || items.length === 0) break;
    page += 1;
  }
  return out;
}

/** Back-compat list reader: returns every matching item (no longer capped at 100). */
async function listContent(params: Record<string, string | number | undefined> = {}): Promise<CmsContent[]> {
  return fetchAllContent(params);
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
      if (b.type === 'html') return stripHtmlTags(String(c.html || ''));
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
    image: c.featuredImage || '/images/placeholder.svg',
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

// ── Paginated index readers ──────────────────────────────────────────────────
// Index pages that can grow without bound (articles, projects) read one page at a
// time and render pagination controls, rather than pulling the entire collection
// into a single render. `page` is 1-based; `limit` is clamped to the API's max.
export interface PagedResult<T> {
  items: T[];
  pagination: CmsPagination | null;
}

export async function cmsListProjects(page = 1, limit = 24): Promise<PagedResult<Project>> {
  const { items, pagination } = await listContentPage({ contentType: 'portfolio_item' }, page, limit);
  return { items: items.map(mapProject), pagination };
}

export async function cmsListArticles(page = 1, limit = 24): Promise<PagedResult<Article>> {
  const { items, pagination } = await listContentPage({ contentType: 'news' }, page, limit);
  return { items: items.map(mapArticle), pagination };
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

/**
 * Lightweight reader for simple marketing / legal pages (company, trust,
 * contact, privacy, terms). Exposes the raw customFields (pillars, badges,
 * contact info, etc.) and a rendered HTML body so page components can hydrate
 * from the CMS while keeping their existing markup, with a hardcoded fallback.
 */
export interface SitePage {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  bodyHtml: string;
  custom: Record<string, any>;
  seo?: SEOMetadata;
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

export async function cmsGetSitePage(slug: string): Promise<SitePage | null> {
  const c = await getContent(slug);
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? undefined,
    bodyHtml: blocksToHtml(c.contentBlocks),
    custom: c.customFields || {},
    seo: mapSeo(c.seoMetadata),
  };
}

// ── Rich documents (services, industries, case studies, about, rich articles) ──
// A structured body (headings / paragraphs / lists / html) plus FAQ pairs and
// arbitrary customFields, so the new authority pages render real formatted
// content and emit FAQ / Service / CaseStudy schema. All of this is managed
// centrally in the CMS — these readers simply map the delivery API shape.
export interface RichBlock {
  type: 'heading' | 'paragraph' | 'list' | 'html' | 'quote';
  level?: number;
  text?: string;
  items?: string[];
  ordered?: boolean;
  html?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface RichDoc {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  kind: string;
  category?: string;
  author?: string;
  readTime?: string;
  image?: string;
  blocks: RichBlock[];
  faqs: FaqItem[];
  custom: Record<string, any>;
  seo?: SEOMetadata;
  createdAt: string;
  updatedAt: string;
}

function mapBlocks(blocks?: Block[]): RichBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b): RichBlock => {
      const c = b.content || {};
      if (b.type === 'heading') return { type: 'heading', level: Number(c.level) || 2, text: String(c.text ?? '') };
      if (b.type === 'html') return { type: 'html', html: String(c.html ?? '') };
      if (b.type === 'quote') return { type: 'quote', text: String(c.text ?? '') };
      if (b.type === 'list' || Array.isArray(c.items)) {
        return { type: 'list', ordered: !!c.ordered, items: (Array.isArray(c.items) ? c.items : []).map(String) };
      }
      return { type: 'paragraph', text: String(c.text ?? '') };
    })
    .filter((b) => (b.text && b.text.length > 0) || (b.html && b.html.length > 0) || (b.items && b.items.length > 0));
}

function mapRichDoc(c: CmsContent): RichDoc {
  const cf = c.customFields || {};
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt ?? undefined,
    kind: cf.kind || c.contentType,
    category: cf.category,
    author: cf.author,
    readTime: cf.readTime,
    image: c.featuredImage || undefined,
    blocks: mapBlocks(c.contentBlocks),
    faqs: Array.isArray(cf.faqs) ? cf.faqs.filter((f: any) => f && f.q && f.a) : [],
    custom: cf,
    seo: mapSeo(c.seoMetadata),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function listByType(contentType: string, kind?: string): Promise<RichDoc[]> {
  const items = await listContent({ contentType, limit: 100 });
  const docs = items.map(mapRichDoc);
  return kind ? docs.filter((d) => (d.custom.kind || '') === kind) : docs;
}

// Service pages live as contentType `product` (kind=service).
export const cmsGetServices = (): Promise<RichDoc[]> => listByType('product', 'service');
// Industry pages live as contentType `doc` (kind=industry).
export const cmsGetIndustries = (): Promise<RichDoc[]> => listByType('doc', 'industry');
// Case studies live as contentType `event` (kind=case_study).
export const cmsGetCaseStudies = (): Promise<RichDoc[]> => listByType('event', 'case_study');
// About sub-pages (mission/vision/story/why) live as contentType `doc` (kind=company-about).
export const cmsGetAboutPages = (): Promise<RichDoc[]> => listByType('doc', 'company-about');

/** A single rich document by slug — used by service/industry/case-study/about/article detail pages. */
export async function cmsGetRichDoc(slug: string): Promise<RichDoc | null> {
  const c = await getContent(slug);
  return c ? mapRichDoc(c) : null;
}
