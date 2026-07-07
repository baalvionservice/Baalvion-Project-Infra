import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { AboutStory } from '@/components/sections/about-story';
import { AboutLeadership } from '@/components/sections/about-leadership';
import { CtaBand } from '@/components/ui/cta-band';

export const metadata: Metadata = {
  title: 'About Baalvion',
  description:
    'Why Baalvion exists: bringing structure, transparency, and accountability to global trade and procurement — and the team building it.',
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="About Baalvion"
          title="Trade deserves better than spreadsheets and good intentions."
          description="We're building the operating layer that lets buyers, sellers, and trade agents work from one honest version of the truth."
        />
        <AboutStory />

        <section className="border-b border-line py-24">
          <div className="container-site grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">Commitment to innovation</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                We build for how trade is changing, not just how it works today.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-base leading-relaxed text-muted">
                Cross-border trade is getting more complex — more compliance requirements, more
                counterparties, more moving parts. Standing still isn&rsquo;t an option. We invest
                continuously in the workflow itself: sharper automation, clearer reporting, and
                deeper coordination between the roles that make a trade happen, so the platform
                keeps pace with how our customers actually operate.
              </p>
            </Reveal>
          </div>
        </section>

        <AboutLeadership />

        <CtaBand
          eyebrow="Join the platform"
          title="See how Baalvion fits your trade operation."
          description="Sign in if you're already a customer, or reach out to talk through how Baalvion could work for your team."
        />
      </main>
      <SiteFooter />
    </>
  );
}
