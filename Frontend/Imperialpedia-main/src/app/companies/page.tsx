import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { loadCompanies } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { Pagination } from '@/components/lists/Pagination';
import { FilterBar } from '@/components/lists/FilterBar';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = buildMetadata({
  title: 'Institutional Nodes Index | Companies',
  description: 'Audit global corporate benchmarks, founding intelligence, and market reach across our enterprise knowledge clusters.',
});

interface Props {
  searchParams: Promise<{ page?: string; industry?: string }>;
}

const ITEMS_PER_PAGE = 12;

export default async function CompaniesListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const industry = params.industry || 'all';

  const allCompanies = await loadCompanies();
  
  // Filter Logic
  const filtered = allCompanies.filter(c => 
    industry === 'all' || c.industry.toLowerCase().replace(' ', '-') === industry.toLowerCase()
  );

  // Pagination Logic
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  // Derived filter options
  const industries = Array.from(new Set(allCompanies.map(c => c.industry))).map(i => ({
    label: i.charAt(0).toUpperCase() + i.slice(1),
    value: i.toLowerCase().replace(' ', '-')
  }));

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <Building size={24} />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
                Enterprise Taxonomy
              </Badge>
            </div>
            <Text variant="h1" className="mb-6">Institutional Intelligence</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Navigate the global corporate architecture. Traverse interconnected nodes of market leaders and emerging institutional players.
            </Text>
          </header>

          <div className="space-y-12">
            <FilterBar filterName="Industry" options={industries} paramKey="industry" />
            
            <EntityList 
              entities={paginated as any} 
              type="company" 
              totalCount={totalCount} 
            />

            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
