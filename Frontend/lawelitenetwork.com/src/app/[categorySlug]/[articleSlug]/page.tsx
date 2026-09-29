import { notFound, permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { ArticleView } from '@/components/knowledge/ArticleView';

/**
 * Empty on purpose: an article's canonical URL is whatever category it is filed
 * under, which is CMS state, not something enumerable at build time. It still
 * has to exist -- without a generateStaticParams export Next treats a dynamic
 * route as fully dynamic (`f`, absent from prerender-manifest.json) and
 * re-renders it from scratch on every request. Returning [] prerenders nothing
 * but registers the route as ISR with a blocking fallback, so the first request
 * for a URL renders it and every later one is served from cache.
 */
export async function generateStaticParams(): Promise<
  { categorySlug: string; articleSlug: string }[]
> {
  return [];
}

// Publishes come through /api/revalidate's revalidateTag(), so this is only the
// no-webhook safety net -- see lib/cms.ts's DEFAULT_REVALIDATE_SECONDS.
export const revalidate = 86400;

/**
 * This route deliberately does NOT read `searchParams`. It used to accept
 * previewToken/previewExp, and that single fact made the site's entire canonical
 * article surface per-request dynamic -- a full render on every hit, for every
 * article, with no cache -- because reading searchParams opts a route out of
 * static rendering.
 *
 * It was also unreachable. Preview is scoped to /article/:slug*: /api/preview
 * validates the token and redirects to `/article/${slug}` specifically, and
 * next.config.ts grants the frame-ancestors CSP exception to that path alone
 * (everything else is frame-ancestors 'none', so the admin iframe cannot load
 * this URL even if something linked it here). Preview keeps working exactly as
 * before, on the route that actually serves it.
 */
export default async function ArticlePage(
  { params }: { params: Promise<{ categorySlug: string; articleSlug: string }> },
) {
  const { categorySlug, articleSlug } = await params;
  const article = await fetchArticleForRender(articleSlug);

  // Real 404 (not the themed ArticleNotFound with an implicit 200) -- see
  // src/app/[categorySlug]/[articleSlug]/not-found.tsx for the themed empty
  // state, and src/app/[categorySlug]/page.tsx for why this matters now that
  // categorySlug is a top-level catch-all.
  if (!article) notFound();

  // Canonical-taxonomy guard: if the URL's category doesn't match the article's
  // real one, redirect to whatever articleUrl() considers canonical instead of
  // serving the same content at multiple URLs. No longer conditional -- the
  // preview escape hatch it used to sit behind never applied here (see above).
  const canonicalPath = articleUrl(article);
  const requestedPath = `/${categorySlug}/${articleSlug}`;
  if (canonicalPath !== requestedPath) {
    permanentRedirect(canonicalPath);
  }

  return <ArticleView article={article} slug={articleSlug} />;
}
