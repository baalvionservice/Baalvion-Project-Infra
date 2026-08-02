import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Container } from '@/design-system/layout/container';
import { EntityHeader } from '@/components/knowledge/EntityHeader';
import { EntityOverview } from '@/components/knowledge/EntityOverview';
import { EntityEditorialOverview } from '@/components/knowledge/EntityEditorialOverview';
import { DataTable } from '@/components/knowledge/DataTable';
import { getCompanyBySlug } from '@/lib/data/loaders';
import { generateEntityMetadata, humanizeSlug, isPublicCompany, safeHostname } from '@/lib/utils/seo';
import { structuredData } from '@/lib/seo/structuredData';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import { breadcrumbService } from '@/modules/seo-engine/services/breadcrumb-service';
import { QuickStats } from '@/components/entity/QuickStats';
import { EntityTags } from '@/components/entity/EntityTags';
import { EntityBreadcrumb } from '@/components/entity/EntityBreadcrumb';
import { CompanyLeadership } from '@/components/entity/CompanyLeadership';
import { CompanyNews } from '@/components/entity/CompanyNews';
import { CompanyRelated } from '@/components/entity/CompanyRelated';
import { LiveQuoteCard } from '@/components/entity/LiveQuoteCard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Entities change rarely relative to traffic; a 5-minute revalidate window lets Next.js
// cache the rendered page instead of paying the full data-fetch cost on every request.
export const revalidate = 300;

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

  // Key Facts — every row is a verified field straight off the entity; nothing here is
  // inferred or templated filler. Rows are only added when the underlying value exists.
  const keyFacts: [string, React.ReactNode][] = [];
  if (company.legalName && company.legalName !== company.name) {
    keyFacts.push(['Legal Name', company.legalName]);
  }
  keyFacts.push(['Founded', company.founded_year]);
  keyFacts.push(['Headquarters', company.headquarters]);
  keyFacts.push(['Industry', humanizeSlug(company.industry)]);
  keyFacts.push(['Employees', company.employees.toLocaleString()]);
  const isPublic = isPublicCompany(company);
  if (company.ticker) {
    keyFacts.push([
      'Stock',
      company.stockExchange ? `${company.ticker} · ${company.stockExchange}` : company.ticker,
    ]);
  } else if (!isPublic) {
    keyFacts.push(['Ownership', 'Privately held']);
  }
  // When isPublic is true but no ticker is set (inconsistent live-service data), the row
  // is simply omitted rather than guessing at a value.
  if (company.parentOrganization) {
    keyFacts.push(['Parent Organization', company.parentOrganization]);
  }
  keyFacts.push([
    'Website',
    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {company.website.replace('https://', '')}
    </a>,
  ]);

  // A single factual sentence template built only from fields already verified above —
  // not a fabricated narrative, just a more AI-answer-friendly restatement of the facts.
  const historySentence = [
    `${company.name} was founded in ${company.founded_year}`,
    company.founders?.length ? ` by ${company.founders.join(', ')}` : '',
    ` and is headquartered in ${company.headquarters}.`,
  ].join('');

  const quickStats = [
    { label: 'Founded', value: company.founded_year },
    { label: 'Employees', value: company.employees.toLocaleString() },
    { label: 'Status', value: isPublic ? 'Public Company' : 'Private Company' },
  ];

  // sameAs entries are sourced the same way as any other entity field (static today,
  // live-service-fed going forward) with no runtime schema validation on the way in —
  // a malformed URL must degrade to "not shown" rather than crashing the page.
  const sameAsLinks = (company.sameAs ?? [])
    .map((url) => ({ url, hostname: safeHostname(url) }))
    .filter((entry): entry is { url: string; hostname: string } => entry.hostname !== null);

  const schema = structuredData.company(company);
  const breadcrumb = breadcrumbService.generateBreadcrumbForEntity(company.name, company.slug, 'companies', 'Companies');
  const breadcrumbSchema = breadcrumbService.generateBreadcrumbSchema(breadcrumb);
  const webPageSchema = structuredData.webPage({
    name: `${company.name} | Company Profile`,
    description: company.description,
    path: `/companies/${company.slug}`,
  });
  const faqSchema = company.faq?.length ? structuredData.faqPage(company.faq) : null;

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={webPageSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <Container>
        <EntityBreadcrumb breadcrumb={breadcrumb} />
        <EntityHeader name={company.name} type="Company" tags={company.tags} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-12">
            <EntityOverview description={company.description} />

            <QuickStats stats={quickStats} />

            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-4">
              {historySentence}
            </p>

            <DataTable title="Key Facts" headers={['Attribute', 'Value']} rows={keyFacts} />

            <EntityEditorialOverview entityName={company.name} overview={company.editorialOverview} />

            <CompanyLeadership company={company} />

            {company.products?.length ? (
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">Products &amp; Services</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                  {company.products.map((product) => (
                    <li key={product} className="text-sm text-muted-foreground bg-card/30 rounded-xl px-4 py-3 border border-white/5">
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Suspense fallback={<SectionSkeleton />}>
              <CompanyNews company={company} />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
              <CompanyRelated company={company} />
            </Suspense>

            {company.faq?.length ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {company.faq.map((item) => (
                    <div key={item.question} className="rounded-2xl border border-white/5 bg-card/30 p-6">
                      <h3 className="font-bold mb-2">{item.question}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24 space-y-10">
              {company.ticker && (
                <Suspense fallback={null}>
                  <LiveQuoteCard ticker={company.ticker} />
                </Suspense>
              )}
              <EntityTags entity={company} type="company" />
              {sameAsLinks.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-primary font-bold text-[10px] uppercase tracking-widest px-1">
                    Verified Profiles
                  </div>
                  <div className="flex flex-col gap-2">
                    {sameAsLinks.map(({ url, hostname }) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                      >
                        {hostname}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}

function SectionSkeleton() {
  return (
    <div className="h-40 rounded-[2rem] border border-white/5 bg-card/20 animate-pulse" aria-hidden="true" />
  );
}
