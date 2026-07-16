import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Eye } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('sponsored-content-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/sponsored-content-policy',
    });
  }
  return buildMetadata({
    title: 'Sponsored Content Policy',
    description:
      'How Imperialpedia labels sponsored and partner content, why it still meets the same fact-checking bar as editorial articles, and who approves it.',
    canonical: '/sponsored-content-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function SponsoredContentPolicyPage() {
  return (
    <CmsPage
      slug="sponsored-content-policy"
      eyebrow="Sponsored Content"
      fallback={<SponsoredContentPolicyFallback />}
    />
  );
}

function SponsoredContentPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Eye className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Sponsored Content
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Sponsored Content Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Clear labeling
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Any piece on {env.appName} that a company or partner has paid to have published is
              clearly labeled as such — for example &ldquo;Sponsored&rdquo; or &ldquo;Partner
              Content&rdquo; — both in any listing that links to it and at the top of the piece
              itself. We do not present paid content as if it were independent editorial coverage.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Same fact-checking bar as editorial content
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Labeling a piece as sponsored does not lower the standard it is held to. Sponsored
              content still passes through the same{' '}
              <Link href="/fact-checking" className="text-primary hover:underline">
                Fact-Checking Policy
              </Link>{' '}
              applied to editorial articles: claims must be sourced, figures must be accurate, and
              nothing misleading about a product's risks or performance is permitted.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Editorial retains final approval
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              A sponsor can propose a topic and provide input on a draft, but the editorial team
              retains final approval over what is published, including the right to decline or
              request changes to a piece that does not meet our standards.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Questions about this policy
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
