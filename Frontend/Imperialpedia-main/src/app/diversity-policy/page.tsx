import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Users } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform). ISR instead of force-dynamic: content here
// changes on the order of months, not requests, and the on-publish webhook
// (/api/revalidate, called by cms-service after publish/update/delete) already
// revalidates this route instantly — force-dynamic was paying for a fresh CMS
// fetch + full re-render on every single request, including every bot/crawler
// hit, for a page that's correct 99.9% of the time without one.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('diversity-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/diversity-policy',
    });
  }
  return buildMetadata({
    title: 'Diversity Policy',
    description:
      'How Imperialpedia represents a broad range of financial situations, backgrounds, and voices across its coverage and Financial Review Board.',
    canonical: '/diversity-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function DiversityPolicyPage() {
  return <CmsPage slug="diversity-policy" eyebrow="Diversity & Inclusion" fallback={<DiversityPolicyFallback />} />;
}

function DiversityPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Diversity & Inclusion
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Diversity Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Representing a broad range of financial situations
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Personal finance looks different depending on income, geography, family structure, and
              starting point. {env.appName} aims to cover topics in a way that is useful whether a
              reader is opening their first savings account or managing a diversified portfolio, and
              we deliberately plan coverage across income levels rather than assuming a single
              &ldquo;typical&rdquo; reader.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Diversity on the Financial Review Board
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We aim for our Financial Review Board to reflect a range of professional
              backgrounds and perspectives within personal finance and markets, so that the
              review process itself benefits from more than one point of view on a given topic.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Useful regardless of starting point
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              This ties directly to the mission described on our{' '}
              <Link href="/about" className="text-primary hover:underline">
                About page
              </Link>
              : we write to make financial concepts understandable to people learning them for the
              first time, not just to those who already have a finance background, and we try to
              avoid assuming a level of existing wealth, credit access, or financial literacy that
              not every reader has.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions about this policy
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Reach us at{' '}
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
