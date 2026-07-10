import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/sections/hero';
import { Company } from '@/components/sections/company';
import { Scale } from '@/components/sections/scale';
import { Domains } from '@/components/sections/domains';
import { Principles } from '@/components/sections/principles';
import { Presence } from '@/components/sections/presence';
import { Network } from '@/components/sections/network';
import { Insight } from '@/components/sections/insight';
import { Audiences } from '@/components/sections/audiences';
import { Closing } from '@/components/sections/closing';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Company />
        <Scale />
        <Domains />
        <Principles />
        <Presence />
        <Network />
        <Insight />
        <Audiences />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
