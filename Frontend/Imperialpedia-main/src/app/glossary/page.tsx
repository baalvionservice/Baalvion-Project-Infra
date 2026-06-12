import React from 'react';
import { Metadata } from 'next';
import { BookMarked } from 'lucide-react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { buildMetadata } from '@/lib/seo';
import { listGlossaryTerms } from '@/lib/data/glossary';
import { GlossaryIndexClient } from './GlossaryIndexClient';

export const metadata: Metadata = buildMetadata({
  title: 'Financial Glossary | Definitions & Concepts',
  description:
    'Browse the Imperialpedia financial glossary — expert-vetted definitions of investing, banking, economics, and market terms, indexed A–Z for fast discovery.',
  canonical: '/glossary',
});

// Refresh the published list periodically without freezing it at build time.
export const revalidate = 300;

/**
 * Public Glossary index (Server Component).
 * Fetches the published term list server-side, sorts it A–Z, and hands the
 * pre-sorted data to a lightweight client component for in-page search/filter.
 */
export default async function GlossaryIndexPage() {
  const items = await listGlossaryTerms();
  const sorted = [...items].sort((a, b) =>
    a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
  );

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-4xl">
            <div className="flex items-center gap-3 text-primary mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BookMarked className="h-6 w-6" />
              </div>
              <Text variant="label" className="font-bold tracking-widest uppercase">
                Financial Glossary
              </Text>
            </div>
            <Text
              variant="h1"
              className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight"
            >
              Definitions &amp; <span className="text-primary">Concepts</span>
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground text-xl leading-relaxed max-w-3xl"
            >
              Expert-vetted explanations of the terms that move markets — from
              core investing principles to advanced economic mechanics. Search or
              browse alphabetically.
            </Text>
          </header>

          <GlossaryIndexClient initialItems={sorted} />
        </Container>
      </Section>
    </main>
  );
}
