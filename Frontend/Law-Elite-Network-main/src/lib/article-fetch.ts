import seedData from '../../docs/seed-data.json';
import { getArticleBySlug } from '@/data/law-content';
import { cmsGetArticleBySlug, cmsGetPreviewContent } from '@/lib/cms';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

// Hard cap so a slow/hung law-service response falls through to the next
// source instead of hanging the page render.
const FETCH_TIMEOUT_MS = 4000;

/**
 * Cached (revalidate: 300s) law-service lookup -- replaces the old per-request
 * axios call so Googlebot/visitor hits get a fast cached response instead of
 * a live round-trip on every article view. Deliberately does NOT catch a
 * network failure: a clean non-2xx response resolves `null` ("law-service
 * confirms no such article"), but a thrown/aborted fetch propagates so the
 * caller can tell "not found" apart from "unreachable right now".
 */
async function fetchArticleFromLawService(slug: string): Promise<any | null> {
  if (!/^https?:\/\//i.test(API)) return null; // no base URL configured in this env — nothing to try
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
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
 * A CMS/law-service record entirely replaces the bundled one for a shared
 * slug (see the source-of-truth order below) -- correct for almost every
 * field, since the live record is the actively-edited one. But it's whole-
 * record precedence, not a field merge: a live record authored without ever
 * opening admin-platform's CitationsPanel has no `primarySources` of its own,
 * which silently dropped the bundled article's real, pre-verified citations
 * (see the no-fabrication doc comment on `LawArticle.primarySources`) the
 * moment the same slug existed in the CMS -- even though those citations are
 * still accurate. Backfill only this one field, and only when the live
 * record's own is empty, so a live-authored citation list always wins over
 * this fallback the moment one exists.
 */
function withBundledSourcesFallback(article: any, slug: string): any {
  if (article?.primarySources?.length) return article;
  const bundled = getArticleBySlug(slug);
  if (!bundled?.primarySources?.length) return article;
  return { ...article, primarySources: bundled.primarySources };
}

/**
 * Source-of-truth order for the rendered article: CMS (preview-aware) ->
 * law-service -> bundled editorial library -> static seed. Shared by both the
 * canonical route (/[categorySlug]/[articleSlug]) and the legacy flat route
 * (/article/[slug]) so the two never drift.
 */
export async function fetchArticleForRender(
  slug: string,
  previewToken?: string,
  previewExp?: string,
): Promise<any | null> {
  if (previewToken && previewExp) {
    const preview = await cmsGetPreviewContent(slug, previewExp, previewToken);
    if (preview) return preview;
  }

  // Tracks whether a source failed outright (timeout/network error) rather
  // than cleanly reporting "no such record" -- see the throw at the bottom.
  let upstreamFailed = false;

  // Only trust the CMS record if it actually has a body -- a draft saved
  // with no content blocks yet would otherwise render as a public,
  // indexable empty article page. Same guard the seed fallback below uses.
  try {
    const cms = await cmsGetArticleBySlug(slug, true);
    if (cms && cms.content) return withBundledSourcesFallback(cms, slug);
  } catch {
    upstreamFailed = true;
  }

  try {
    const fromLawService = await fetchArticleFromLawService(slug);
    if (fromLawService) return withBundledSourcesFallback(fromLawService, slug);
  } catch {
    upstreamFailed = true;
  }

  const bundled = getArticleBySlug(slug);
  if (bundled) return bundled;

  const seedMatch = (seedData as any).articles?.find((a: any) => a.slug === slug && a.content);
  if (seedMatch) return seedMatch;

  // Nothing matched anywhere. If every source cleanly reported "no such
  // record", this genuinely doesn't exist and the caller should 404. But if a
  // source failed instead of confirming absence, we can't tell -- throwing
  // here (instead of returning null into the caller's notFound()) lets Next's
  // ISR/error-boundary machinery keep serving the last known-good cached page
  // rather than locking in a false 404 during a transient outage.
  if (upstreamFailed) {
    throw new Error(`Unable to resolve article "${slug}": content sources are temporarily unavailable`);
  }
  return null;
}
