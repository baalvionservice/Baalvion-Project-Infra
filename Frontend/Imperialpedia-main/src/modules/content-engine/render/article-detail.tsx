import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { ArticlePage } from "@/modules/content-engine/components";
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
import { resolveAuthor, getContentRedirectSlug } from "@/services/data/cms-public";

/**
 * @fileOverview Shared article-detail resolution + rendering, used by both the
 * canonical `/<categorySlug>/<slug>` route and the legacy `/financial-intelligence/<slug>`
 * redirect target, so a content-engine guide has exactly one rendering path
 * regardless of which URL resolved it.
 */

export async function resolveArticleForDetail(slug: string): Promise<Article | null> {
  const response = await articlesService.getArticleBySlug(slug);
  // Live CMS first; baked snapshot keeps the article available when the CMS is offline.
  const article = (response.data ?? staticArticleBySlug(slug)) as unknown as Article | null;
  if (article) return article;

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
        <ArticlePage slug={article.slug} article={article} author={author} reviewer={reviewer} />
      </Container>
    </div>
  );
}
