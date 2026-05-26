import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { EntityHeader } from '@/components/knowledge/EntityHeader';
import { EntityOverview } from '@/components/knowledge/EntityOverview';
import { DataTable } from '@/components/knowledge/DataTable';
import { RelatedEntities } from '@/components/knowledge/RelatedEntities';
import { getCompanyBySlug } from '@/lib/data/loaders';
import { generateEntityMetadata } from '@/lib/utils/seo';
import { structuredData } from '@/lib/seo/structuredData';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { QuickStats } from '@/components/entity/QuickStats';
import { RelatedHighlights } from '@/components/entity/RelatedHighlights';
import { AIInsight } from '@/components/ai/AIInsight';
import { EntityAnalytics } from '@/components/entity/EntityAnalytics';
import { EntityTags } from '@/components/entity/EntityTags';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: 'Company Not Found' };
  return generateEntityMetadata(company, 'company');
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const technicalData = [
    ['Founded', company.founded_year],
    ['Headquarters', company.headquarters],
    ['Industry', <span className="capitalize">{company.industry}</span>],
    ['Employees', company.employees.toLocaleString()],
    ['Website', <a href={company.website} target="_blank" className="text-primary hover:underline">{company.website.replace('https://', '')}</a>]
  ];

  const quickStats = [
    { label: 'Founded', value: company.founded_year },
    { label: 'Employees', value: company.employees.toLocaleString() },
    { label: 'Status', value: 'Institutional' }
  ];

  const schema = structuredData.entity(company, 'company');

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <JsonLd data={schema} />
      <Container>
        <EntityHeader name={company.name} type="Company" tags={company.tags} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-12">
            <EntityOverview description={company.description} />
            
            <QuickStats stats={quickStats} />
            
            <DataTable title="Institutional Handshake" headers={['Attribute', 'Value']} rows={technicalData} />

            <EntityAnalytics type="company" slug={company.slug} />
            
            <RelatedEntities entities={[]} />
          </div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24 space-y-10">
              <EntityTags entity={company} type="company" />
              <AIInsight entityType="company" slug={company.slug} />
              <RelatedHighlights entityId={company.id} />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
