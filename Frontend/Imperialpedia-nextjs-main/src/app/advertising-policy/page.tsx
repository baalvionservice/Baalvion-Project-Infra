import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Megaphone } from 'lucide-react';
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
  const page = await getCmsPage('advertising-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/advertising-policy',
    });
  }
  return buildMetadata({
    title: 'Advertising Policy',
    description:
      'How ads are served on Imperialpedia, what categories of advertiser are never allowed on the site, and why advertisers cannot influence editorial coverage.',
    canonical: '/advertising-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function AdvertisingPolicyPage() {
  return <CmsPage slug="advertising-policy" eyebrow="Advertising Standards" fallback={<AdvertisingPolicyFallback />} />;
}

function AdvertisingPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Advertising Standards
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Advertising Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. How ads are served
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} carries advertising served through third-party ad networks, including
              Google AdSense. These placements are visually distinguished from editorial content —
              typically labeled or set apart by layout — so a reader can always tell what is an
              article and what is a paid placement.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Prohibited ad categories
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We do not knowingly permit advertising for: adult content, weapons, illegal drugs,
              scams or get-rich-quick schemes, malware or deceptive software, counterfeit goods,
              hate speech, or misleading financial products (including guaranteed-return investment
              pitches). Where an ad network serves a placement that violates this list, we work to
              have it blocked at the network level as soon as it is identified.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Advertisers do not influence coverage
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Buying advertising on {env.appName} does not grant any influence over editorial
              content, rankings, or reviews. Our editorial and advertising functions are kept
              separate, consistent with our{' '}
              <Link href="/ethics-policy" className="text-primary hover:underline">
                Ethics Policy
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Reporting an ad
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you see an ad that appears to violate this policy, report it to{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              , including the page it appeared on if possible.
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
