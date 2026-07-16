import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('fact-checking');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/fact-checking',
    });
  }
  return buildMetadata({
    title: 'Fact-Checking Policy',
    description:
      'The source hierarchy and review process Imperialpedia uses to verify financial claims, from government data to our Financial Review Board.',
    canonical: '/fact-checking',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function FactCheckingPage() {
  return <CmsPage slug="fact-checking" eyebrow="Verification Standards" fallback={<FactCheckingFallback />} />;
}

function FactCheckingFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Verification Standards
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Fact-Checking Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Source hierarchy
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We prioritize primary, government, and regulatory sources over secondary commentary.
              For personal finance and markets topics that means, in order of preference: the
              Consumer Financial Protection Bureau (CFPB), the Federal Reserve, the IRS, the SEC and
              Investor.gov, the Bureau of Labor Statistics (BLS), and the FDIC, followed by academic
              research and established financial data providers. News coverage, opinion pieces, and
              other secondary sources are used for context only, never as the sole basis for a
              factual or numeric claim.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Role of the Financial Review Board
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Our Financial Review Board reviews higher-risk articles — retirement, tax, credit,
              and core investing topics — both before initial publication and on a recurring
              schedule afterward, checking that cited figures still match the current primary
              source and that the guidance given remains accurate as rules and rates change.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Keeping time-sensitive data current
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Figures like contribution limits, tax brackets, standard deductions, and benchmark
              interest rates change on a regular schedule. Articles referencing this kind of data
              carry a visible &ldquo;as of&rdquo; date, and are flagged internally for review each
              time the underlying source publishes an update, so a reader is never looking at a
              stale number without knowing it.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions or a suspected error
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you believe a specific claim is inaccurate, see our{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                Corrections Policy
              </Link>{' '}
              for how to report it, or reach us directly at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              / via{' '}
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
