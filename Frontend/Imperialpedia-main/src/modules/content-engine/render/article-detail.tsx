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

/**
 * @fileOverview Shared article-detail resolution + rendering, used by both the
 * canonical `/<categorySlug>/<slug>` route and the legacy `/financial-intelligence/<slug>`
 * redirect target, so a content-engine guide has exactly one rendering path
 * regardless of which URL resolved it.
 */

import { getEditorialGuide } from "@/lib/articles/editorial-guides";

export async function resolveArticleForDetail(slug: string): Promise<Article | null> {
  const response = await articlesService.getArticleBySlug(slug);
  // Live CMS first; baked snapshot keeps the article available when the CMS is offline.
  const article = (response.data ?? staticArticleBySlug(slug)) as unknown as Article | null;
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
      category: "Savings & Budgeting",
      categorySlug: "savings",
      tags: ["Savings", "Budgeting", "Emergency Fund", "Personal Finance"],
      readTime: "8 min read",
      publishedAt: "2026-08-29T10:00:00Z",
      updatedAt: "2026-08-29T14:30:00Z",
      featuredImage: "/images/editorial/savings-budgeting.jpg",
      imageCaption: "Financial planning, emergency reserves, and deposit safety.",
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
  const redirectSlug = await getContentRedirectSlug(slug);
  if (redirectSlug && redirectSlug !== slug) {
    const targetResponse = await articlesService.getArticleBySlug(redirectSlug);
    const target = (targetResponse.data ?? staticArticleBySlug(redirectSlug)) as unknown as Article | null;
    if (target) {
      permanentRedirect(canonicalService.getCanonicalTag(target.slug, "article", target.categorySlug));
    }
  }

  return null;
}

export async function buildArticleDetailMetadata(slug: string): Promise<Metadata> {
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
    ogImage: article.featuredImage,
    ogType: "article",
    canonical,
  });
}

export async function ArticleDetailContent({ article }: { article: Article }) {
  const [author, reviewer, factChecker, feedback, comments, poll] = await Promise.all([
    article.authorSlug ? resolveAuthor(article.authorSlug) : Promise.resolve(null),
    article.reviewerSlug ? resolveAuthor(article.reviewerSlug) : Promise.resolve(null),
    article.factCheckerSlug ? resolveAuthor(article.factCheckerSlug) : Promise.resolve(null),
    getArticleFeedback(article.slug),
    listArticleComments(article.slug),
    getArticlePoll(article.slug),
  ]);

  const breadcrumbs = breadcrumbService.generateBreadcrumbForArticle(article);
  const articleSchema = schemaService.generateArticleSchema(article, reviewer, factChecker);
  const faqPairs = article.faq?.length ? article.faq : extractFaqFromHtml(article.body);
  const faqSchema = faqPairs.length ? structuredData.faq(faqPairs) : null;
  const canonicalUrl = canonicalService.getCanonicalTag(article.slug, "article", article.categorySlug);

  const trackedCompanies = trackedCompaniesFromMentions(article.entityMentions);
  const marketWidget =
    trackedCompanies.length > 0 ? (
      <Suspense fallback={null}>
        <ArticleMarketWidget entityMentions={article.entityMentions} />
      </Suspense>
    ) : null;
  const inlineChart =
    trackedCompanies.length === 1 && trackedCompanies[0].ticker ? (
      <Suspense fallback={null}>
        <ArticleInlineChart symbol={trackedCompanies[0].ticker} name={trackedCompanies[0].name} />
      </Suspense>
    ) : null;

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <Container className="py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs breadcrumb={breadcrumbs} />
          {article.categorySlug && (
            <FollowTopicButton categorySlug={article.categorySlug} categoryName={article.category} />
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
            <ArticleSidebar categorySlug={article.categorySlug} categoryLabel={article.category} excludeSlug={article.slug} />
          }
        />
      </Container>
    </div>
  );
}
