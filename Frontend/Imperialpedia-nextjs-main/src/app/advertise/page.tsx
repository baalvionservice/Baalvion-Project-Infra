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
  const page = await getCmsPage('advertise');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/advertise',
    });
  }
  return buildMetadata({
    title: 'Advertise With Us',
    description:
      'Reach an engaged personal-finance and markets audience on Imperialpedia. Learn about available ad formats and how to get in touch about a placement.',
    canonical: '/advertise',
  });
}

const LAST_UPDATED = 'July 21, 2026';

export default async function AdvertisePage() {
  return <CmsPage slug="advertise" eyebrow="Partner With Us" fallback={<AdvertiseFallback />} />;
}

function AdvertiseFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Handshake className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Partner With Us
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Advertise With {env.appName}
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Who reads {env.appName}
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} covers markets, investing, banking, and personal finance for readers
              actively researching financial decisions — from choosing a brokerage or savings
              account to understanding a market move. Advertising here reaches that intent-driven
              audience alongside our editorial coverage.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Available placements
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We offer standard programmatic display placements through our ad network partners,
              as well as sponsored content clearly labeled per our{' '}
              <Link href="/sponsored-content-policy" className="text-primary hover:underline">
                Sponsored Content Policy
              </Link>
              . Every paid placement is visually distinguished from editorial content, and buying
              advertising never grants influence over coverage, rankings, or reviews — see our{' '}
              <Link href="/advertising-policy" className="text-primary hover:underline">
                Advertising Policy
              </Link>{' '}
              for the full standards.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Get in touch
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              To discuss a placement, reach out at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              , with a short note about your business and the kind of placement you have in mind.
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
