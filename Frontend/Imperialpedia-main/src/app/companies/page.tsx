import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { loadCompanies } from '@/lib/data/loaders';
import { EntityList } from '@/components/lists/EntityList';
import { Pagination } from '@/components/lists/Pagination';
import { FilterBar } from '@/components/lists/FilterBar';
import { buildMetadata } from '@/lib/seo';
import { humanizeSlug } from '@/lib/utils/seo';
import { structuredData } from '@/lib/seo/structuredData';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { Breadcrumb } from '@/modules/seo-engine/types';
import { EntityBreadcrumb } from '@/components/entity/EntityBreadcrumb';
import { Metadata } from 'next';
import { Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  searchParams: Promise<{ page?: string; industry?: string }>;
}

// The company set is small and changes rarely; caching the rendered list for a few
// minutes avoids re-running the live entity fetch + pagination on every request.
export const revalidate = 300;

// A static `metadata` export can't see the requested page number, so every
// paginated result claimed page 1's URL as canonical — Google could easily
// conclude pages 2+ are duplicates of page 1 and never index them. Each page
// now self-canonicalizes to its own ?page=N URL instead.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const companies = await loadCompanies();
  const industries = Array.from(new Set(companies.map((c) => humanizeSlug(c.industry))));
  return buildMetadata({
    canonical: page > 1 ? `/companies?page=${page}` : '/companies',
    title: page > 1 ? `Institutional Nodes Index | Companies — Page ${page}` : 'Institutional Nodes Index | Companies',
    description: 'Audit global corporate benchmarks, founding intelligence, and market reach across our enterprise knowledge clusters.',
    keywords: ['companies', 'institutional index', 'corporate profiles', ...industries],
  });
}

const ITEMS_PER_PAGE = 12;

// Permanently retired industry filter views — removed from circulation, kept
// out of the generated filter list, and 404'd if the URL is hit directly.
const RETIRED_INDUSTRIES = ['semiconductors', 'software'];

export default async function CompaniesListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const industry = params.industry || 'all';

  if (RETIRED_INDUSTRIES.includes(industry.toLowerCase())) notFound();

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

  // Derived filter options — humanizeSlug turns "consumer-electronics" into
  // "Consumer Electronics" instead of the broken "Consumer-electronics" a naive
  // first-letter capitalize produced on hyphenated slugs.
  const industries = Array.from(new Set(allCompanies.map(c => c.industry)))
    .map(i => ({
      label: humanizeSlug(i),
      value: i.toLowerCase().replace(' ', '-')
    }))
    .filter(i => !RETIRED_INDUSTRIES.includes(i.value));

  const breadcrumb: Breadcrumb = {
    items: [
      { name: 'Home', item: '/' },
      { name: 'Companies', item: '/companies' },
    ],
  };
  const breadcrumbSchema = breadcrumbService.generateBreadcrumbSchema(breadcrumb);
  const itemListSchema = structuredData.itemList(paginated, 'company', start + 1);
  const webPageSchema = structuredData.webPage({
    name: 'Institutional Nodes Index | Companies',
    description: 'Audit global corporate benchmarks, founding intelligence, and market reach across our enterprise knowledge clusters.',
    path: page > 1 ? `/companies?page=${page}` : '/companies',
  });

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={webPageSchema} />
      <Section spacing="md">
        <Container>
          <EntityBreadcrumb breadcrumb={breadcrumb} />
          <header className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary">
                <Building size={24} />
              </div>
              <Badge variant="outline" className="text-secondary border-secondary/30 font-bold tracking-widest uppercase text-[10px]">
                Enterprise Taxonomy
              </Badge>
            </div>
            <Text variant="h1" as="h1" className="mb-6">Institutional Intelligence</Text>
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
