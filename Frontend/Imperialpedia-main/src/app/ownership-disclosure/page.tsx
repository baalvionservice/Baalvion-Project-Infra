import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Scale } from 'lucide-react';
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
  const page = await getCmsPage('ownership-disclosure');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/ownership-disclosure',
    });
  }
  return buildMetadata({
    title: 'Ownership Disclosure',
    description:
      'Who legally operates Imperialpedia and is responsible for the content published on this site, disclosed here for transparency and accountability.',
    canonical: '/ownership-disclosure',
  });
}

const LAST_UPDATED = 'August 17, 2026';

export default async function OwnershipDisclosurePage() {
  return (
    <CmsPage slug="ownership-disclosure" eyebrow="Ownership & Accountability" fallback={<OwnershipDisclosureFallback />} />
  );
}

function OwnershipDisclosureFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Ownership & Accountability
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Ownership Disclosure
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Who operates {env.appName}
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} is operated by{' '}
              <strong className="text-foreground">Baalvion Industries Private Limited</strong>,
              part of the Baalvion Group. This is the legal entity responsible for the content
              published on this site and for its compliance with applicable law.
            </Text>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-foreground">Operating office:</strong> Yeshwant Avenue
                Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India
              </li>
              <li>
                <strong className="text-foreground">Registered office:</strong> C/o Dilip Kumar
                Kuldeep, Upper Mania, Po- Pakjhola, Semiliguda, Koraput, Odisha 764036, India (CIN:
                U43121OD2025PTC048479)
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Why we publish this
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Readers of a financial education site are entitled to know who is legally responsible
              for what they are reading. This page exists so that information is easy to find,
              rather than buried in fine print — it is a standard part of publishing transparency
              for sites that cover topics affecting people's money.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. No undisclosed ownership influence
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We do not have an undisclosed outside ownership stake, investor, or business
              relationship that shapes which topics we cover or how we cover them. Where a
              commercial relationship does affect a specific piece of content — advertising,
              affiliate links, or sponsorship — it is disclosed on the relevant page, not folded
              into ownership structure.
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
