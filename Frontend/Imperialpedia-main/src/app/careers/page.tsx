import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
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
  const page = await getCmsPage('careers');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/careers',
    });
  }
  return buildMetadata({
    title: 'Careers',
    description:
      'Imperialpedia periodically hires for editorial, research, and engineering roles. See what our team values and how to apply for open positions.',
    canonical: '/careers',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function CareersPage() {
  return <CmsPage slug="careers" eyebrow="Careers" fallback={<CareersFallback />} />;
}

function CareersFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Careers
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Careers at {env.appName}
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. We hire periodically, not constantly
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} periodically opens roles across editorial, research, and engineering as
              the platform grows — writers and reviewers who can turn complex financial topics into
              clear explainers, researchers who can dig into primary sources, and engineers who can
              build the tools and infrastructure behind the site. We do not keep a constantly open
              pipeline, so open roles are posted here as they come up.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. What we value
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              The same values that shape our{' '}
              <Link href="/about" className="text-primary hover:underline">
                editorial mission
              </Link>{' '}
              shape how we hire: clarity over jargon, accuracy over speed, and originality over
              recycled takes. Whether the role is writing, reviewing, or building software, we look
              for people who care about getting the underlying facts right.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. How to apply
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              To apply or ask about upcoming openings, reach out to{' '}
              <a href="mailto:careers@baalvion.com" className="text-primary hover:underline font-semibold">
                careers@baalvion.com
              </a>{' '}
              or{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline font-semibold">
                {env.contactEmail}
              </a>
              . Include a short note about the kind of role you are interested in and, where relevant,
              writing samples or links to past work.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. General questions
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              For anything not related to a specific application, reach the team at{' '}
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
