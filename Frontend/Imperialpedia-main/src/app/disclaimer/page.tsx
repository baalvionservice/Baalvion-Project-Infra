import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { env } from '@/config/env';
import { CmsPage } from '@/components/pages/CmsPage';
import { getCmsPage } from '@/services/data/cms-public';

// Managed in the CMS (admin-platform); read live per request with a static fallback.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('disclaimer');
  if (page) {
    return buildMetadata({
      title: page.seoTitle,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      canonical: '/disclaimer',
    });
  }
  return buildMetadata({
    title: 'Disclaimer',
    description:
      'Imperialpedia provides financial information and analysis for educational purposes only. It is not financial, investment, or tax advice.',
    canonical: '/disclaimer',
  });
}

const LAST_UPDATED = 'June 30, 2026';

export default async function DisclaimerPage() {
  return <CmsPage slug="disclaimer" eyebrow="Legal" fallback={<DisclaimerFallback />} />;
}

function DisclaimerFallback() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Legal
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Disclaimer
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
        </header>

        {/* Primary YMYL notice — the single most important block for a finance site */}
        <div className="mb-14 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 p-6 flex items-start gap-4">
          <AlertTriangle className="h-7 w-7 text-amber-500 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-2">
            <Text variant="h3" className="text-lg font-bold">
              Not Financial Advice
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              All content published on {env.appName} is provided for general informational and
              educational purposes only. Nothing on this website constitutes financial, investment,
              tax, legal, or accounting advice, or a recommendation to buy, sell, or hold any security
              or financial product. Always consult a licensed financial advisor before making any
              investment decision.
            </Text>
          </div>
        </div>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Informational purpose only
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              The articles, analysis, market data, glossary entries, calculators, and AI-generated
              insights on {env.appName} are intended to inform and educate. They are not tailored to
              your personal financial situation, objectives, or risk tolerance, and should not be
              relied upon as the basis for any financial decision.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. No investment recommendations
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              References to specific securities, asset classes, strategies, brokers, or products are for
              illustration only and do not constitute an offer, solicitation, or recommendation. Past
              performance is not indicative of future results. All investments carry risk, including the
              possible loss of principal.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Accuracy and market data
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              While we strive for accuracy in line with our{' '}
              <Link href="/transparency" className="text-primary hover:underline">
                editorial and transparency standards
              </Link>
              , we make no warranty as to the completeness, timeliness, or accuracy of any information.
              Market data may be delayed and is provided &ldquo;as is.&rdquo; Verify any figure with a
              primary source before acting on it.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. AI-generated content
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Some summaries and insights are produced or assisted by automated tools. AI output may
              contain errors or omissions and is not reviewed for suitability to your circumstances.
              Treat it as a starting point for your own research, not as professional advice.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Third-party links and advertising
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              This site contains links to third-party websites and displays advertising, including ads
              served by third-party networks such as Google AdSense. We do not control and are not
              responsible for third-party content, products, or services, and the presence of an ad or
              link is not an endorsement. See our{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              for how advertising cookies are used. Where we have an affiliate relationship, it does not
              influence our editorial coverage.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              6. Limitation of liability
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, {env.appName} and its team shall not be liable for
              any loss or damage arising from your use of, or reliance on, any information on this site.
              Your use of the site is governed by our{' '}
              <Link href="/terms-of-service" className="text-primary hover:underline">
                Terms of Service
              </Link>
              .
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              7. Contact
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Questions about this disclaimer:{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or{' '}
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
