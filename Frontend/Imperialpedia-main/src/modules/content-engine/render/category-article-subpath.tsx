import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import {
  resolveArticleForDetail,
  buildArticleDetailMetadata,
  ArticleDetailContent,
} from "@/modules/content-engine/render/article-detail";
import { newsArticles } from "@/lib/data.news";
import { getPublishedNewsBySlug } from "@/services/data/cms-public";
import { staticNewsBySlug } from "@/services/data/static-content";
import { newsArticleHref } from "@/lib/data/article-url";
import { buildMetadata } from "@/lib/seo";

interface CategoryArticleSubpathProps {
  params: Promise<{ slug: string }>;
}

export async function generateCategoryArticleMetadata({ params }: CategoryArticleSubpathProps): Promise<Metadata> {
  const { slug } = await params;

  // 1. Try content-engine guide / article
  const article = await resolveArticleForDetail(slug);
  if (article) {
    return buildArticleDetailMetadata(slug);
  }

  // 2. Try news article
  const newsItem =
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug).catch(() => null)) ??
    staticNewsBySlug(slug);

  if (newsItem) {
    return buildMetadata({
      title: newsItem.title,
      description: newsItem.excerpt,
      canonical: newsArticleHref(newsItem),
    });
  }

  return buildMetadata({
    title: "Article Not Found",
    description: "The requested article could not be found.",
    noIndex: true,
  });
}

export async function CategoryArticleSubpathPage({
  categorySlug,
  params,
}: {
  categorySlug?: string;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Check content-engine guide / article
  const article = await resolveArticleForDetail(slug);
  if (article) {
    if (categorySlug && article.categorySlug && article.categorySlug !== categorySlug) {
      permanentRedirect(`/${article.categorySlug}/${slug}`);
    }
    return <ArticleDetailContent article={article} />;
  }

  // 2. Check news article
  const newsItem =
    newsArticles.find((a) => a.slug === slug) ??
    (await getPublishedNewsBySlug(slug).catch(() => null)) ??
    staticNewsBySlug(slug);

  if (newsItem) {
    const targetUrl = newsArticleHref(newsItem);
    if (targetUrl) {
      permanentRedirect(targetUrl);
    }
  }

  notFound();
}
