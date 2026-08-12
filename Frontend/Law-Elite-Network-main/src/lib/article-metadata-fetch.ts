import seedData from '../../docs/seed-data.json';
import { cmsGetArticleBySlug } from '@/lib/cms';
import { getArticleBySlug } from '@/data/law-content';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

// Hard cap so a slow/hung law-service response falls back to the humanized-slug
// title instead of blocking metadata generation and the page render.
const FETCH_TIMEOUT_MS = 4000;

// Deliberately does not catch a network failure (mirrors lib/article-fetch.ts's
// fetchArticleFromLawService): a clean non-2xx response resolves `null`
// ("law-service confirms no such article"), but a thrown/aborted fetch
// propagates so fetchArticleForMetadata can tell "not found" apart from
// "unreachable right now" instead of collapsing both into a false 404.
async function fetchFromLawService(slug: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // /articles/:slug resolves by slug (the ?slug= list filter is not applied server-side).
    const r = await fetch(`${API}/articles/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data ?? null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Source-of-truth order for SEO metadata/JSON-LD: central CMS first, then
 * law-service, then the bundled editorial library, then static seed -- mirrors
 * lib/article-fetch.ts's render chain. Bundled/seed MUST be included here: the
 * canonical URL is built from this result via articleUrl(), which needs a real
 * category+subcategory to point at the nested URL. Without this fallback, every
 * bundled article (the 45-article baseline, not CMS-managed) resolved to `null`
 * here, so the canonical tag pointed back at the legacy flat URL that redirects
 * away from itself -- a self-defeating canonical.
 */
export async function fetchArticleForMetadata(slug: string): Promise<any | null> {
  // Tracks whether a source failed outright rather than cleanly reporting "no
  // such record" -- see the throw at the bottom, mirrors article-fetch.ts.
  let upstreamFailed = false;

  // Same empty-draft guard as lib/article-fetch.ts: a CMS record with no
  // content blocks yet shouldn't get a real, indexable canonical/title --
  // fall through to law-service/bundled/seed instead.
  try {
    const cms = await cmsGetArticleBySlug(slug, true);
    if (cms && cms.content) {
      return {
        id: cms.id,
        title: cms.title,
        excerpt: cms.excerpt,
        tags: [],
        category: cms.category,
        author: cms.author,
        contentType: cms.contentType,
        updated_at: cms.updatedAt,
        published_at: cms.updatedAt,
        cover_image: cms.featuredImage,
        body: cms.content,
      };
    }
  } catch {
    upstreamFailed = true;
  }

  try {
    const fromLawService = await fetchFromLawService(slug);
    if (fromLawService) return fromLawService;
  } catch {
    upstreamFailed = true;
  }

  const bundled = getArticleBySlug(slug);
  if (bundled) {
    return {
      id: bundled.id,
      title: bundled.title,
      excerpt: bundled.summary,
      tags: [],
      category: bundled.category,
      subcategory: bundled.subcategory,
      author: bundled.author,
      updated_at: bundled.updatedAt,
      published_at: bundled.updatedAt,
      body: bundled.content,
    };
  }

  const seedMatch = (seedData as any).articles?.find((a: any) => a.slug === slug && a.content);
  if (seedMatch) {
    return { ...seedMatch, excerpt: seedMatch.excerpt || seedMatch.summary, body: seedMatch.content };
  }

  // Nothing matched and a source failed outright -- throw instead of
  // resolving null so a transient CMS/law-service outage doesn't quietly bake
  // a humanized-slug fallback title/canonical into the ISR cache for a page
  // that was rendering correctly moments ago.
  if (upstreamFailed) {
    throw new Error(`Unable to resolve article metadata for "${slug}": content sources are temporarily unavailable`);
  }
  return null;
}
