import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Mail, Globe, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ContactForm from '@/components/common/ContactForm';
import { env } from '@/config/env';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'Contact Imperialpedia for general inquiries, support, or expert onboarding. Send a message or reach us by email.',
  canonical: '/contact',
  noIndex: false,
});

export default function ContactPage() {
  const mailtoGeneral = `mailto:${env.contactEmail}?subject=${encodeURIComponent('Imperialpedia inquiry')}`;
  const mailtoSupport = `mailto:${env.supportEmail}`;
  const mailtoExperts = `mailto:${env.expertsEmail}`;

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-16 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Mail className="h-4 w-4" aria-hidden />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">
              Contact
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">
            Get in touch
          </Text>
          <Text variant="body" className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Questions about the site, partnerships, or account support — use the form below or email us
            directly.
          </Text>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="glass-card bg-primary/5 border-primary/20 p-8 hover:border-primary/40 transition-all group">
            <CardContent className="p-0 space-y-6">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
                <Globe className="h-8 w-8" aria-hidden />
              </div>
              <div className="space-y-2">
                <Text variant="h3" className="text-2xl font-bold">
                  General &amp; support
                </Text>
                <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                  Site issues, press, and general questions.
                </Text>
              </div>
              <Link
                href={mailtoSupport}
                className="font-mono text-primary font-bold hover:underline break-all"
              >
                {env.supportEmail}
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card bg-secondary/5 border-secondary/20 p-8 hover:border-secondary/40 transition-all group">
            <CardContent className="p-0 space-y-6">
              <div className="p-4 rounded-2xl bg-secondary/10 text-secondary w-fit group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8" aria-hidden />
              </div>
              <div className="space-y-2">
                <Text variant="h3" className="text-2xl font-bold">
                  Creators &amp; experts
                </Text>
                <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                  Verification, contributor programs, and expert onboarding.
                </Text>
              </div>
              <Link
                href={mailtoExperts}
                className="font-mono text-secondary font-bold hover:underline break-all"
              >
                {env.expertsEmail}
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card p-8 md:p-10 border-white/5 bg-card/30 mb-10">
          <Text variant="h3" className="text-xl font-bold mb-6">
            Send a message
          </Text>
          <ContactForm />
          <Text variant="caption" className="text-muted-foreground mt-8 block">
            Prefer email without the form? Write to{' '}
            <Link href={mailtoGeneral} className="text-primary hover:underline font-medium">
              {env.contactEmail}
            </Link>
            .
          </Text>
        </Card>
      </Container>
    </main>
  );
}
