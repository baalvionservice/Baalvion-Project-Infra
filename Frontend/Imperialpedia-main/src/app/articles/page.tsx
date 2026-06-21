import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { ArticleList } from '@/modules/content-engine/components';
import { getArticles } from '@/modules/content-engine/services';
import { staticArticleList } from '@/services/data/static-content';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

/**
 * Dynamic metadata for the articles listing page.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Financial Intelligence Library',
  description: 'Explore our comprehensive collection of expert-led financial articles, market analyses, and economic insights.',
});

/**
 * The main Articles directory page.
 * Displays a list of all published content from the platform's experts.
 */
export default async function ArticlesPage() {
  const response = await getArticles(1, 100);
  // Merge the committed snapshot so the real published articles always appear
  // (even when the CMS is offline, e.g. on Vercel); snapshot wins on slug clashes.
  const live = response.data ?? [];
  const bySlug = new Map(staticArticleList().map((a) => [a.slug, a]));
  for (const a of live) if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
  const articles = [...bySlug.values()];

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <Text variant="label" className="text-primary mb-4">Content Engine</Text>
            <Text variant="h1" className="mb-6">Financial Intelligence</Text>
            <Text variant="body" className="text-muted-foreground text-lg">
              Deep-dive analysis and educational resources curated by the world's leading financial experts and AI-driven insights.
            </Text>
          </header>

          <ArticleList articles={articles} />
        </Container>
      </Section>
    </main>
  );
}
