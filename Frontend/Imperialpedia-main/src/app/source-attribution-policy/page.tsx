import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('source-attribution-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/source-attribution-policy',
    });
  }
  return buildMetadata({
    title: 'Source Attribution Policy',
    description:
      'How Imperialpedia cites and links to primary sources, what counts as a citable authority, and why data points on the site are always dated.',
    canonical: '/source-attribution-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function SourceAttributionPolicyPage() {
  return (
    <CmsPage
      slug="source-attribution-policy"
      eyebrow="Sourcing Standards"
      fallback={<SourceAttributionPolicyFallback />}
    />
  );
}

function SourceAttributionPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Sourcing Standards
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Source Attribution Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. How we cite sources
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              When an article on {env.appName} references a statistic, rate, threshold, or study, we
              link directly to the primary source rather than to a secondary summary of it wherever
              possible. This lets readers check the original data themselves instead of taking our
              summary on faith.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. What counts as a citable authority
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We treat government and regulatory publications, official statistical agencies, and
              peer-reviewed academic research as primary, citable authorities — see our{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>{' '}
              for the specific hierarchy we follow. News coverage, blog commentary, and social media
              posts are treated as secondary sources: useful for context, but not sufficient on
              their own to support a factual or numeric claim.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Why data points are dated
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Figures like interest rates, contribution limits, and market benchmarks change over
              time. We date the figures we cite so a reader can immediately see how current a number
              is, rather than assuming a figure written in an article is still accurate months or
              years later.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions about a citation
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If a citation looks broken, outdated, or misattributed, let us know at{' '}
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
