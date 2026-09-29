import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { SubPageHero } from '@/components/sub-page-hero';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema } from '@/lib/schema';

const TITLE = 'Company Structure | Baalvion Industries';
const DESCRIPTION =
  'Baalvion is organized as a single corporate foundation operating across three distinct layers: the corporate layer, the platform layer, and a portfolio of independent brands.';
const URL = `${BASE_URL}/structure`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('Company Structure')}&eyebrow=${encodeURIComponent('Baalvion Industries')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: SITE_NAME,
    images: [{ url: OG, width: 1200, height: 630, alt: 'Baalvion Company Structure' }],
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

interface StructureEntry {
  name: string;
  domain: string;
  desc: string;
  href: string;
  external: boolean;
}

const CORPORATE_ENTRIES: StructureEntry[] = [
  {
    name: 'Baalvion',
    domain: 'baalvion.com',
    desc: 'The corporate identity hub and portfolio index.',
    href: 'https://baalvion.com',
    external: true,
  },
  {
    name: 'About Baalvion',
    domain: 'about.baalvion.com',
    desc: 'The company in depth: structure, philosophy, leadership.',
    href: '/',
    external: false,
  },
  {
    name: 'Investor Relations',
    domain: 'ir.baalvion.com',
    desc: 'Information for investors and institutional partners.',
    href: 'https://ir.baalvion.com',
    external: true,
  },
];

const PLATFORM_ENTRIES: StructureEntry[] = [
  {
    name: 'Global Trade',
    domain: 'trade.baalvion.com',
    desc: 'Trade infrastructure and cross-border operations.',
    href: 'https://trade.baalvion.com',
    external: true,
  },
  {
    name: 'Mining & Resources',
    domain: 'mining.baalvion.com',
    desc: 'Industrial resource and trust infrastructure.',
    href: 'https://mining.baalvion.com',
    external: true,
  },
  {
    name: 'Markets',
    domain: 'market.baalvion.com',
    desc: 'Market and commerce systems.',
    href: 'https://market.baalvion.com',
    external: true,
  },
  {
    name: 'Talent',
    domain: 'jobs.baalvion.com',
    desc: 'Workforce and hiring network.',
    href: 'https://jobs.baalvion.com',
    external: true,
  },
  {
    name: 'Connect',
    domain: 'connect.baalvion.com',
    desc: 'Enterprise and brand connection layer.',
    href: 'https://connect.baalvion.com',
    external: true,
  },
  {
    name: 'Enterprise Access',
    domain: 'dashboard.baalvion.com',
    desc: 'Unified entry point for operating teams.',
    href: 'https://dashboard.baalvion.com',
    external: true,
  },
];

const BRAND_ENTRIES: StructureEntry[] = [
  {
    name: 'ControlTheMarket',
    domain: 'controlthemarket.com',
    desc: 'Market intelligence.',
    href: 'https://controlthemarket.com',
    external: true,
  },
  {
    name: 'Law Elite Network',
    domain: 'lawelitenetwork.com',
    desc: 'Legal excellence network.',
    href: 'https://lawelitenetwork.com',
    external: true,
  },
  {
    name: 'Imperialpedia',
    domain: 'imperialpedia.com',
    desc: 'Knowledge infrastructure.',
    href: 'https://imperialpedia.com',
    external: true,
  },
  {
    name: 'Amarisé Maison Avenue',
    domain: 'amarisemaisonavenue.com',
    desc: 'Luxury maison.',
    href: 'https://amarisemaisonavenue.com',
    external: true,
  },
  {
    name: 'Market Underworld',
    domain: 'marketunderworld.com',
    desc: 'Market culture and media.',
    href: 'https://marketunderworld.com',
    external: true,
  },
];

function EntryCard({ entry }: { entry: StructureEntry }) {
  const cardClassName =
    'glass-card group flex flex-col gap-3 p-8 hover:border-primary/30 hover:shadow-md';
  const inner = (
    <>
      <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">
        {entry.domain}
      </span>
      <span className="flex items-center gap-2 text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
        {entry.name}
        {entry.external && (
          <ArrowUpRight
            className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="text-sm text-gray-600 leading-relaxed">{entry.desc}</span>
    </>
  );

  if (entry.external) {
    return (
      <a href={entry.href} target="_blank" rel="noopener noreferrer" className={cardClassName}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={entry.href} className={cardClassName}>
      {inner}
    </Link>
  );
}

export default function StructurePage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Company Structure', url: '/structure' },
        ])}
      />
      <Navbar />
      <main>
        <SubPageHero category="Corporate Structure" title="One foundation. Three layers." />

        <div className="bg-white section-vertical-padding">
          <div className="section-container layout-stack">
            <p className="max-w-4xl text-xl md:text-2xl text-gray-800 leading-relaxed font-light">
              Baalvion is organized as a single corporate foundation operating across three
              distinct layers. Each layer has a defined mandate, clear boundaries, and its own
              operating discipline. The separation is deliberate: identity and governance remain
              stable at the core while platforms and brands operate at their own speed.
            </p>

            <section aria-labelledby="corporate-layer">
              <span className="section-label">Layer One</span>
              <h2 id="corporate-layer">The Corporate Layer</h2>
              <p className="max-w-3xl mb-12">
                The corporate layer defines who Baalvion is: identity, narrative, governance, and
                investor relations. It builds nothing operational and sells nothing. Its mandate is
                permanence.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CORPORATE_ENTRIES.map((entry) => (
                  <EntryCard key={entry.domain} entry={entry} />
                ))}
              </div>
            </section>

            <section aria-labelledby="platform-layer">
              <span className="section-label">Layer Two</span>
              <h2 id="platform-layer">The Platform Layer</h2>
              <p className="max-w-3xl mb-12">
                The platform layer operates Baalvion&apos;s infrastructure: the systems through
                which trade, markets, talent, and enterprise networks run. Platforms are
                operational by design and evolve continuously.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PLATFORM_ENTRIES.map((entry) => (
                  <EntryCard key={entry.domain} entry={entry} />
                ))}
              </div>
            </section>

            <section aria-labelledby="independent-brands">
              <span className="section-label">Layer Three</span>
              <h2 id="independent-brands">Independent Brands</h2>
              <p className="max-w-3xl mb-12">
                Brands in the Baalvion portfolio operate autonomously, with their own identity,
                audience, and editorial direction. They share the foundation&apos;s standards — not
                its name.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BRAND_ENTRIES.map((entry) => (
                  <EntryCard key={entry.domain} entry={entry} />
                ))}
              </div>
            </section>

            <section aria-labelledby="governance">
              <span className="section-label">Accountability</span>
              <h2 id="governance">Governance</h2>
              <p className="max-w-3xl mb-12">
                Governance at Baalvion is structural, not ceremonial. Accountability, compliance,
                and security standards are defined at the corporate layer and inherited by every
                platform and brand. Decisions of consequence pass through defined review; nothing
                of consequence is informal.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/leadership"
                  className="inline-flex items-center gap-2 border border-gray-200 rounded-sm px-6 py-3 text-sm font-bold text-gray-900 hover:border-primary hover:text-primary transition-colors"
                >
                  Leadership &amp; Founders
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/trust"
                  className="inline-flex items-center gap-2 border border-gray-200 rounded-sm px-6 py-3 text-sm font-bold text-gray-900 hover:border-primary hover:text-primary transition-colors"
                >
                  Trust &amp; Security
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
