import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { loadTechnologies } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { Pagination } from '@/components/lists/Pagination';
import { FilterBar } from '@/components/lists/FilterBar';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = buildMetadata({
  title: 'Innovation Cluster Index | Technologies',
  description: 'Trace the evolution of innovation from generative AI to quantum computing and blockchain.',
});

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

const ITEMS_PER_PAGE = 12;

export default async function TechnologiesListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category || 'all';

  const allTechnologies = await loadTechnologies();
  
  // Filter Logic
  const filtered = allTechnologies.filter(t => 
    category === 'all' || t.category.toLowerCase().replace(' ', '-') === category.toLowerCase()
  );

  // Pagination Logic
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Derived filter options
  const categories = Array.from(new Set(allTechnologies.map(t => t.category))).map(c => ({
    label: c,
    value: c.toLowerCase().replace(' ', '-')
  }));

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Cpu size={24} />
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-bold tracking-widest uppercase text-[10px]">
                Innovation Nodes
              </Badge>
            </div>
            <Text variant="h1" className="mb-6">Technical Architecture</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Explore the backbone of modern advancement. Analyze the intersection of high-velocity research and commercial deployment.
            </Text>
          </header>

          <div className="space-y-12">
            <FilterBar filterName="Domain" options={categories} paramKey="category" />
            
            <EntityList 
              entities={paginated as any} 
              type="technology" 
              totalCount={totalCount} 
            />

            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
