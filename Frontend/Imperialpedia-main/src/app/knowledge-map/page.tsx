import React from 'react';
import { Container } from '@/design-system/layout/container';
import { KnowledgeGraphHub } from '@/modules/content-engine/components/KnowledgeGraph/KnowledgeGraphHub';
import { knowledgeGraphService } from '@/services/data/knowledge-graph-service';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Layers } from 'lucide-react';
import { Text } from '@/design-system/typography/text';

export const metadata: Metadata = buildMetadata({
  canonical: '/knowledge-map',
  title: 'Global Knowledge Map | Interconnected Intelligence',
  description: 'Explore the interconnected web of companies, countries, industries, and technologies using the Imperialpedia Knowledge Graph.',
});

/**
 * Financial Knowledge Graph Page (Server Entry).
 * Orchestrates the discovery of real relationships between Imperialpedia's knowledge
 * entities (companies, countries, industries, technologies).
 */
export default async function KnowledgeMapPage() {
  const response = await knowledgeGraphService.getGraphData();
  const data = response.data ?? { nodes: [], connections: [] };

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Layers className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Relational Knowledge Engine</Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Financial Knowledge Graph</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Traverse the real relationships between companies, countries, industries, and technologies indexed across Imperialpedia.
          </Text>
        </header>

        <KnowledgeGraphHub initialData={data} />
      </Container>
    </main>
  );
}
