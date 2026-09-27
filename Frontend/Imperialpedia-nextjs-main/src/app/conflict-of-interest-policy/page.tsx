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

// Managed in the CMS (admin-platform). ISR instead of force-dynamic: content here
// changes on the order of months, not requests, and the on-publish webhook
// (/api/revalidate, called by cms-service after publish/update/delete) already
// revalidates this route instantly — force-dynamic was paying for a fresh CMS
// fetch + full re-render on every single request, including every bot/crawler
// hit, for a page that's correct 99.9% of the time without one.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('conflict-of-interest-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/conflict-of-interest-policy',
    });
  }
  return buildMetadata({
    title: 'Conflict of Interest Policy',
    description:
      'How writers, reviewers, and fact-checkers disclose personal financial interests, and why undisclosed conflicts trigger content review.',
    canonical: '/conflict-of-interest-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function ConflictOfInterestPolicyPage() {
  return (
    <CmsPage
      slug="conflict-of-interest-policy"
      eyebrow="Conflicts of Interest"
      fallback={<ConflictOfInterestPolicyFallback />}
    />
  );
}

function ConflictOfInterestPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Conflicts of Interest
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Conflict of Interest Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Disclosure obligations
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Writers, editorial reviewers, and fact-checkers are required to disclose any
              personal financial interest — a holding, an advisory role, a paid relationship —
              relevant to a topic they write about or review before contributing to that content.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. How disclosed conflicts are handled
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Where a conflict is disclosed, we either reassign the piece to a contributor without
              that conflict, or, where appropriate, publish with a visible disclosure of the
              interest. In higher-risk cases, such as a contributor holding a direct stake in a
              specific security being reviewed, that contributor does not cover it at all.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Undisclosed conflicts
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              A conflict of interest that surfaces after publication and was not disclosed in
              advance is grounds for immediate content review, and may result in a correction,
              removal, or reassignment of the piece, consistent with our{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                Corrections Policy
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Independence from commercial relationships
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              This policy sits alongside our{' '}
              <Link href="/affiliate-disclosure" className="text-primary hover:underline">
                Affiliate Disclosure
              </Link>{' '}
              and{' '}
              <Link href="/advertising-policy" className="text-primary hover:underline">
                Advertising Policy
              </Link>
              : company-level commercial relationships are disclosed separately, and neither type of
              relationship — personal or commercial — is allowed to shape editorial coverage without
              disclosure.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Questions about this policy
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
