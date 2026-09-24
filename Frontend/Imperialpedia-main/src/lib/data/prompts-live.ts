/**
 * AI-prompt roundup posts — live from imperialpedia-service (`/prompts`), admin-managed
 * (see admin-platform's /imperialpedia/prompts). Each row is a themed article (e.g. "5 Best
 * Gemini Halloween Photo Prompts for Men") holding multiple individual prompts in `items`,
 * matching the AuraPrompt.in reference this was scoped against. Powers /prompts (full
 * directory) and /trending-prompts (curated subset, `?trending=true`), both reading the same
 * table so every trending card links to the one canonical /prompts/[slug] detail page.
 *
 * Same env/localhost-in-prod guard as review-live.ts and loaders.ts.
 */
const envImpApi = process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL?.trim();
const isProd = process.env.NODE_ENV === 'production';
const IMP_API =
  (envImpApi && !(isProd && (envImpApi.includes('localhost') || envImpApi.includes('127.0.0.1'))))
    ? envImpApi
    : (isProd ? 'https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1' : 'http://localhost:3004/api/v1');

// Roundup posts change on editorial cadence, not per-request — an hour is fresh enough
// while avoiding a live dynamic render on every gallery/detail hit.
const PROMPTS_REVALIDATE_SECONDS = 3600;

export interface PromptImage { url: string; alt?: string; credit?: string }
export interface PromptItem {
  heading: string;
  subtitle?: string;
  prompt_text: string;
  model?: string;
  images: PromptImage[];
  chatgpt_url?: string;
  gemini_url?: string;
}
export interface Prompt {
  id: string;
  slug: string;
  title: string;
  intro?: string | null;
  hero_image?: string | null;
  category?: string | null;
  tags: string[];
  items: PromptItem[];
  pro_tips?: string | null;
  is_trending: boolean;
  trending_order?: number | null;
  views_count: number;
  copies_count: number;
  // Sequelize's automatic timestamp attributes stay camelCase in JSON output even with
  // underscored:true (which only maps the DB column, not the JS/JSON key) — every other
  // field here is snake_case because those are explicit model attributes, these two aren't.
  createdAt: string;
  updatedAt?: string;
}

interface ListResult { items: Prompt[]; total: number }

/** Only an absolute http(s) URL or a same-origin root-relative path (and explicitly not a
 * protocol-relative `//host/...` one, which is an absolute URL to whatever host follows the
 * `//`) is safe to hand to an `<img src>` — every image URL here is admin-authored (a pasted
 * URL or upload result) and flows straight into the DOM, so a `javascript:`/`data:`/other
 * scheme slipped into that field must never reach a render sink unsanitized. */
function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Drops any image whose URL isn't `isSafeImageUrl` — applied once, right where prompt data
 * enters the app, so every downstream consumer (cards, marquee, detail page, sitemap, OG tags)
 * only ever sees a validated URL without having to re-check it itself. */
function sanitizePrompt(p: Prompt): Prompt {
  return {
    ...p,
    hero_image: isSafeImageUrl(p.hero_image) ? p.hero_image : null,
    items: (p.items ?? []).map((item) => ({
      ...item,
      images: (item.images ?? []).filter((img) => isSafeImageUrl(img.url)),
    })),
  };
}

