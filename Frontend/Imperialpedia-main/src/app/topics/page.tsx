import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { getGlobalTopicIndex } from '@/services/mock-api/topics';
import { TopicIndexClient } from './TopicIndexClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Grid as GridIcon, Sparkles } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Global Topic Index | Financial Intelligence Directory',
  description: 'Explore our master directory of financial topics. Thousands of expert-vetted definitions, guides, and insights categorized for at-scale discovery.',
});

/**
 * Global Topic Index Hub (Server Entry).
 * Orchestrates the discovery of thousands of financial concepts across alphabetical and categorical matrices.
 */
export default async function GlobalTopicIndexPage() {
  const response = await getGlobalTopicIndex();
  const data = response.data;

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-16 max-w-4xl">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <GridIcon className="h-6 w-6" />
              </div>
              <Text variant="label" className="font-bold tracking-widest uppercase">Global Knowledge Matrix</Text>
            </div>
            <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
              Topic <span className="text-primary">Intelligence Index</span>
            </Text>
            <Text variant="body" className="text-muted-foreground text-xl leading-relaxed max-w-3xl">
              Traverse the Imperialpedia knowledge graph. Explore expert-curated definitions, market trends, and learning paths across millions of indexable nodes.
            </Text>
          </header>

          <TopicIndexClient initialData={data} />
        </Container>
      </Section>
    </main>
  );
}
