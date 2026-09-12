import { Metadata } from "next";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { ArticlePage } from "@/modules/content-engine/components";
import { ArticleMarketWidget, trackedCompaniesFromMentions } from "@/components/markets/ArticleMarketWidget";
import { ArticleInlineChart } from "@/components/markets/ArticleInlineChart";
import { FollowTopicButton } from "@/components/article/FollowTopicButton";
import { ArticleSidebar } from "@/components/article/ArticleSidebar";
import { Container } from "@/design-system/layout/container";
import { articlesService } from "@/services/data";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/modules/seo-engine/components/Breadcrumbs";
import { breadcrumbService } from "@/modules/seo-engine/services/breadcrumb-service";
import { Article } from "@/modules/content-engine/types";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { schemaService } from "@/modules/seo/services/schema-service";
import { structuredData } from "@/lib/seo/structured-data";
import { extractFaqFromHtml } from "@/lib/seo/faq-extractor";
import { staticArticleBySlug } from "@/services/data/static-content";
import { canonicalService } from "@/modules/seo/services/canonical-service";
import { resolveAuthor, getContentRedirectSlug, getArticleFeedback, listArticleComments, getArticlePoll } from "@/services/data/cms-public";
import { isAllowedImageHost } from "@/lib/safe-image";

/**
 * @fileOverview Shared article-detail resolution + rendering, used by both the
 * canonical `/<categorySlug>/<slug>` route and the legacy `/financial-intelligence/<slug>`
 * redirect target, so a content-engine guide has exactly one rendering path
 * regardless of which URL resolved it.
 */

import { getEditorialGuide } from "@/lib/articles/editorial-guides";

