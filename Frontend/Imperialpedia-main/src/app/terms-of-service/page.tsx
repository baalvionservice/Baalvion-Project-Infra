import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { env } from '@/config/env';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'Terms governing your use of Imperialpedia’s website, content, and features. Please read before using our services.',
  canonical: '/terms-of-service',
});

const LAST_UPDATED = 'April 8, 2026';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <Scale className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Legal
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Terms of Service
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
          <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
            These Terms of Service (“Terms”) govern your access to and use of {env.appName}’s website and
            online services (collectively, the “Services”). By using the Services, you agree to these Terms. If
            you do not agree, please do not use the Services.
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Who may use the Services
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              You must be able to form a binding contract in your jurisdiction. If you use the Services on
              behalf of an organization, you represent that you have authority to bind that organization to
              these Terms.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. What we provide
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              {env.appName} offers financial education, articles, tools, and related features (including
              AI-assisted summaries or analysis where available). Content is for general information only.
              Features and availability may change. We may suspend or discontinue any part of the Services
              with reasonable notice where practicable.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Not professional advice
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Nothing on the Services is investment, legal, tax, or accounting advice. Financial products and
              regulations vary by region. You are solely responsible for decisions you make after using our
              materials. Consult qualified professionals for advice tailored to your situation.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Accounts and security
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you create an account, you must provide accurate information and keep your credentials
              confidential. Notify us promptly at{' '}
              <a href={`mailto:${env.supportEmail}`} className="text-primary hover:underline">
                {env.supportEmail}
              </a>{' '}
              if you suspect unauthorized access.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Acceptable use
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              You agree not to misuse the Services — for example, by attempting to probe, scan, or test
              vulnerabilities without authorization; by scraping or harvesting data at scale in violation of
              our policies or applicable law; by interfering with other users; by uploading malware; by
              impersonating others; or by using the Services for unlawful, harassing, or fraudulent purposes.
              We may suspend or terminate access for conduct we reasonably believe violates these Terms or
              puts the Services or users at risk.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              6. Intellectual property
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              The Services, the {env.appName} name and branding, and our original content are protected by
              intellectual property laws. You receive a limited, non-exclusive, non-transferable license to
              access and use the Services for personal, non-commercial purposes unless we agree otherwise in
              writing. You may not copy, modify, distribute, or create derivative works from our content
              except as allowed by law or with our permission. User-submitted content remains yours, but you
              grant us a license to host, display, and use it as needed to operate the Services.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              7. Third-party links and services
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              The Services may link to third-party websites or integrate third-party tools. We are not
              responsible for their content, terms, or privacy practices. Your use of third-party services is
              at your own risk.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              8. Disclaimers
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW,
              WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. AI-GENERATED OUTPUT MAY BE INACCURATE
              OR INCOMPLETE — VERIFY IMPORTANT INFORMATION INDEPENDENTLY.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              9. Limitation of liability
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER {env.appName} NOR ITS AFFILIATES, OFFICERS,
              DIRECTORS, EMPLOYEES, OR SUPPLIERS WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING
              FROM YOUR USE OF THE SERVICES. OUR AGGREGATE LIABILITY FOR ANY CLAIM RELATING TO THE SERVICES
              SHALL NOT EXCEED THE GREATER OF USD $100 OR THE AMOUNTS YOU PAID US FOR THE SERVICES GIVING
              RISE TO THE CLAIM IN THE TWELVE MONTHS BEFORE THE CLAIM (IF ANY).
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              10. Indemnity
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              To the extent permitted by law, you will defend and indemnify us against claims arising from
              your misuse of the Services, your content, or your violation of these Terms or applicable law.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              11. Governing law and disputes
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of the jurisdiction where {env.appName} operates, without
              regard to conflict-of-law rules. Courts in that jurisdiction have exclusive venue, except
              where mandatory consumer protection laws require otherwise. If any provision is unenforceable,
              the remaining provisions remain in effect.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              12. Changes
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We may modify these Terms by posting an updated version on this page and updating the “Last
              updated” date. Continued use after changes constitutes acceptance of the revised Terms where
              allowed by law. For material changes, we may provide additional notice.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              13. Contact
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Questions about these Terms:{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>{' '}
              or{' '}
              <Link href="/contact" className="text-primary hover:underline">
                /contact
              </Link>
              . For privacy matters, see our{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </Text>
          </div>
        </Section>
      </Container>
    </main>
  );
}
