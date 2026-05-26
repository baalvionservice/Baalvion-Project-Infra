import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { env } from '@/config/env';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How Imperialpedia collects, uses, and protects information when you use our website and services.',
  canonical: '/privacy-policy',
});

const LAST_UPDATED = 'April 8, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Legal
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Privacy Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </Text>
          <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
            This policy describes how {env.appName} (“we”, “us”) handles personal information when you visit{' '}
            <Link href="/" className="text-primary hover:underline">
              our website
            </Link>{' '}
            and related services. By using the site, you agree to this policy.
          </Text>
        </header>

        <Section spacing="sm" className="prose prose-invert max-w-none space-y-12">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              1. Information we collect
            </Text>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-foreground">Information you provide</strong>, such as when you join
                a waitlist, subscribe to updates, contact us, or create an account (for example, name and
                email address, and the content of your messages).
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong>, such as pages viewed, approximate
                location based on IP, browser type, device type, and timestamps. This helps us run and
                improve the site.
              </li>
              <li>
                <strong className="text-foreground">Cookies and similar technologies</strong>, as described
                below.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              2. How we use information
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We use personal information to provide and improve {env.appName}, respond to inquiries,
              send transactional or service-related emails where appropriate, protect security, comply with
              law, and understand aggregate usage. We do not sell your personal information.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              3. Cookies, analytics, and advertising
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We may use cookies and similar technologies for site functionality, to remember preferences,
              and to measure traffic. We may also use third-party analytics (for example, Google Analytics)
              and advertising partners (for example, Google AdSense) that set their own cookies and process
              data according to their policies. Where required, we will request your consent before
              non-essential cookies are used. You can control cookies through your browser settings and any
              cookie banner we display.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              4. Sharing of information
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We may share information with service providers who process it on our behalf (for example,
              hosting or email delivery), when required by law, or to protect rights and safety. Providers
              are contractually expected to use data only for the services they provide to us. If we are
              involved in a merger or acquisition, information may be transferred as part of that
              transaction, subject to appropriate safeguards.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              5. Data retention and security
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We retain information only as long as needed for the purposes above or as required by law. We
              use reasonable technical and organizational measures to protect data, but no method of
              transmission over the Internet is completely secure.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              6. Your choices and rights
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Depending on where you live, you may have rights to access, correct, delete, or export certain
              personal information, or to object to or restrict certain processing. Residents of the EEA,
              UK, or California may have additional rights under GDPR or CCPA/CPRA. To exercise these rights,
              contact us at{' '}
              <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                {env.contactEmail}
              </a>
              . You may also unsubscribe from marketing emails using the link in those emails.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              7. Children
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Our services are not directed to children under 13 (or the minimum age in your jurisdiction).
              We do not knowingly collect personal information from children. If you believe we have, please
              contact us so we can delete it.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              8. International users
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              If you access the site from outside the country where we operate, your information may be
              processed in countries that may have different data protection laws. We use appropriate
              safeguards where required.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              9. Changes to this policy
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will post the revised version on this
              page and update the “Last updated” date. For material changes, we may provide additional notice
              as required by law.
            </Text>
          </div>

          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              10. Contact us
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed">
              Questions about this policy:{' '}
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
