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
  const page = await getCmsPage('editorial-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/editorial-policy',
    });
  }
  return buildMetadata({
    title: 'Editorial Policy',
    description:
      'How Imperialpedia plans, writes, and reviews financial content, and how our editorial team stays independent from advertisers and sponsors.',
    canonical: '/editorial-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function EditorialPolicyPage() {
  return (
    <CmsPage slug="editorial-policy" eyebrow="Editorial Standards" fallback={<EditorialPolicyFallback />} />
  );
}

function EditorialPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Editorial Standards
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Editorial Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. How content is planned
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Every article on {env.appName} starts from a research brief: a topic, the primary
              sources we intend to draw from (regulators, official statistics, filings), and the
              reader question it is meant to answer. Writers work from that brief rather than from
              a keyword list, so coverage decisions are driven by what is genuinely useful to
              someone learning a topic, not by what is easiest to rank for.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Writing and review before publish
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Drafts pass through a structured review before they go live: a factual check against
              the sources cited, a plain-language pass to remove jargon, and a check that any
              numeric claim (a rate, a threshold, a historical average) is dated and sourced. See
              our{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>{' '}
              for the detail on how claims are verified.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Editorial independence from advertisers and sponsors
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Advertising and any sponsored placements are sold and managed separately from the
              editorial team, and neither an advertiser nor a sponsor can request, approve, or veto
              editorial coverage. If a company or product is mentioned in an article, that decision
              is made on editorial merit alone, independent of any commercial relationship the site
              may have with that company elsewhere.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Final sign-off
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Final sign-off on published content rests with the editorial team, informed by our
              Financial Review Board, a group of subject-matter reviewers who check higher-risk
              topics (tax, retirement, credit, investing fundamentals) before and after
              publication. No single contributor can publish YMYL (&ldquo;your money, your
              life&rdquo;) content without that review step.
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
