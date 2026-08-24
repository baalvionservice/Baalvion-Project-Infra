import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Accessibility } from 'lucide-react';
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
  const page = await getCmsPage('accessibility');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/accessibility',
    });
  }
  return buildMetadata({
    title: 'Accessibility Statement',
    description:
      'Imperialpedia is committed to WCAG 2.2 AA accessibility. Read our ongoing improvement process and how to report a barrier you encounter on the site.',
    canonical: '/accessibility',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function AccessibilityPage() {
  return <CmsPage slug="accessibility" eyebrow="Accessibility" fallback={<AccessibilityFallback />} />;
}

function AccessibilityFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Accessibility className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Accessibility
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Accessibility Statement
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Our commitment
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} is committed to making its content and tools usable by as many people
              as possible, including people who use assistive technology. We aim to conform to the
              Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA across our core pages —
              articles, guides, calculators, and navigation.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. An ongoing process
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Accessibility is not a one-time project for us. As we ship new features — calculators,
              interactive charts, community tools — we review them against WCAG 2.2 AA criteria such
              as keyboard navigation, color contrast, and screen-reader labeling, and we prioritize
              fixes when gaps are found.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Known limitations
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Some third-party embedded content, such as live market data widgets, may not fully
              conform to WCAG 2.2 AA yet, since we depend on how those components were built by
              their providers. We track these cases and push for fixes or replacements where a
              gap materially affects usability.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Reporting a barrier
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you encounter a page, tool, or feature on {env.appName} that is difficult to use
              with assistive technology, tell us at{' '}
              <a href={`mailto:${env.supportEmail}`} className="text-primary hover:underline">
                {env.supportEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              . Please include the page URL and, if possible, the assistive technology and browser
              you were using — it helps us reproduce and fix the issue faster.
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
