/**
 * Live CMS data client (server-side) for Baalvion Investor Relations editorial
 * content. Press releases and news are now managed centrally in the Baalvion CMS
 * (admin-platform console) and served via the public delivery API. Structured
 * investor data (capital calls, NAV, votes, distributions) is intentionally NOT
 * here — it stays in its own backend.
 */
import { leadershipTeam, globalLeaders, VicePersidents, boardOfDirectors } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { slugify } from '@/utils/slug-generator';

const CMS_BASE = process.env.CMS_PUBLIC_URL || 'http://localhost:3011/api/v1/public';
const SITE = process.env.CMS_WEBSITE_SLUG || 'ir.baalvion.com';
const BASE = `${CMS_BASE}/${SITE}`;

const phUrl = (id?: string): string | undefined =>
  id ? PlaceHolderImages.find((p) => p.id === id)?.imageUrl : undefined;

interface CmsContent {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentType: string;
  contentBlocks?: Array<{ id?: string; type: string; order?: number; content?: Record<string, any> }> | null;
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

// Fetch EVERY content item of a given type by walking the paginated public API.
// The backend hard-caps page size at 100, so a single request can never return
// more than 100 rows — we loop through all pages so there is no ceiling on how
// many articles / co-founders / board members can be published. The 1000-page
// guard (≈100k items) only exists to prevent a runaway loop.
async function fetchAllContent(query: string): Promise<CmsContent[]> {
  const out: CmsContent[] = [];
  for (let page = 1; page <= 1000; page++) {
    try {
      const r = await fetch(`${BASE}/content?${query}&limit=100&page=${page}`, { cache: 'no-store' });
      if (!r.ok) break;
      const j = await r.json();
      const rows = Array.isArray(j.data) ? (j.data as CmsContent[]) : [];
      out.push(...rows);
      const p = j.pagination;
      if (!rows.length || !p || page >= p.totalPages) break;
    } catch {
      break;
    }
  }
  return out;
}

async function listNews(): Promise<CmsContent[]> {
  return fetchAllContent('contentType=news');
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
  return fetchAllContent(`contentType=${contentType}`);
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

// ── Leadership & Governance people (co-founders / executives / VPs / board) ────────
// Each person is a cms-service 'post' with customFields.kind='leadership', filed under
// a tier sub-category. Editable + publishable from the central console; the public
// site reads them here. Photo comes from the image block (editor-replaceable) or the
// customFields.imageUrl/imageId fallback; bio comes from the first paragraph block.
export type LeadershipTier =
  | 'executive-committee'
  | 'functional-leadership'
  | 'vice-presidents'
  | 'board-of-directors';

export interface LeadershipMember {
  name: string;
  /** Role / title, e.g. "Chief Executive Officer" */
  title: string;
  /** Optional VP function, e.g. "Marketing Communications" */
  position?: string;
  tier: LeadershipTier;
  slug: string;
  imageUrl?: string;
  imageId?: string;
  bio?: string;
  /** Full rich profile body rendered to HTML (paragraphs, lists, images, headings). */
  bodyHtml?: string;
  order: number;
}

function firstImageBlockSrc(c: CmsContent): string | undefined {
  const img = (c.contentBlocks || []).find((b) => b.type === 'image' && b.content?.src);
  return img?.content?.src as string | undefined;
}

function firstParagraph(c: CmsContent): string | undefined {
  const p = (c.contentBlocks || []).find((b) => b.type === 'paragraph' && b.content?.text);
  return p?.content?.text as string | undefined;
}

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Neutralise junk that comes from pasting (e.g. from ChatGPT/Word/another site): inline
// `style` (which can set near-white text colours that vanish on a white page), foreign
// `class` names, and `data-*` attributes. Keeps the semantic tags + text intact.
const stripInlineJunk = (html: string): string =>
  String(html)
    .replace(/\s(?:style|class)="[^"]*"/gi, '')
    .replace(/\s(?:style|class)='[^']*'/gi, '')
    .replace(/\sdata-[\w-]+="[^"]*"/gi, '')
    .replace(/\sdata-[\w-]+='[^']*'/gi, '');
const stripTags = (s?: string) => (s ? s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : undefined);

// Render the content blocks to an HTML string for public display. Paragraph/HTML blocks
// carry rich HTML from the editor (bold, lists, inline images, links); structural blocks
// are mapped to semantic markup. Authored content is workflow-gated (trusted).
function renderBlocksToHtml(c: CmsContent): string | undefined {
  const blocks = [...(c.contentBlocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!blocks.length) return undefined;
  const parts: string[] = [];
  // The FIRST image block is used as the hero/portrait (firstImageBlockSrc → imageUrl),
  // so skip it here to avoid showing the same photo twice. Additional images still render.
  let heroImageSkipped = false;
  for (const b of blocks) {
    const ct = b.content || {};
    switch (b.type) {
      case 'paragraph': if (ct.text) parts.push(`<div class="rt">${stripInlineJunk(String(ct.text))}</div>`); break;
      case 'html': if (ct.html) parts.push(stripInlineJunk(String(ct.html))); break;
      case 'heading': {
        const lvl = Math.min(6, Math.max(1, Number(ct.level) || 2));
        if (ct.text) parts.push(`<h${lvl}>${escapeHtml(String(ct.text))}</h${lvl}>`);
        break;
      }
      case 'image':
        if (!heroImageSkipped) { heroImageSkipped = true; break; }
        if (ct.src) parts.push(`<figure><img src="${escapeHtml(String(ct.src))}" alt="${escapeHtml(String(ct.alt || ''))}" />${ct.caption ? `<figcaption>${escapeHtml(String(ct.caption))}</figcaption>` : ''}</figure>`);
        break;
      case 'quote':
        if (ct.text) parts.push(`<blockquote>${escapeHtml(String(ct.text))}${ct.cite ? `<cite>— ${escapeHtml(String(ct.cite))}</cite>` : ''}</blockquote>`);
        break;
      case 'callout': if (ct.text) parts.push(`<div class="callout">${escapeHtml(String(ct.text))}</div>`); break;
      case 'code': if (ct.code) parts.push(`<pre><code>${escapeHtml(String(ct.code))}</code></pre>`); break;
      case 'divider': parts.push('<hr/>'); break;
      case 'button': if (ct.href) parts.push(`<a class="btn" href="${escapeHtml(String(ct.href))}">${escapeHtml(String(ct.text || 'Learn more'))}</a>`); break;
      default: break;
    }
  }
  return parts.join('\n') || undefined;
}

function mapMember(c: CmsContent): LeadershipMember {
  const cf = c.customFields || {};
  return {
    name: c.title,
    title: cf.role || c.excerpt || '',
    position: cf.position || undefined,
    tier: (cf.tier as LeadershipTier) || 'functional-leadership',
    slug: c.slug,
    // editor-uploaded photo (image block) wins, then the seeded customField URL,
    // then the local placeholder map resolved by imageId
    imageUrl: firstImageBlockSrc(c) || cf.imageUrl || phUrl(cf.imageId) || undefined,
    imageId: cf.imageId || undefined,
    bio: stripTags(firstParagraph(c)) || undefined,
    bodyHtml: renderBlocksToHtml(c) || undefined,
    order: typeof cf.order === 'number' ? cf.order : 999,
  };
}

async function listLeadership(): Promise<LeadershipMember[]> {
  const items = await listByType('post');
  return items
    .filter((c) => (c.customFields || {}).kind === 'leadership')
    .map(mapMember)
    .sort((a, b) => a.order - b.order);
}

// ── Fallback builders (used only when the CMS returns nothing — keeps the site
//    rendering offline, mirroring the seed content from @/lib/data) ───────────────
function fbMember(m: { name: string; title: string; position?: string; bio?: string; imageId?: string }, tier: LeadershipTier, order: number): LeadershipMember {
  return {
    name: m.name,
    title: m.title,
    position: m.position,
    tier,
    slug: slugify(m.name),
    imageUrl: phUrl(m.imageId),
    imageId: m.imageId,
    bio: m.bio,
    order,
  };
}
const fbExecutive = () => leadershipTeam.map((m, i) => fbMember(m as any, 'executive-committee', i));
const fbFunctional = () => globalLeaders.map((m, i) => fbMember(m as any, 'functional-leadership', i));
const fbVice = () => VicePersidents.map((m, i) => fbMember(m as any, 'vice-presidents', i));
const fbBoard = () => boardOfDirectors.map((m, i) => fbMember(m as any, 'board-of-directors', i));

/** All leadership tiers except the board, grouped for the leadership page. */
export async function cmsGetLeadership(): Promise<{
  executiveCommittee: LeadershipMember[];
  functionalLeadership: LeadershipMember[];
  vicePresidents: LeadershipMember[];
}> {
  const all = await listLeadership();
  const byTier = (t: LeadershipTier) => all.filter((m) => m.tier === t);
  const executiveCommittee = byTier('executive-committee');
  const functionalLeadership = byTier('functional-leadership');
  const vicePresidents = byTier('vice-presidents');
  // If the CMS has no leadership content at all, fall back to the bundled data.
  if (!executiveCommittee.length && !functionalLeadership.length && !vicePresidents.length) {
    return { executiveCommittee: fbExecutive(), functionalLeadership: fbFunctional(), vicePresidents: fbVice() };
  }
  return { executiveCommittee, functionalLeadership, vicePresidents };
}

/** Board of Directors members. */
export async function cmsGetBoard(): Promise<LeadershipMember[]> {
  const all = await listLeadership();
  const board = all.filter((m) => m.tier === 'board-of-directors');
  return board.length ? board : fbBoard();
}

/** A single leadership/board member by slug (with full bio from the content blocks). */
export async function cmsGetLeadershipMember(slug: string): Promise<LeadershipMember | null> {
  try {
    const r = await fetch(`${BASE}/content/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      const c = j?.data as CmsContent | undefined;
      if (c && (c.customFields || {}).kind === 'leadership') return mapMember(c);
    }
  } catch {
    /* fall through to bundled data */
  }
  // Fallback: match against bundled data by slug
  const all = [...fbExecutive(), ...fbFunctional(), ...fbVice(), ...fbBoard()];
  return all.find((m) => m.slug === slug) || null;
}
