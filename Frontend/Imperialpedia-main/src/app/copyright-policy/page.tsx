import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Copyright } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('copyright-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/copyright-policy',
    });
  }
  return buildMetadata({
    title: 'Copyright Policy',
    description:
      'Imperialpedia owns the original text, graphics, and data visualizations it publishes. Here is what use is permitted, what is not, and how to request permission.',
    canonical: '/copyright-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function CopyrightPolicyPage() {
  return <CmsPage slug="copyright-policy" eyebrow="Copyright" fallback={<CopyrightPolicyFallback />} />;
}

function CopyrightPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Copyright className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Copyright
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Copyright Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. What this policy covers
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              This Copyright Policy is separate from our{' '}
              <Link href="/dmca-policy" className="text-primary hover:underline">
                DMCA Policy
              </Link>
              , which covers takedown requests. This page explains ownership of and permitted use
              for the original material we publish.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Ownership
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Original articles, glossary entries, illustrations, charts, and data visualizations
              published on {env.appName} are owned by {env.appName} or its licensors, and are
              protected by copyright law. Third-party market data displayed on the site remains the
              property of its respective providers and is used under license or fair-use terms
              applicable to that data.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Permitted use
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              You are welcome to quote brief excerpts of our content for commentary, criticism, or
              educational purposes, provided you attribute the source and link directly back to the
              original {env.appName} page.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Prohibited use
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              You may not scrape, systematically copy, or mass-republish our articles, glossary
              content, or visualizations elsewhere, and you may not remove or obscure attribution
              when quoting our work. Automated scraping of the site for the purpose of republishing
              or retraining a competing product is not permitted.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Requesting permission
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              For uses beyond brief, attributed quotation — republishing a full article, licensing a
              chart, or any commercial use — contact us at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>{' '}
              before proceeding.
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
