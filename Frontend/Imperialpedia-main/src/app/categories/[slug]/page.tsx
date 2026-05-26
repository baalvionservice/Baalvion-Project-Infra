import React from "react";
import { notFound } from "next/navigation";
import { Container } from "@/design-system/layout/container";
import { Section } from "@/design-system/layout/section";
import {
  ArticleList,
  CategoryHeader,
} from "@/modules/content-engine/components";
import {
  getCategoryBySlug,
  getArticlesByCategorySlug,
} from "@/modules/content-engine/services/category-service";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { Breadcrumbs } from "@/modules/seo-engine/components/Breadcrumbs";
import { breadcrumbService } from "@/modules/seo-engine/services/breadcrumb-service";
import { linkService } from "@/modules/seo/services/link-service";
import { Text } from "@/design-system/typography/text";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Grid as GridIcon } from "lucide-react";

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generates dynamic SEO metadata for the category archive page.
 */
export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await getCategoryBySlug(slug);
  const category = response.data;

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${category.name} Intelligence`,
    description: category.description,
  });
}

/**
 * Category Archive Page Component.
 */
export default async function CategoryPage({ params }: CategoryRouteProps) {
  const { slug } = await params;

  const [categoryResponse, articlesResponse, relatedCategories] =
    await Promise.all([
      getCategoryBySlug(slug),
      getArticlesByCategorySlug(slug),
      linkService.getRelatedCategories(slug),
    ]);

  const category = categoryResponse.data;
  const articles = articlesResponse.data;

  if (!category) {
    notFound();
  }

  const breadcrumbs = breadcrumbService.generateBreadcrumbForCategory(category);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="sm">
        <Container>
          <Breadcrumbs breadcrumb={breadcrumbs} />
          <CategoryHeader category={category} />

          <div className="mt-12">
            <ArticleList articles={articles} />
          </div>

          <footer className="mt-24 pt-12 border-t">
            <div className="flex items-center gap-2 text-primary mb-8">
              <GridIcon className="h-5 w-5" />
              <Text variant="h4">Related Intelligence Hubs</Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCategories.map((cat: any) => (
                <Link key={cat.slug} href={`/categories/${cat.slug}`}>
                  <Card className="glass-card hover:border-primary/50 transition-all p-6 group">
                    <Text
                      variant="body"
                      className="font-bold group-hover:text-primary transition-colors mb-2 block"
                    >
                      {cat.name}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-muted-foreground line-clamp-2"
                    >
                      {cat.description}
                    </Text>
                  </Card>
                </Link>
              ))}
            </div>
          </footer>
        </Container>
      </Section>
    </main>
  );
}
