import { notFound, permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { newsUrl } from '@/lib/news-url';
import { ArticleView } from '@/components/knowledge/ArticleView';

/**
 * Empty on purpose, same reasoning as [categorySlug]/[articleSlug]/page.tsx:
 * a news item's real published date/country is CMS state, not enumerable at
 * build time. Registers this as ISR with a blocking fallback instead of a
 * fully dynamic route.
 */
export async function generateStaticParams(): Promise<
  { year: string; month: string; day: string; geo: string; slug: string }[]
> {
  return [];
}

// Publishes come through /api/revalidate's revalidateTag() -- see
// lib/cms.ts's DEFAULT_REVALIDATE_SECONDS. This is only the no-webhook
// safety net, same window as the article route.
export const revalidate = 86400;

export default async function NewsPage(
  { params }: { params: Promise<{ year: string; month: string; day: string; geo: string; slug: string }> },
) {
  const { year, month, day, geo, slug } = await params;
  const article = await fetchArticleForRender(slug);

  // Real 404 (not an implicit 200) for a missing slug, and also for a slug
  // that exists but isn't actually News -- an Article's URL is /{category}/
  // {slug}, never /news/..., so serving it here would be a duplicate-content
  // URL for content that already has its own canonical home.
  if (!article || article.contentType !== 'news') notFound();

  // Canonical-taxonomy guard, same pattern as the article route: if the
  // requested date/geo/slug doesn't match the item's real published date and
  // country, redirect to whatever newsUrl() considers canonical instead of
  // serving the same content at multiple URLs.
  const canonicalPath = newsUrl(article);
  if (!canonicalPath) notFound(); // no real published date yet -- not live
  const requestedPath = `/news/${year}/${month}/${day}/${geo}/${slug}`;
  if (canonicalPath !== requestedPath) {
    permanentRedirect(canonicalPath);
  }

  return <ArticleView article={article} slug={slug} />;
}
