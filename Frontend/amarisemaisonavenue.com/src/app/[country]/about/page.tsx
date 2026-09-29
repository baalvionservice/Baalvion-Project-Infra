
import React from 'react';
import { Metadata } from 'next';
import { MAISON_STORY as MAISON_STORY_FALLBACK } from '@/lib/mock-data';
import { getMaisonStory } from '@/lib/cms';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry, SUPPORTED_COUNTRIES, getCountryConfig } from '@/lib/i18n/countries';
import { Sparkles, ShieldCheck, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Fetch CMS content live per request (works on Vercel against the public CMS).
export const dynamic = 'force-dynamic';

// The house was incorporated on this date. Everything on this page is written against it —
// there is no pre-2025 history to draw on, so nothing here claims any.
const FOUNDED_ISO = '2025-03-11';
const FOUNDED_LONG = '11 March 2025';

type AboutPageProps = {
  params: Promise<{
    country: string;
  }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  const description =
    'Amarisé Maison Avenue is an authenticated luxury resale house founded in 2025, trading pre-owned Hermès, Chanel, Goyard and fine jewelry across five markets.';
  return {
    title: 'About AMARISÉ MAISON | Authenticated Luxury Resale',
    description,
    alternates: buildAlternates(cc, '/about'),
    openGraph: {
      title: 'About AMARISÉ MAISON | Authenticated Luxury Resale',
      description,
      type: 'website',
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const country = (await params).country;
  const countryCode = (country as string) || 'us';

  // Centrally-managed Maison story from the CMS; fall back to bundled copy if CMS is down.
  const MAISON_STORY = (await getMaisonStory()) ?? MAISON_STORY_FALLBACK;

  const markets = SUPPORTED_COUNTRIES.map((code) => getCountryConfig(code));

  return (
    <div className="animate-fade-in bg-ivory">
      {/* Hero Header */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden border-b border-border bg-muted">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[15vw] font-headline font-bold text-gray-900 italic">2025</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="relative z-10 text-center space-y-6 max-w-4xl px-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
            <Link href={`/${countryCode}`} className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold">About</span>
          </nav>
          <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase">
            Established 2025
          </span>
          <h1 className="text-6xl md:text-8xl font-headline font-bold italic leading-tight text-gray-900">
            {MAISON_STORY.title}
          </h1>
          <p className="text-xl text-gray-600 font-light italic leading-relaxed max-w-2xl mx-auto">
            {MAISON_STORY.subtitle}
          </p>
        </div>
      </section>

      {/* What the house is */}
      <section className="container mx-auto px-6 py-32">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center justify-center p-4 bg-plum/5 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 italic">
            A Young House, an Old Standard
          </h2>
          <p className="text-xl text-gray-500 font-light leading-relaxed italic border-l-2 border-gold/30 pl-8 mx-auto max-w-2xl text-left">
            {MAISON_STORY.philosophy}
          </p>
          <p className="text-base text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
            Amarisé Maison Avenue was founded on <time dateTime={FOUNDED_ISO}>{FOUNDED_LONG}</time>. We
            are a resale house, not a maker: every piece we list was made by someone else, worn by
            someone else, and has to earn its place in the catalogue on condition and provenance
            alone. We would rather say that plainly than borrow a century we have not lived.
          </p>
        </div>
      </section>

      {/* Authentication — the actual work */}
      <section className="bg-white py-32 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-20 space-y-4 text-center">
            <ShieldCheck className="w-10 h-10 text-gold mb-2" />
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum">The Standard</h3>
            <h2 className="text-5xl font-headline font-bold italic text-gray-900">Authenticated Before Listed</h2>
          </div>
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <p className="text-lg text-gray-500 font-light leading-relaxed italic">
              Nothing reaches the catalogue unauthenticated. Each piece is examined and graded in
              house, and its condition is written down before a price is attached to it.
            </p>
            <div className="pt-4">
              <Link href={`/${countryCode}/authenticity`}>
                <button className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum hover:text-gold transition-colors border-b border-gold pb-2">
                  Read the Authenticity Guarantee
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Markets actually served */}
      <section className="container mx-auto px-6 py-32">
        <div className="text-center space-y-4 mb-20">
          <Globe className="w-10 h-10 text-plum mx-auto mb-4" />
          <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum">Where We Trade</h3>
          <h2 className="text-5xl font-headline font-bold italic text-gray-900">Five Markets</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {markets.map((m) => (
            <Link
              key={m.code}
              href={`/${m.code}`}
              className="group p-8 bg-white border border-border hover:border-gold transition-all duration-500 text-center"
            >
              <span className="block text-[10px] font-bold tracking-[0.4em] uppercase text-gold/60 group-hover:text-gold transition-colors">
                {m.code}
              </span>
              <span className="block mt-4 text-lg font-headline font-bold italic text-gray-900">
                {m.name}
              </span>
              <span className="block mt-2 text-[11px] tracking-widest uppercase text-gray-400">
                {m.symbol} {m.currency}
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-16 text-center text-sm text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
          Prices are shown in each market&rsquo;s own currency, with local duty and tax applied at
          checkout rather than added as a surprise afterwards.
        </p>
      </section>

      {/* Circularity — true of resale by definition, so it is safe to claim */}
      <section className="bg-plum/5 py-40 border-t border-border">
        <div className="container mx-auto px-6 text-center space-y-12 max-w-4xl">
          <div className="inline-flex items-center justify-center p-6 bg-white rounded-full shadow-lg mb-4">
            <ShieldCheck className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-5xl font-headline font-bold italic text-gray-900">The Longer Life</h2>
          <p className="text-2xl text-gray-600 font-light leading-relaxed italic max-w-3xl mx-auto">
            &ldquo;{MAISON_STORY.sustainability}&rdquo;
          </p>
          <p className="text-base text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            Resale is the whole of our model: each piece that changes hands here is one that stays
            in use instead of being replaced.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link href={`/${countryCode}/how-to-sell`}>
              <button className="bg-plum text-white hover:bg-gold hover:text-gray-900 h-16 px-14 rounded-none text-[10px] tracking-[0.4em] font-bold transition-all">
                SELL OR CONSIGN WITH US
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
