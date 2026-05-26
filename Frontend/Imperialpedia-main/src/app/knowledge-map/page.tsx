import React from 'react';
import { Container } from '@/design-system/layout/container';
import { KnowledgeGraphHub } from '@/modules/content-engine/components/KnowledgeGraph/KnowledgeGraphHub';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Global Knowledge Map | Interconnected Intelligence',
  description: 'Explore the interconnected web of financial concepts, assets, and institutional research using the Imperialpedia Knowledge Graph.',
});

/**
 * Financial Knowledge Graph Page (Server Entry).
 * Orchestrates the discovery of conceptual relationships across the index.
 */
export default function KnowledgeMapPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Layers className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Relational Knowledge Engine</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Financial Knowledge Graph</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Traverse the semantic hierarchy. Visualize how macro indicators, market players, and intelligence nodes are connected across the 1M+ programmatic index.
          </Text>
        </header>

        <KnowledgeGraphHub />
      </Container>
    </main>
  );
}

import { Layers } from 'lucide-react';
import { Text } from '@/design-system/typography/text';
