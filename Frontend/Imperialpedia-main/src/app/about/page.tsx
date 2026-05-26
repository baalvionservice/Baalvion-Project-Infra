import React from 'react';
import { buildMetadata } from '@/lib/seo';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, BookOpen, Sparkles } from 'lucide-react';

export const metadata = buildMetadata({
  title: 'About Us',
  description:
    'Imperialpedia explains who we are: a financial education and research platform covering markets, tools, and AI-assisted analysis.',
  canonical: '/about',
  noIndex: false,
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-14 space-y-4">
          <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase text-primary">
            About Imperialpedia
          </Text>
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Clear financial knowledge, built for everyone
          </Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
            Imperialpedia exists to make markets, money, and economic ideas easier to understand. We publish
            explainers, guides, comparisons, and tools so you can learn at your own pace — whether you are
            new to investing or deepening professional research.
          </Text>
        </header>

        <Section spacing="lg" className="space-y-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/40 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Target className="h-5 w-5" aria-hidden />
              </div>
              <Text variant="h3" className="text-lg font-bold">
                Our purpose
              </Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                We connect readers with trustworthy, organized information on investing, personal finance,
                and the wider economy — with transparent sourcing and a focus on education, not hype.
              </Text>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/40 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" aria-hidden />
              </div>
              <Text variant="h3" className="text-lg font-bold">
                What you will find here
              </Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                Articles and structured pages on stocks, funds, real estate, credit, taxes, and more — plus
                calculators and AI-assisted features designed to summarize and explore topics responsibly.
              </Text>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/40 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <Text variant="h3" className="text-lg font-bold">
                Editorial approach
              </Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                Content is written for learning and general information. It is not personalized investment,
                legal, or tax advice. Always confirm important decisions with a qualified professional.
              </Text>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-10 space-y-4">
            <Text variant="h3" className="text-xl font-bold">
              Not investment advice
            </Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
              Markets involve risk. Past performance does not guarantee future results. Imperialpedia does
              not recommend specific securities for your situation. Use our materials to build context, then
              consult advisors where appropriate.
            </Text>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="rounded-xl font-bold">
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-bold">
                <Link href="/privacy-policy">Privacy Policy</Link>
              </Button>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  );
}
