import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { getGlobalTopicIndexData } from '@/lib/data/topic-index';
import { TopicIndexClient } from './TopicIndexClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Grid as GridIcon } from 'lucide-react';
import { GLOSSARY_LIVE } from '@/config/glossary';

export const metadata: Metadata = buildMetadata({
  canonical: '/topics',
  title: 'Global Topic Index | Financial Intelligence Directory',
  description: 'Explore our directory of financial topics, glossary terms, and guides organized alphabetically and by category.',
});

/**
 * Global Topic Index Hub (Server Entry).
 */
export default async function GlobalTopicIndexPage() {
  if (!GLOSSARY_LIVE) notFound();

  const data = await getGlobalTopicIndexData();

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
            <Text variant="h1" as="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
              Topic <span className="text-primary">Intelligence Index</span>
            </Text>
            <Text variant="body" className="text-muted-foreground text-xl leading-relaxed max-w-3xl">
              Browse Imperialpedia's financial glossary and topic guides, organized alphabetically and by category.
            </Text>
          </header>

          <TopicIndexClient initialData={data} />
        </Container>
      </Section>
    </main>
  );
}