export async function resolveArticleForDetail(slug: string): Promise<Article | null> {
  try {
    const response = await articlesService.getArticleBySlug(slug).catch(() => ({ data: null }));
    // Live CMS first; baked snapshot keeps the article available when the CMS is offline.
    const article = (response?.data ?? staticArticleBySlug(slug)) as unknown as Article | null;
    if (article) return article;

    // Check editorial masterclass guides
    const editorial = getEditorialGuide(slug);
    if (editorial) {
      return {
        id: slug,
        slug: editorial.slug,
        title: editorial.title,
        description: editorial.description,
        body: editorial.bodyHtml,
        category: editorial.category ?? "Savings & Budgeting",
        categorySlug: editorial.categorySlug ?? "savings",
        tags: editorial.categorySlug
          ? ["Creator Economy", "YouTube", "Monetization", "RPM", "CPM"]
          : ["Savings", "Budgeting", "Emergency Fund", "Personal Finance"],
        readingTime: editorial.readingTime ?? 8,
        publishedAt: editorial.publishedAt ?? "2026-08-29T10:00:00Z",
        updatedAt: editorial.updatedAt ?? "2026-08-29T14:30:00Z",
        featuredImage: "/images/editorial/savings-budgeting.jpg",
        imageCaption: editorial.category
          ? `${editorial.category} — Imperialpedia Editorial Guide`
          : "Financial planning, emergency reserves, and deposit safety.",
        keyTakeaways: editorial.keyTakeaways,
        citations: editorial.citations,
        authorSlug: "nathan-reiff",
        reviewerSlug: "julius-mansa",
        factCheckerSlug: "yarilet-perez",
        faq: [],
      } as unknown as Article;
    }

    // Not found under this slug — it may have been renamed. Follow the recorded
    // redirect (one hop only; cms-service already collapses rename chains) rather
    // than 404ing a link that's still valid, just moved.
    const redirectSlug = await getContentRedirectSlug(slug).catch(() => null);
    if (redirectSlug && redirectSlug !== slug) {
      const targetResponse = await articlesService.getArticleBySlug(redirectSlug).catch(() => ({ data: null }));
      const target = (targetResponse?.data ?? staticArticleBySlug(redirectSlug)) as unknown as Article | null;
      if (target) {
        permanentRedirect(canonicalService.getCanonicalTag(target.slug, "article", target.categorySlug));
      }
    }
  } catch (err) {
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

  return null;
}

export async function buildArticleDetailMetadata(slug: string): Promise<Metadata> {
  try {
    const article = await resolveArticleForDetail(slug);
    if (!article) {
      return buildMetadata({
        title: "Article Not Found",
        description: "The requested financial article could not be found.",
        noIndex: true,
      });
    }
    const canonical = canonicalService.getCanonicalTag(slug, "article", article.categorySlug);
    return buildMetadata({
      title: article.title,
      description: article.description,
      keywords: article.tags,
      ogImage: isAllowedImageHost(article.featuredImage) ? article.featuredImage : undefined,
      ogType: "article",
      canonical,
    });
  } catch {
    return buildMetadata({
      title: "Article Not Found",
      description: "The requested financial article could not be found.",
      noIndex: true,
    });
  }
}

export async function ArticleDetailContent({ article }: { article: Article }) {
  try {
    const [author, reviewer, factChecker, feedback, comments, poll] = await Promise.all([
      article.authorSlug ? resolveAuthor(article.authorSlug).catch(() => null) : Promise.resolve(null),
      article.reviewerSlug ? resolveAuthor(article.reviewerSlug).catch(() => null) : Promise.resolve(null),
      article.factCheckerSlug ? resolveAuthor(article.factCheckerSlug).catch(() => null) : Promise.resolve(null),
      getArticleFeedback(article.slug).catch(() => ({ helpful: 0, notHelpful: 0 })),
      listArticleComments(article.slug).catch(() => []),
      getArticlePoll(article.slug).catch(() => null),
    ]);

    let breadcrumbs: any = [];
    try {
      breadcrumbs = breadcrumbService.generateBreadcrumbForArticle(article);
    } catch {
      breadcrumbs = [];
    }

    let articleSchema: any = null;
    try {
      articleSchema = schemaService.generateArticleSchema(article, reviewer, factChecker);
    } catch {
      articleSchema = null;
    }

    let faqSchema: any = null;
    try {
      const faqPairs = article.faq?.length ? article.faq : extractFaqFromHtml(article.body);
      faqSchema = faqPairs.length ? structuredData.faq(faqPairs) : null;
    } catch {
      faqSchema = null;
    }

    let canonicalUrl: string | undefined = undefined;
    try {
      canonicalUrl = canonicalService.getCanonicalTag(article.slug, "article", article.categorySlug);
    } catch {
      canonicalUrl = undefined;
    }

    let trackedCompanies: any[] = [];
    try {
      trackedCompanies = trackedCompaniesFromMentions(article.entityMentions);
    } catch {
      trackedCompanies = [];
    }

    const marketWidget =
      trackedCompanies.length > 0 ? (
        <Suspense fallback={null}>
          <ArticleMarketWidget entityMentions={article.entityMentions} />
        </Suspense>
      ) : null;
    const inlineChart =
      trackedCompanies.length === 1 && trackedCompanies[0]?.ticker ? (
        <Suspense fallback={null}>
          <ArticleInlineChart symbol={trackedCompanies[0].ticker} name={trackedCompanies[0].name} />
        </Suspense>
      ) : null;

    return (
      <div className="bg-background min-h-screen">
        {articleSchema && <JsonLd data={articleSchema} />}
        {faqSchema && <JsonLd data={faqSchema} />}
        <Container className="py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs breadcrumb={breadcrumbs} />}
            {article.categorySlug && (
              <FollowTopicButton categorySlug={article.categorySlug} categoryName={article.category || article.categorySlug} />
            )}
          </div>
          <ArticlePage
            slug={article.slug}
            article={article}
            author={author}
            reviewer={reviewer}
            factChecker={factChecker}
            canonicalUrl={canonicalUrl}
            feedback={feedback}
            comments={comments}
            poll={poll}
            marketWidget={marketWidget}
            inlineChart={inlineChart}
            sidebar={
              <ArticleSidebar categorySlug={article.categorySlug} categoryLabel={article.category || article.categorySlug || "Finance"} excludeSlug={article.slug} />
            }
          />
        </Container>
      </div>
    );
  } catch {
    return (
      <div className="bg-background min-h-screen">
        <Container className="py-8">
          <ArticlePage
            slug={article.slug}
            article={article}
            sidebar={
              <ArticleSidebar categorySlug={article.categorySlug} categoryLabel={article.category || article.categorySlug || "Finance"} excludeSlug={article.slug} />
            }
          />
        </Container>
      </div>
    );
  }
}
