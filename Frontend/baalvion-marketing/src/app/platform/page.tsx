import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { HowItWorks } from '@/components/sections/how-it-works';
import { CustomerJourney } from '@/components/sections/customer-journey';
import { PlatformPillars } from '@/components/sections/platform-pillars';
import { PlatformOrgBenefits } from '@/components/sections/platform-org-benefits';
import { CtaBand } from '@/components/ui/cta-band';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'What Baalvion does and how it works: a trade operations platform covering the full procurement lifecycle, built around security, transparency, efficiency, automation, and reporting.',
};

export default function PlatformPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Platform"
          title="One platform for the entire trade lifecycle."
          description="Baalvion replaces the patchwork of email, spreadsheets, and disconnected tools that most procurement teams run on with a single, structured workflow."
        />

        <section className="border-b border-line py-24">
          <div className="container-site max-w-3xl">
            <Reveal>
              <p className="eyebrow">What Baalvion does</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Sourcing, negotiation, fulfillment, and reporting — under one roof.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted">
                Baalvion gives buyers, sellers, and trade agents a shared operating layer for
                procurement and trade. Requirements, quotes, approvals, shipments, and settlement
                all live against the same order record, so nothing has to be re-entered,
                re-explained, or reconciled after the fact. The result is a platform where
                collaboration between roles is the default, not an exception that requires extra
                tools bolted on top.
              </p>
            </Reveal>
          </div>
        </section>

        <HowItWorks />
        <CustomerJourney />
        <PlatformPillars />
        <PlatformOrgBenefits />

        <CtaBand
          eyebrow="See it in action"
          title="Ready to bring your trade operations onto one platform?"
          description="Existing customers can sign in now. If you're evaluating Baalvion, our team is glad to walk through the platform in detail."
        />
      </main>
      <SiteFooter />
    </>
  );
}
