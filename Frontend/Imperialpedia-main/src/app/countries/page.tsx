import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { loadCountries } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { Pagination } from '@/components/lists/Pagination';
import { FilterBar } from '@/components/lists/FilterBar';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Globe } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string; region?: string }>;
}

// A static `metadata` export can't see the requested page number, so every
// paginated result claimed page 1's URL as canonical. Each page now
// self-canonicalizes to its own ?page=N URL instead.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  return buildMetadata({
    canonical: page > 1 ? `/countries?page=${page}` : '/countries',
    title: page > 1 ? `Sovereign Nodes Index | Countries — Page ${page}` : 'Sovereign Nodes Index | Countries',
    description: 'Traverse global economic profiles and geopolitical insights across our 200+ sovereign nodes.',
  });
}

const ITEMS_PER_PAGE = 12;

export default async function CountriesListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const region = params.region || 'all';

  const allCountries = await loadCountries();
  
  // Filter Logic
  const filtered = allCountries.filter(c => 
    region === 'all' || c.region.toLowerCase().replace(' ', '-') === region.toLowerCase()
  );

  // Pagination Logic
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Derived filter options
  const regions = Array.from(new Set(allCountries.map(c => c.region))).map(r => ({
    label: r,
    value: r.toLowerCase().replace(' ', '-')
  }));

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Globe size={24} />
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 font-bold tracking-widest uppercase text-[10px]">
                Global Taxonomy
              </Badge>
            </div>
            <Text variant="h1" className="mb-6">Sovereign Discovery Hub</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Audit the world's most scalable sovereign data index. Traverse interconnected geopolitical nodes and economic benchmarks.
            </Text>
          </header>

          <div className="space-y-12">
            <FilterBar filterName="Region" options={regions} paramKey="region" />
            
            <EntityList 
              entities={paginated as any} 
              type="country" 
              totalCount={totalCount} 
            />

            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </Container>
      </Section>
    </main>
  );
}

import { Badge } from '@/components/ui/badge';
