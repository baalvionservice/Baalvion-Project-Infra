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

// Managed in the CMS (admin-platform). ISR instead of force-dynamic: content here
// changes on the order of months, not requests, and the on-publish webhook
// (/api/revalidate, called by cms-service after publish/update/delete) already
// revalidates this route instantly — force-dynamic was paying for a fresh CMS
// fetch + full re-render on every single request, including every bot/crawler
// hit, for a page that's correct 99.9% of the time without one.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('dmca-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/dmca-policy',
    });
  }
  return buildMetadata({
    title: 'DMCA Policy',
    description:
      'How Imperialpedia handles DMCA notice-and-takedown requests under 17 U.S.C. § 512, what a valid notice must contain, and how to file a counter-notification.',
    canonical: '/dmca-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function DmcaPolicyPage() {
  return <CmsPage slug="dmca-policy" eyebrow="Copyright Takedowns" fallback={<DmcaPolicyFallback />} />;
}

function DmcaPolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Copyright className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Copyright Takedowns
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            DMCA Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Notice-and-takedown procedure
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} responds to notices of alleged copyright infringement that comply with
              the Digital Millennium Copyright Act, 17 U.S.C. § 512. If you believe content on this
              site infringes a copyright you own or control, you may submit a takedown notice to our
              designated agent below.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. What a valid notice must include
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              A valid notice must include: a physical or electronic signature of the copyright
              owner or someone authorized to act on their behalf; identification of the copyrighted
              work claimed to have been infringed; identification of the material you claim is
              infringing, with enough detail (e.g. a URL) for us to locate it; your contact
              information (address, phone number, email); a statement that you have a good-faith
              belief the use is not authorized by the copyright owner, its agent, or the law; and a
              statement, under penalty of perjury, that the information in the notice is accurate
              and that you are authorized to act on the copyright owner's behalf.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Designated DMCA agent
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Our designated agent for DMCA notices is{' '}
              <strong>[PLACEHOLDER: DMCA agent name and email/address]</strong>. Notices sent
              elsewhere may not be processed as quickly.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Counter-notification
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you believe material was removed or disabled by mistake or misidentification, you
              may submit a counter-notification to the same agent, including your contact
              information, identification of the removed material and its former location, a
              statement under penalty of perjury that you have a good-faith belief the removal was a
              mistake, and a statement consenting to the jurisdiction of the applicable federal
              district court.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Repeat infringers
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Accounts or contributors responsible for repeat, verified instances of infringement
              may be banned from further contribution to the site.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              6. Questions about this policy
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              General questions (not takedown notices) can go to{' '}
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
