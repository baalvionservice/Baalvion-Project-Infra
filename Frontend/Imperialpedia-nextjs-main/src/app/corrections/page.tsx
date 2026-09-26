import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
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
  const page = await getCmsPage('corrections');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/corrections',
    });
  }
  return buildMetadata({
    title: 'Corrections Policy',
    description:
      'How to report a suspected error on Imperialpedia, how we verify it against primary sources, and the difference between a minor fix and a noted correction.',
    canonical: '/corrections',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function CorrectionsPage() {
  return <CmsPage slug="corrections" eyebrow="Accountability" fallback={<CorrectionsFallback />} />;
}

function CorrectionsFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Accountability
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Corrections Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Reporting a suspected error
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you believe something on {env.appName} is factually wrong, out of date, or
              misattributed, tell us. Email{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or use{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>{' '}
              with the article URL, the specific claim you are questioning, and, where possible, a
              link to the source you believe contradicts it.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. How reports are verified
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Every report is checked against the original primary source used in the article —
              a regulator's publication, an official dataset, a filing, or a rate table — following
              the same source hierarchy described in our{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>
              . If the underlying source has changed since publication (a rate was updated, a
              threshold was revised), we treat that as new information to incorporate, not
              necessarily an error in the original piece.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Minor fixes vs. substantive corrections
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Minor issues — a typo, a broken link, a formatting error, an updated figure that does
              not change the article's conclusion — are fixed silently as part of routine
              maintenance. Substantive corrections — anything that changes a material fact,
              conclusion, or recommendation in the piece — are noted directly in the article with
              the date of the correction and a brief description of what changed, so readers who
              saw the earlier version can see exactly what was updated and why.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions about this policy
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Reach the editorial team at{' '}
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
