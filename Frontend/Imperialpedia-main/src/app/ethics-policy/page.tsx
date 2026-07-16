import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('ethics-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/ethics-policy',
    });
  }
  return buildMetadata({
    title: 'Ethics Policy',
    description:
      'The ethical standards Imperialpedia holds its writers and reviewers to: independence from commercial relationships, honest sourcing, and disclosed conflicts of interest.',
    canonical: '/ethics-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function EthicsPolicyPage() {
  return <CmsPage slug="ethics-policy" eyebrow="Editorial Ethics" fallback={<EthicsPolicyFallback />} />;
}

function EthicsPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Editorial Ethics
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Ethics Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Independence from commercial relationships
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} maintains a firewall between its commercial arrangements — advertising,
              affiliate relationships, sponsored content — and the editorial team that decides what
              gets covered and how. No advertiser, affiliate partner, or sponsor is granted
              editorial input, preview rights, or veto power over coverage. Where a commercial
              relationship exists, our{' '}
              <Link href="/affiliate-disclosure" className="text-primary hover:underline">
                Affiliate Disclosure
              </Link>{' '}
              and{' '}
              <Link href="/advertising-policy" className="text-primary hover:underline">
                Advertising Policy
              </Link>{' '}
              explain exactly what it is and how it is kept separate from content decisions.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Original work and honest representation of sources
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Plagiarism, in any form, is not tolerated. Writers must represent data and quotes
              accurately, in the context the original source intended, and must cite where a figure
              or claim came from. Paraphrasing a source is not a substitute for linking to it — if a
              claim rests on a specific dataset or publication, we link to it directly so readers
              can verify it themselves.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Conflicts of interest
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Writers and reviewers disclose any personal financial interest relevant to a topic
              they are covering, following our{' '}
              <Link href="/conflict-of-interest-policy" className="text-primary hover:underline">
                Conflict of Interest Policy
              </Link>
              . A contributor who holds a personal stake in a security, product, or company that
              would reasonably affect their objectivity does not cover it without disclosure, and in
              higher-risk cases does not cover it at all.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Correcting mistakes openly
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              When we get something wrong, we say so. Substantive errors are corrected in the open,
              with a visible note and date, as described in our{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                Corrections Policy
              </Link>
              . We do not quietly delete or rewrite claims that turn out to be inaccurate without
              leaving a record of the change.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Questions about this policy
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
