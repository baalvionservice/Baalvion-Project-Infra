import { permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { ArticleView, ArticleNotFound } from '@/components/knowledge/ArticleView';

/**
 * Legacy flat URL. Canonical articles now live at
 * /law/[categorySlug]/[subSlug]/[articleSlug] for topical-silo SEO. Whenever an
 * article has enough taxonomy to build that nested URL, permanently (308)
 * redirect there instead of serving duplicate content at two URLs. CMS
 * articles have no subcategory field at all (see lib/cms.ts toArticle()), so
 * for those articleUrl() can't build a nested URL -- this route renders them
 * directly instead, since it's the only URL they can have.
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

  if (!article) return <ArticleNotFound />;

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
