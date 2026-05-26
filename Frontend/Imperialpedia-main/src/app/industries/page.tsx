import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { loadIndustries } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { Pagination } from '@/components/lists/Pagination';
import { FilterBar } from '@/components/lists/FilterBar';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Factory } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = buildMetadata({
  title: 'Market Architecture Index | Industries',
  description: 'Explore global market segments and sector-specific intelligence nodes.',
});

interface Props {
  searchParams: Promise<{ page?: string; sector?: string }>;
}

const ITEMS_PER_PAGE = 12;

export default async function IndustriesListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const sector = params.sector || 'all';

  const allIndustries = await loadIndustries();
  
  // Filter Logic
  const filtered = allIndustries.filter(i => 
    sector === 'all' || i.sector.toLowerCase().replace(' ', '-') === sector.toLowerCase()
  );

  // Pagination Logic
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Derived filter options
  const sectors = Array.from(new Set(allIndustries.map(i => i.sector))).map(s => ({
    label: s,
    value: s.toLowerCase().replace(' ', '-')
  }));

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Factory size={24} />
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-bold tracking-widest uppercase text-[10px]">
                Market Sector Nodes
              </Badge>
            </div>
            <Text variant="h1" className="mb-6">Market Architecture</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Trace the vertical and horizontal integration of global sectors. Audit historical performance and future scalability targets.
            </Text>
          </header>

          <div className="space-y-12">
            <FilterBar filterName="Sector" options={sectors} paramKey="sector" />
            
            <EntityList 
              entities={paginated as any} 
              type="industry" 
              totalCount={totalCount} 
            />

            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
