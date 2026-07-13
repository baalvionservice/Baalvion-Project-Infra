import React from "react";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/modules/content-engine/components";
import { Container } from "@/design-system/layout/container";
import { articlesService } from "@/services/data";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { Breadcrumbs } from "@/modules/seo-engine/components/Breadcrumbs";
import { breadcrumbService } from "@/modules/seo-engine/services/breadcrumb-service";
import { Article } from "@/modules/content-engine/types";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { schemaService } from "@/modules/seo/services/schema-service";
import { structuredData } from "@/lib/seo/structured-data";
import { extractFaqFromHtml } from "@/lib/seo/faq-extractor";
import { staticArticleBySlug } from "@/services/data/static-content";
import { canonicalService } from "@/modules/seo/services/canonical-service";
import { resolveAuthor } from "@/services/data/cms-public";

interface ArticleRouteProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic SEO metadata for the article page.
 */
export async function generateMetadata({
  params,
}: ArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await articlesService.getArticleBySlug(slug);
  // Fall back to the committed snapshot when the CMS is offline (e.g. on Vercel).
  const article = response.data ?? staticArticleBySlug(slug);

  if (!article) {
    return buildMetadata({
      title: "Article Not Found",
      description: "The requested financial article could not be found.",
      noIndex: true,
    });
  }

  const canonical = canonicalService.getCanonicalTag(slug, "article");

  return buildMetadata({
    title: article.title,
    description: article.description,
    keywords: article.tags,
    ogImage: article.featuredImage,
    ogType: "article",
    canonical: canonical,
  });
}

/**
 * Supports static generation for a subset of articles.
 */
export async function generateStaticParams() {
  const response = await articlesService.getArticles(1, 20);
  return response.data.map((article) => ({
    slug: article.slug,
  }));
}

/**
 * Dynamic Article Route Page Component.
 */
export default async function Page({ params }: ArticleRouteProps) {
  const { slug } = await params;

  const response = await articlesService.getArticleBySlug(slug);
  // Live CMS first; baked snapshot keeps the article available when the CMS is offline.
  const article = (response.data ?? staticArticleBySlug(slug)) as unknown as Article;

  if (!article) {
    notFound();
  }

  const [author, reviewer] = await Promise.all([
    article.authorSlug ? resolveAuthor(article.authorSlug) : Promise.resolve(null),
    article.reviewerSlug ? resolveAuthor(article.reviewerSlug) : Promise.resolve(null),
  ]);

  const breadcrumbs = breadcrumbService.generateBreadcrumbForArticle(article);
  const articleSchema = schemaService.generateArticleSchema(article, reviewer);
  const faqPairs = article.faq?.length ? article.faq : extractFaqFromHtml(article.body);
  const faqSchema = faqPairs.length ? structuredData.faq(faqPairs) : null;

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <Container className="py-8">
        <Breadcrumbs breadcrumb={breadcrumbs} />

        <ArticlePage slug={slug} article={article} author={author} reviewer={reviewer} />
      </Container>
    </div>
  );
}