async function fetchList(params: Record<string, string>): Promise<ListResult> {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${IMP_API}/prompts?${qs}`, {
      next: { revalidate: PROMPTS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { items: [], total: 0 };
    const body = await res.json();
    const items = ((body?.data?.items ?? []) as Prompt[]).map(sanitizePrompt);
    const total = body?.data?.pagination?.total ?? items.length;
    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function fetchAllPrompts(opts: { category?: string; page?: number; limit?: number } = {}): Promise<ListResult> {
  const params: Record<string, string> = { page: String(opts.page ?? 1), limit: String(opts.limit ?? 24) };
  if (opts.category) params.category = opts.category;
  return fetchList(params);
}

/** Distinct categories across every published prompt — not scoped to one page or filter, so
 * the /prompts category-chip bar stays stable no matter which page or filter is active. */
export async function fetchPromptCategories(): Promise<string[]> {
  const { items } = await fetchList({ page: '1', limit: '100' });
  return Array.from(new Set(items.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort();
}

/** One real image per post, for the hero "quick gallery" strip — a genuine cross-section of
 * what's inside the directory, not a repeated or placeholder set. */
export async function fetchGalleryImages(count = 6): Promise<PromptImage[]> {
  const { items } = await fetchList({ page: '1', limit: String(count) });
  return items.map((p) => promptCardImage(p)).filter((img): img is PromptImage => Boolean(img?.url));
}

export async function fetchTrendingPrompts(limit = 24): Promise<Prompt[]> {
  const { items } = await fetchList({ trending: 'true', limit: String(limit) });
  return items;
}

/** Other prompts in the same category, excluding the current one — the "Related Prompts"
 * rail on the detail page, so no post is a dead end with only a link back to the directory. */
export async function fetchRelatedPrompts(category: string | null | undefined, excludeSlug: string, limit = 4): Promise<Prompt[]> {
  if (!category) return [];
  const { items } = await fetchList({ category, limit: String(limit + 1) });
  return items.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

export async function fetchPromptBySlug(slug: string): Promise<Prompt | undefined> {
  try {
    const res = await fetch(`${IMP_API}/prompts/${encodeURIComponent(slug)}`, {
      next: { revalidate: PROMPTS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return undefined;
    const body = await res.json();
    const prompt = body?.data as Prompt | undefined;
    return prompt ? sanitizePrompt(prompt) : undefined;
  } catch {
    return undefined;
  }
}

/** True if the URL is the seeded "example image pending" SVG, not a real photo — never fed to
 * an OG tag, an image sitemap entry, or anywhere else Google or a social share would treat it
 * as the post's actual image. */
export function isPlaceholderPromptImage(url: string | null | undefined): boolean {
  return !url || url.includes('placeholder-pending');
}

/** First real image to show on a card — hero_image if set, else the first item's first image. */
export function promptCardImage(p: Pick<Prompt, 'hero_image' | 'items'>): PromptImage | undefined {
  if (p.hero_image) return { url: p.hero_image };
  return p.items?.[0]?.images?.[0];
}

/** Same as promptCardImage, but only returns a URL that's a real photo — undefined while the
 * post is still carrying the pending placeholder, so callers building OG tags or a sitemap
 * image entry fall back to the site default instead of publishing "EXAMPLE IMAGE PENDING". */
export function promptRealImage(p: Pick<Prompt, 'hero_image' | 'items'>): PromptImage | undefined {
  const img = promptCardImage(p);
  return img && !isPlaceholderPromptImage(img.url) ? img : undefined;
}

/** Up to `count` images, one per distinct prompt inside the post (the AuraPrompt-style
 * 3-image collage card) — a real sneak peek of what's inside, not a repeated single image. */
export function promptCollageImages(p: Pick<Prompt, 'items'>, count = 3): PromptImage[] {
  return (p.items ?? [])
    .map((item) => item.images?.[0])
    .filter((img): img is PromptImage => Boolean(img?.url))
    .slice(0, count);
}

/** One flattened grid card per individual prompt (not per post) — the PromptPlum-style
 * one-card-per-prompt library grid, built from our existing roundup-post data without
 * changing the schema. Deliberately carries no per-item engagement number: views/copies are
 * tracked per post, not per item, and showing a post-level count next to one specific prompt
 * would misrepresent it as that prompt's own stat. */
export interface FlatPromptCard {
  key: string;
  postSlug: string;
  postTitle: string;
  postCategory: string | null;
  isTrending: boolean;
  index: number;
  item: PromptItem;
}

export function flattenPromptItems(posts: Prompt[], limit?: number): FlatPromptCard[] {
  const cards: FlatPromptCard[] = [];
  for (const post of posts) {
    (post.items ?? []).forEach((item, i) => {
      if (!item.images?.[0]?.url) return;
      cards.push({
        key: `${post.slug}-${i}`,
        postSlug: post.slug,
        postTitle: post.title,
        postCategory: post.category ?? null,
        isTrending: post.is_trending,
        index: i,
        item,
      });
    });
  }
  return typeof limit === 'number' ? cards.slice(0, limit) : cards;
}
