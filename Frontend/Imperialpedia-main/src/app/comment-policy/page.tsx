import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Users } from 'lucide-react';
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
  const page = await getCmsPage('comment-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/comment-policy',
    });
  }
  return buildMetadata({
    title: 'Comment & Community Policy',
    description:
      'The rules for comments, debates, and community discussion on Imperialpedia: no harassment, no spam, no guaranteed-return advice, and how moderation works.',
    canonical: '/comment-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function CommentPolicyPage() {
  return <CmsPage slug="comment-policy" eyebrow="Community Guidelines" fallback={<CommentPolicyFallback />} />;
}

function CommentPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Community Guidelines
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Comment & Community Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Where this applies
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              This policy covers article comments and discussion features across{' '}
              {env.appName}. It applies to every registered user who participates in a public
              discussion on the site.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Rules for participation
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Keep it respectful and on-topic. We remove content that harasses or targets another
              person, spam or repetitive self-promotion, impersonation of another user or of
              {' '}{env.appName} staff, and financial advice presented as a guaranteed outcome (for
              example, promising a specific return on an investment). Disagreement and debate about
              ideas is welcome; personal attacks are not.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Moderation
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Comments and posts that violate these rules may be removed, and accounts with repeated
              violations may be restricted or suspended. Moderation decisions follow the same
              editorial independence described in our{' '}
              <Link href="/ethics-policy" className="text-primary hover:underline">
                Ethics Policy
              </Link>
              — no advertiser or sponsor has any say in how community content is moderated.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Reporting abusive content
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you see a comment or post that violates this policy, report it through the
              in-product reporting option where available, or email{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              with a link to the content. See{' '}
              <Link href="/contact" className="text-primary hover:underline">
                our contact page
              </Link>{' '}
              for other ways to reach us.
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
