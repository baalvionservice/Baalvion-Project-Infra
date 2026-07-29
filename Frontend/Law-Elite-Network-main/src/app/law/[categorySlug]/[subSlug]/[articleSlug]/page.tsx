import { permanentRedirect } from 'next/navigation';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { ArticleView, ArticleNotFound } from '@/components/knowledge/ArticleView';

export default async function ArticleDeepDivePage(
  { params, searchParams }: {
    params: Promise<{ categorySlug: string; subSlug: string; articleSlug: string }>;
    searchParams: Promise<{ previewToken?: string; previewExp?: string }>;
  },
) {
  const { categorySlug, subSlug, articleSlug } = await params;
  const { previewToken, previewExp } = await searchParams;
  const isPreview = Boolean(previewToken && previewExp);
  const article = await fetchArticleForRender(articleSlug, previewToken, previewExp);

  if (!article) return <ArticleNotFound />;

  // Canonical-taxonomy guard: if the URL's category/subcategory don't match the
  // article's real ones (or the article has no subcategory at all -- CMS content
  // doesn't carry one), redirect to whatever articleUrl() considers canonical
  // instead of serving the same content at multiple URLs. Skipped in preview mode
  // for the same reason as the legacy /article/[slug] route -- see that file.
  if (!isPreview) {
    const canonicalPath = articleUrl(article);
    const requestedPath = `/law/${categorySlug}/${subSlug}/${articleSlug}`;
    if (canonicalPath !== requestedPath) {
      permanentRedirect(canonicalPath);
    }
  }

  return <ArticleView article={article} slug={articleSlug} />;
}
