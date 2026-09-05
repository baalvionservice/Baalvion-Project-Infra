/**
 * Live review guides from imperialpedia-service (`/entities?type=review`), where each row's
 * flattened `attributes` is the full `ReviewArticle`. Static registry fallback.
 *
 * The 9 "best-*" guides that used to live here were permanently killed in the 2026-08 SEO
 * cleanup pass (they were thin/unaudited per the original candidate list) — see REMOVED_PATHS
 * in middleware.ts, which 410s all 9 slugs regardless of what this registry contains. The
 * registry stays empty rather than deleted outright so any future live review entity from
 * imperialpedia-service still has somewhere to register a static fallback.
 */
import { ReviewArticle } from '@/types/Review';

const REGISTRY: Record<string, ReviewArticle> = {};

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.baalvion.com/api/v1/knowledge/imperialpedia/api/v1'
    : 'http://localhost:3004/api/v1');

export const reviewSlugs = Object.keys(REGISTRY);

export async function fetchReviewBySlug(slug: string): Promise<ReviewArticle | undefined> {
  try {
    // Same entities table/no on-save-webhook situation as loaders.ts's
    // ENTITY_REVALIDATE_SECONDS — no-store here forced full dynamic rendering
    // on every review page for zero real freshness benefit (the 9 known
    // reviews change on the order of weeks, not requests).
    //
    // The window follows the same reasoning, which the original 60s did not:
    // the catch-all route calls this on every slug it resolves, to find out
    // whether that slug is a review, so 60s here was the ISR window for the
    // whole article template. A day is still far fresher than "weeks".
    const res = await fetch(`${IMP_API}/entities/review/${encodeURIComponent(slug)}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const d = (await res.json())?.data;
      if (d?.slug && d?.picks) return d as ReviewArticle;
    }
  } catch {
    /* fall through to static */
  }
  return REGISTRY[slug];
}
