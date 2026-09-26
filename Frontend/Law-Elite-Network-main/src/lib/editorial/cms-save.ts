import { extractLinks, markdownToHtml, stripMarkdown } from '@/lib/editorial/markdown';

const IS_PROD = process.env.NODE_ENV === 'production';
const SITE = process.env.CMS_WEBSITE_SLUG || 'law-elite-network';

/**
 * Base of the CMS admin API for this site. Defaults to the same gateway the
 * public delivery URL uses (…/api/v1/public -> …/api/v1/cms/websites); set
 * CMS_ADMIN_URL to override.
 */
export function cmsAdminBase(): string {
  const explicit = process.env.CMS_ADMIN_URL?.trim();
  const root = explicit
    || (process.env.CMS_PUBLIC_URL?.trim() || (IS_PROD ? 'https://api.baalvion.com/api/v1/public' : 'http://localhost:3011/api/v1/public')).replace(/\/public\/?$/, '/cms/websites');
  return `${root.replace(/\/$/, '')}/${SITE}`;
}

export interface SaveInput {
  title: string;
  slug?: string;
  excerpt: string;
  /** Studio Markdown. */
  body: string;
  categoryId: string;
  author: string;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const slugifyTitle = (title: string) =>
  title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 110).replace(/-+$/, '');

/** Outside links in the body become the article's cited sources, which the site shows as "Primary sources". */
export function citationsOf(body: string): { title: string; url: string }[] {
  const seen = new Set<string>();
  return extractLinks(body)
    .filter((l) => /^https?:\/\//i.test(l.href))
    .filter((l) => !seen.has(l.href) && !!seen.add(l.href))
    .map((l) => ({ title: l.text.slice(0, 200), url: l.href }));
}

/** Validates the editor's input; returns the first problem in plain words, or null. */
export function validateSave(i: Partial<SaveInput>): string | null {
  if (!i.title?.trim()) return 'Add a headline before saving.';
  if (i.title.length > 500) return 'The headline is too long.';
  if (!i.body?.trim()) return 'The article body is empty.';
  if (!i.categoryId || !UUID_RE.test(i.categoryId)) return 'Choose a category.';
  if ((i.excerpt || '').length > 2000) return 'The summary is too long.';
  if (!i.author?.trim() || i.author.length > 120) return 'Add the author name for the byline.';
  if (i.slug && !/^[a-z0-9-]+$/.test(i.slug)) return 'The URL slug can only use lowercase letters, numbers and hyphens.';
  return null;
}

/**
 * The CMS content record for a draft. `contentType: 'article'` and the single
 * html block are what the website's reader expects (see blocksToHtml in
 * lib/cms.ts). `isUpdate` omits the fields the CMS only accepts on create.
 */
export function buildContentPayload(i: SaveInput, isUpdate: boolean) {
  const words = stripMarkdown(i.body).split(/\s+/).filter(Boolean).length;
  const citations = citationsOf(i.body);
  const payload: Record<string, unknown> = {
    title: i.title.trim(),
    excerpt: i.excerpt.trim() || null,
    categoryId: i.categoryId,
    contentBlocks: [{ id: 'studio-body', type: 'html', order: 0, content: { html: markdownToHtml(i.body) } }],
    seoMetadata: { title: i.title.trim().slice(0, 200), ...(i.excerpt.trim() ? { description: i.excerpt.trim().slice(0, 500) } : {}) },
    customFields: {
      author: i.author.trim(),
      readingTime: `${Math.max(1, Math.round(words / 220))} min read`,
      ...(citations.length ? { citations } : {}),
      source: 'article-studio',
    },
  };
  if (!isUpdate) {
    payload.contentType = 'article';
    payload.slug = i.slug || slugifyTitle(i.title);
  }
  return payload;
}
