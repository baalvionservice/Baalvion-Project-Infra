import { notFound, permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { ArticleView } from '@/components/knowledge/ArticleView';

// No route-level `revalidate` here: reading `searchParams` (for CMS preview
// below) makes this route inherently per-request dynamic, so full-route ISR
// wouldn't apply anyway. The CMS/law-service reads it depends on are still
// cached (see lib/article-fetch.ts), which is what actually keeps this fast.

export default async function ArticlePage(
  { params, searchParams }: {
    params: Promise<{ categorySlug: string; articleSlug: string }>;
    searchParams: Promise<{ previewToken?: string; previewExp?: string }>;
  },
) {
  const { categorySlug, articleSlug } = await params;
  const { previewToken, previewExp } = await searchParams;
  const isPreview = Boolean(previewToken && previewExp);
  const article = await fetchArticleForRender(articleSlug, previewToken, previewExp);

  // Real 404 (not the themed ArticleNotFound with an implicit 200) -- see
  // src/app/[categorySlug]/[articleSlug]/not-found.tsx for the themed empty
  // state, and src/app/[categorySlug]/page.tsx for why this matters now that
  // categorySlug is a top-level catch-all.
  if (!article) notFound();

  // Canonical-taxonomy guard: if the URL's category doesn't match the
  // article's real one, redirect to whatever articleUrl() considers
  // canonical instead of serving the same content at multiple URLs. Skipped
  // in preview mode for the same reason as the legacy /article/[slug] route.
  if (!isPreview) {
    const canonicalPath = articleUrl(article);
    const requestedPath = `/${categorySlug}/${articleSlug}`;
    if (canonicalPath !== requestedPath) {
      permanentRedirect(canonicalPath);
    }
  }

  return <ArticleView article={article} slug={articleSlug} />;
}
