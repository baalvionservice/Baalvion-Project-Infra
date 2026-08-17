import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Library, ExternalLink } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform). ISR instead of force-dynamic: content here
// changes on the order of months, not requests, and the on-publish webhook
// (/api/revalidate, called by cms-service after publish/update/delete) already
// revalidates this route instantly.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('methodology');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/methodology',
    });
  }
  return buildMetadata({
    title: 'Sources & Methodology',
    description:
      'How Imperialpedia selects and uses sources for financial and economic information — the authoritative institutions we reference and how we decide what to cite.',
    canonical: '/methodology',
  });
}

const LAST_UPDATED = 'August 17, 2026';

interface SourceEntry {
  name: string;
  url: string;
  useCase: string;
}

const AUTHORITATIVE_SOURCES: SourceEntry[] = [
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov', useCase: 'Monetary policy, interest rate decisions, household economics data' },
  { name: 'U.S. Securities and Exchange Commission (SEC)', url: 'https://www.sec.gov', useCase: 'Securities regulation, company filings, investor protection rules' },
  { name: 'Financial Industry Regulatory Authority (FINRA)', url: 'https://www.finra.org', useCase: 'Broker-dealer rules, investor education, market conduct standards' },
  { name: 'Internal Revenue Service (IRS)', url: 'https://www.irs.gov', useCase: 'Tax rules, filing thresholds, retirement account limits' },
  { name: 'U.S. Bureau of Labor Statistics (BLS)', url: 'https://www.bls.gov', useCase: 'Consumer Price Index, employment data, inflation figures' },
  { name: 'U.S. Bureau of Economic Analysis (BEA)', url: 'https://www.bea.gov', useCase: 'GDP, personal income and spending, national accounts data' },
  { name: 'World Bank', url: 'https://www.worldbank.org', useCase: 'Global economic indicators, country-level development data' },
  { name: 'International Monetary Fund (IMF)', url: 'https://www.imf.org', useCase: 'Global financial stability data, cross-country economic outlooks' },
];

export default async function MethodologyPage() {
  return (
    <CmsPage slug="methodology" eyebrow="Sources & Methodology" fallback={<MethodologyFallback />} />
  );
}

function MethodologyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Library className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Sources &amp; Methodology
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Our Sources
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              How we select sources
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              For factual financial and economic claims — a rate, a threshold, a historical
              average, a definition — we prioritize primary and institutional sources over
              secondary reporting: the regulator or agency that actually sets the rule, publishes
              the data, or governs the market, rather than a third party summarizing it. When a
              claim can be traced to one of the sources below, we cite it directly rather than an
              intermediary.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              Where sources are used
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              For factual financial and economic information, Imperialpedia may reference
              authoritative sources including the institutions below, depending on the topic.
              Not every article cites every source — each piece links to whichever of these
              applies to the specific claim being made, alongside any other primary source
              (a specific filing, a named dataset) unique to that article. Per-article citations
              appear at the end of the piece under &ldquo;Sources &amp; References.&rdquo;
            </Text>
            <ul className="not-prose divide-y divide-border rounded-lg border border-border">
              {AUTHORITATIVE_SOURCES.map((source) => (
                <li key={source.url} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
                    >
                      {source.name}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                  </div>
                  <span className="text-sm text-muted-foreground sm:text-right">{source.useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              What we don&apos;t do
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We don&apos;t cite a numeric rate, threshold, or figure without a source and a date,
              and we don&apos;t carry forward a stale number once the underlying source has been
              updated — see our{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                Corrections Policy
              </Link>{' '}
              for how updates are handled. For the full review process a piece goes through before
              publication, see our{' '}
              <Link href="/editorial-policy" className="text-primary hover:underline">
                Editorial Policy
              </Link>{' '}
              and{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              Questions about a source
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If a citation looks outdated or you believe a source has been misread, reach the
              editorial team at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              .
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
