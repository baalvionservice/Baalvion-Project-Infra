import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/sections/hero';
import { PlatformOverview } from '@/components/sections/platform-overview';
import { KeyBenefits } from '@/components/sections/key-benefits';
import { HowItWorks } from '@/components/sections/how-it-works';
import { WhyBaalvion } from '@/components/sections/why-baalvion';
import { CustomerJourney } from '@/components/sections/customer-journey';
import { Testimonials } from '@/components/sections/testimonials';
import { Stats } from '@/components/sections/stats';
import { HomeFaq } from '@/components/sections/home-faq';
import { CtaBand } from '@/components/ui/cta-band';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <PlatformOverview />
        <KeyBenefits />
        <HowItWorks />
        <WhyBaalvion />
        <CustomerJourney />
        <Testimonials />
        <Stats />
        <HomeFaq />
        <CtaBand
          title="Already a Baalvion customer?"
          description="Sign in to the Trade Portal to pick up exactly where you left off — or talk to our team if you're evaluating Baalvion for your organization."
        />
      </main>
      <SiteFooter />
    </>
  );
}
