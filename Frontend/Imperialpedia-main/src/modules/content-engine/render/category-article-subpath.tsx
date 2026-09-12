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

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CategoryArticleSubpathProps {
  params: Promise<{ slug: string }>;
}

export async function generateCategoryArticleMetadata({ params }: CategoryArticleSubpathProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // 1. Try content-engine guide / article
    const article = await resolveArticleForDetail(slug).catch(() => null);
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
  } catch {
    return buildMetadata({
      title: "Article Not Found",
      description: "The requested article could not be found.",
      noIndex: true,
    });
  }
}

export async function CategoryArticleSubpathPage({
  categorySlug,
  params,
}: {
  categorySlug?: string;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    // 1. Check content-engine guide / article
    const article = await resolveArticleForDetail(slug).catch(() => null);
    if (article) {
      if (categorySlug && article.categorySlug && article.categorySlug !== categorySlug) {
        permanentRedirect(`/${article.categorySlug}/${slug}`);
      }
      return await ArticleDetailContent({ article });
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
  } catch (err) {
    // Re-throw Next.js navigation signals (redirects/404s) so they function normally
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: string }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (err as { digest: string }).digest.startsWith("NEXT_NOT_FOUND"))
    ) {
      throw err;
    }
  }

  notFound();
}
