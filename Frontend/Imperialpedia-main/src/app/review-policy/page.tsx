import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { ClipboardCheck } from 'lucide-react';
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
  const page = await getCmsPage('review-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/review-policy',
    });
  }
  return buildMetadata({
    title: 'Review Policy',
    description:
      'How Imperialpedia researches, scores, and rates financial products across brokers, banks, credit cards, insurance, and loans — and how advertiser independence is maintained.',
    canonical: '/review-policy',
  });
}

const LAST_UPDATED = 'July 21, 2026';

export default async function ReviewPolicyPage() {
  return <CmsPage slug="review-policy" eyebrow="Review Standards" fallback={<ReviewPolicyFallback />} />;
}

function ReviewPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Review Standards
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Review Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. What we review
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Our{' '}
              <Link href="/reviews" className="text-primary hover:underline">
                Reviews
              </Link>{' '}
              hub covers brokers, banks, credit cards, insurance, loans, robo-advisors, and other
              financial products and apps. Each review category has its own scoring criteria —
              relevant fees and rates, account features, customer support, and platform quality —
              disclosed in that review's own methodology section.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. How we score and rate
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Providers are scored against the same criteria within a category so results are
              comparable, using publicly available rate sheets, fee schedules, and disclosures
              from the provider itself. Every review names the person who conducted the evaluation
              and, where applicable, the person who fact-checked it, along with the date it was
              last updated.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Advertiser independence
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Some reviews contain affiliate links, disclosed per our{' '}
              <Link href="/affiliate-disclosure" className="text-primary hover:underline">
                Affiliate Disclosure
              </Link>
              . Whether a provider advertises with {env.appName} or pays an affiliate commission
              never affects its score, ranking, or inclusion in a review — see our{' '}
              <Link href="/advertising-policy" className="text-primary hover:underline">
                Advertising Policy
              </Link>{' '}
              and{' '}
              <Link href="/ethics-policy" className="text-primary hover:underline">
                Ethics Policy
              </Link>{' '}
              for how that separation is enforced.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Keeping reviews current
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Rates, fees, and product features change, so reviews are periodically re-checked
              against the provider's current terms and updated when something material changes.
              For the broader standards behind how claims are verified, see our{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Questions or a correction
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If something in a review looks out of date or incorrect, see our{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                Corrections Policy
              </Link>{' '}
              for how to report it, or reach us at{' '}
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
