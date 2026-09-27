import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Handshake } from 'lucide-react';
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
  const page = await getCmsPage('affiliate-disclosure');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/affiliate-disclosure',
    });
  }
  return buildMetadata({
    title: 'Affiliate Disclosure',
    description:
      'Some links on Imperialpedia to brokers, apps, or cards are affiliate links that may earn us compensation. Here is how that works and why it never sways our rankings.',
    canonical: '/affiliate-disclosure',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function AffiliateDisclosurePage() {
  return (
    <CmsPage slug="affiliate-disclosure" eyebrow="Advertising Disclosure" fallback={<AffiliateDisclosureFallback />} />
  );
}

function AffiliateDisclosureFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Handshake className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Advertising Disclosure
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Affiliate Disclosure
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. What an affiliate link is
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Some outbound links on {env.appName} — for example, in broker reviews, app comparisons,
              or credit card guides — are affiliate links. If you click one and go on to sign up for
              or purchase the product, we may earn a commission from the company involved, at no
              extra cost to you.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Plain disclosure
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              In line with FTC guidance on endorsements and testimonials, we disclose this
              relationship here and, where relevant, directly within the articles that contain
              affiliate links. If a page compares or reviews financial products, assume some links
              on it may be compensated, even if not restated on every page.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. This never influences our rankings
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Whether a product earns us a commission has no bearing on how it is ranked, reviewed,
              or described. A product we do not have any commercial relationship with can be, and
              often is, ranked above one that does pay a commission, because our comparisons are
              built from the same editorial process described in our{' '}
              <Link href="/ethics-policy" className="text-primary hover:underline">
                Ethics Policy
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions about this disclosure
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
