import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Bot } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('ai-usage-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/ai-usage-policy',
    });
  }
  return buildMetadata({
    title: 'AI Usage Policy',
    description:
      'How Imperialpedia uses AI for research and drafting support, why every AI-assisted piece is human-reviewed before publish, and how to flag a concern.',
    canonical: '/ai-usage-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function AiUsagePolicyPage() {
  return <CmsPage slug="ai-usage-policy" eyebrow="AI Transparency" fallback={<AiUsagePolicyFallback />} />;
}

function AiUsagePolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              AI Transparency
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            AI Usage Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Where AI tools are used
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} uses AI tools to assist with research aggregation and drafting support —
              summarizing lengthy source material, surfacing related data points, and helping
              structure a first draft. These tools synthesize public data to help our editorial
              team explore a topic, not to replace primary sources.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Human review before publish
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              No AI-assisted article is published without a human editor reviewing it in full: every
              claim checked against a source, every number verified, and the tone edited to match
              our house style. AI drafting is a starting point for our writers and editors, not a
              final product.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. What AI is never used for
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We do not use AI to fabricate quotes, invent statistics, or manufacture sources.
              Anything an AI tool produces that cannot be traced back to a real, checkable source is
              removed during review — it does not make it into a published article.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Reporting a concern
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you believe an article contains an AI-generated error, an unverifiable claim, or
              output that reads as fabricated, tell us at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or via{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>
              . We treat these reports the same way we treat any other{' '}
              <Link href="/corrections" className="text-primary hover:underline">
                correction request
              </Link>
              .
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
