import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Cookie } from 'lucide-react';
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
  const page = await getCmsPage('cookie-policy');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/cookie-policy',
    });
  }
  return buildMetadata({
    title: 'Cookie Policy',
    description:
      'The categories of cookies Imperialpedia uses — essential, analytics, and advertising including Google AdSense — and how to control them in your browser.',
    canonical: '/cookie-policy',
  });
}

const LAST_UPDATED = 'July 5, 2026';

export default async function CookiePolicyPage() {
  return <CmsPage slug="cookie-policy" eyebrow="Privacy & Cookies" fallback={<CookiePolicyFallback />} />;
}

function CookiePolicyFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Cookie className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Privacy & Cookies
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Cookie Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Categories of cookies we use
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} uses three broad categories of cookies: strictly necessary cookies
              (session handling, security, remembering your cookie preferences), analytics cookies
              (understanding which pages and tools are useful, in aggregate), and advertising
              cookies used by third-party networks such as Google AdSense and Google Analytics to
              serve and measure ads. Strictly necessary cookies cannot be switched off, since the
              site would not function correctly without them.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. Cookie consent
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Where required by applicable law, a cookie consent notice is shown when you first
              visit, letting you accept or manage non-essential cookie categories before they are
              set. You can change your choice at any time through that same consent mechanism or
              through your browser settings.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Controlling cookies in your browser
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Every major browser lets you view, block, or delete cookies through its settings.
              Blocking analytics and advertising cookies will not stop the site from working, but it
              may make ads less relevant and will limit the anonymized usage data we can see about
              how the site is used.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Related reading
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              For how we handle personal data more broadly, see our{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . Questions about this cookie policy can be sent to{' '}
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
