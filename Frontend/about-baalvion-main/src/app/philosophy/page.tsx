import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { SubPageHero } from '@/components/sub-page-hero';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema } from '@/lib/schema';

const TITLE = 'Philosophy | Baalvion Industries';
const DESCRIPTION =
  'Infrastructure is a promise. The principles Baalvion builds against: permanence over novelty, systems over features, discipline over speed, and trust as architecture.';
const URL = `${BASE_URL}/philosophy`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Philosophy')}&eyebrow=${encodeURIComponent('Baalvion Industries')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: SITE_NAME,
    images: [{ url: OG, width: 1200, height: 630, alt: 'Baalvion Philosophy' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
  },
};

const PRINCIPLES = [
  {
    index: '01',
    title: 'Permanence over novelty.',
    desc: 'We choose proven structure over trend. What we ship must still be defensible in a decade.',
  },
  {
    index: '02',
    title: 'Systems over features.',
    desc: 'Features age; systems compound. We design whole operating fabrics, not collections of parts.',
  },
  {
    index: '03',
    title: 'Discipline over speed.',
    desc: 'Speed is an output of clarity, not a substitute for it. We move deliberately so the systems we run never have to.',
  },
  {
    index: '04',
    title: 'Trust as architecture.',
    desc: 'Security, compliance, and governance are not layers added at the end. They are load-bearing walls, designed in from the first line.',
  },
];

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Philosophy', url: '/philosophy' },
        ])}
      />
      <Navbar />
      <main>
        <SubPageHero category="Philosophy" title="Infrastructure is a promise." />

        <div className="bg-white section-vertical-padding">
          <div className="section-container layout-stack">
            <p className="max-w-4xl text-xl md:text-2xl text-gray-800 leading-relaxed font-light">
              Most technology is built for the moment it ships. Infrastructure is built for every
              moment after. When systems move trade, capital, and livelihoods, reliability is not a
              feature — it is the product. This is the standard Baalvion builds against.
            </p>

            <section aria-labelledby="why-infrastructure">
              <span className="section-label">Foundation</span>
              <h2 id="why-infrastructure">Why infrastructure</h2>
              <p className="max-w-3xl">
                We build the layer beneath: the systems other systems depend on. That position
                carries obligations. Infrastructure cannot be fashionable, cannot be fragile, and
                cannot be abandoned. It must outlast the conditions in which it was built.
              </p>
            </section>

            <section aria-labelledby="design-principles">
              <span className="section-label">Principles</span>
              <h2 id="design-principles">Design principles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {PRINCIPLES.map((principle) => (
                  <div key={principle.index} className="glass-card flex flex-col gap-4 p-8">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">
                      {principle.index}
                    </span>
                    <h3 className="text-xl md:text-2xl">{principle.title}</h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                      {principle.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="how-we-build">
              <span className="section-label">Method</span>
              <h2 id="how-we-build">How we build</h2>
              <p className="max-w-3xl">
                Every Baalvion system follows the same arc: understand the domain to its
                foundations, design the architecture before the interface, operate what we build,
                and measure ourselves over years rather than quarters. We would rather decline a
                market than enter it unprepared.
              </p>
            </section>

            <section aria-labelledby="long-horizon">
              <span className="section-label">Commitment</span>
              <h2 id="long-horizon">The long horizon</h2>
              <p className="max-w-3xl mb-12">
                Baalvion is built to be depended on. That is the entire ambition — and the hardest
                one.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/structure"
                  className="inline-flex items-center gap-2 border border-gray-200 rounded-sm px-6 py-3 text-sm font-bold text-gray-900 hover:border-primary hover:text-primary transition-colors"
                >
                  Company Structure
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/leadership"
                  className="inline-flex items-center gap-2 border border-gray-200 rounded-sm px-6 py-3 text-sm font-bold text-gray-900 hover:border-primary hover:text-primary transition-colors"
                >
                  Leadership &amp; Founders
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
