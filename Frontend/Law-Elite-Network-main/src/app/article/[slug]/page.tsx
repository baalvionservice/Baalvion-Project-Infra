import { notFound, permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { ArticleView } from '@/components/knowledge/ArticleView';

/**
 * Legacy flat URL. Canonical articles now live at /[categorySlug]/[articleSlug]
 * for topical-silo SEO. Whenever an article has a category to build that URL,
 * permanently (308) redirect there instead of serving duplicate content at two
 * URLs. Only an article with no category at all (rare/orphaned content) has no
 * other URL to redirect to, so this route renders it directly.
 */
export default async function ArticleDeepDivePage(
  { params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ previewToken?: string; previewExp?: string }>;
  },
) {
  const { slug } = await params;
  const { previewToken, previewExp } = await searchParams;
  const isPreview = Boolean(previewToken && previewExp);
  const article = await fetchArticleForRender(slug, previewToken, previewExp);

  // Real 404 (not the themed ArticleNotFound with an implicit 200) -- see
  // src/app/article/[slug]/not-found.tsx for the themed empty state.
  if (!article) notFound();

  // Never redirect away from a live-preview request: the CMS admin iframe opens
  // exactly this URL with previewToken/previewExp, and next.config.ts only grants
  // the frame-ancestors CSP exception to /article/:slug* -- redirecting would both
  // drop the preview params (showing the published version instead of the draft)
  // and break out of the CSP-allowed iframe origin.
  if (!isPreview) {
    const canonicalPath = articleUrl(article);
    if (canonicalPath !== `/article/${slug}`) {
      permanentRedirect(canonicalPath);
    }
  }

  return <ArticleView article={article} slug={slug} />;
}
