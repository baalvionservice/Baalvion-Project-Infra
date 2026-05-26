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
import { canonicalService } from "@/modules/seo/services/canonical-service";
import { CommentIntelligenceHub } from "@/modules/content-engine/components/CommentIntelligence/CommentIntelligenceHub";
import { ArticleConnectionDisplay } from "@/modules/content-engine/components/KnowledgeGraph/ArticleConnectionDisplay";
import { Text } from "@/design-system/typography/text";
import { Zap } from "lucide-react";

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
  const article = response.data;

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
 * Optimized with Advanced Comment Intelligence and Knowledge Graph Integration.
 */
export default async function Page({ params }: ArticleRouteProps) {
  const { slug } = await params;

  const response = await articlesService.getArticleBySlug(slug);
  const article = response.data as unknown as Article;

  if (!article) {
    notFound();
  }

  const breadcrumbs = breadcrumbService.generateBreadcrumbForArticle(article);
  const articleSchema = schemaService.generateArticleSchema(article);

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={articleSchema} />
      <Container className="py-8">
        <Breadcrumbs breadcrumb={breadcrumbs} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <ArticlePage slug={slug} article={article} />

            {/* Advanced Comment Intelligence System */}
            <CommentIntelligenceHub articleId={article.id} />
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
              {/* Integrated Knowledge Graph Node Access */}
              <ArticleConnectionDisplay />

              <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                  <Zap className="h-4 w-4" /> Expert insight
                </div>
                <Text
                  variant="bodySmall"
                  className="text-muted-foreground leading-relaxed"
                >
                  Join the conversation below to discuss specific tactical
                  executions based on this research node.
                </Text>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
