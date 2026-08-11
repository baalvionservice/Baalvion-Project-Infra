import React from 'react';
import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { COUNTRIES, getCountryArticleCounts } from '@/data/countries';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// title.absolute, not a plain string: this segment's own title already bakes
// in the "| Law Elite Network" suffix, and the root layout's title.template
// ('%s | Law Elite Network') would otherwise wrap it a second time -- see the
// identical note in src/lib/seo/article-seo.tsx. `images` is set explicitly
// on openGraph/twitter because a page-level `openGraph`/`twitter` object
// replaces (not merges with) the root layout's, so the root's generated
// /opengraph-image fallback is otherwise silently dropped -- WhatsApp/social
// crawlers ignore robots but read these tags, and an og:image-less share
// renders as a bare text link.
//
// Indexed only once at least one country actually has real jurisdiction-
// specific articles -- see the matching check (and full rationale) in
// ./layout.tsx's generateMetadata, which this must stay consistent with.
export async function generateMetadata(): Promise<Metadata> {
  const counts = await getCountryArticleCounts();
  const hasPopulatedCountry = Object.values(counts).some((n) => n > 0);
  return {
    title: { absolute: 'Legal Guides by Country | Law Elite Network' },
    description: 'Browse plain-language legal guides organized by jurisdiction — the same library, structured around the country each guide applies to.',
    alternates: { canonical: `${SITE}/countries` },
    robots: { index: hasPopulatedCountry, follow: true },
    openGraph: {
      type: 'website',
      url: `${SITE}/countries`,
      title: 'Legal Guides by Country | Law Elite Network',
      description: 'Browse plain-language legal guides organized by jurisdiction.',
      images: [{ url: `${SITE}/opengraph-image`, width: 1200, height: 630, alt: 'Law Elite Network — Global Legal Intelligence' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Legal Guides by Country | Law Elite Network',
      description: 'Browse plain-language legal guides organized by jurisdiction.',
      images: [`${SITE}/twitter-image`],
    },
  };
}

export default async function CountriesIndexPage() {
  const counts = await getCountryArticleCounts();
  // Countries with published guides first, so the directory leads with what's
  // actually there rather than burying it alphabetically among empty entries.
  const sortedCountries = [...COUNTRIES].sort(
    (a, b) => (counts[b.slug] || 0) - (counts[a.slug] || 0),
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legal Guides by Country',
    description: 'Plain-language legal guides organized by jurisdiction.',
    url: `${SITE}/countries`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${SITE}/countries` },
    ],
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      <main className="pb-24">
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <span className="kicker">Worldwide Coverage</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              Legal Guides by Country
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
              Jurisdiction-specific explainers, browsable by country.
            </p>
            <p className="text-[15px] text-slate-500 max-w-2xl leading-relaxed mt-4">
              This directory covers the jurisdictions LawEliteNetwork currently writes about. Each
              country page explains the basics of that jurisdiction's legal system and links to any
              country-specific guides we've published — jurisdictions without dedicated guides yet
              are marked below rather than left to look more complete than they are. Coverage is
              added over time, not all at once.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedCountries.map((country) => {
              const count = counts[country.slug] || 0;
              return (
                <Link
                  key={country.slug}
                  href={`/countries/${country.slug}`}
                  className="group flex items-center justify-between p-6 rounded-xl border border-slate-200 hover:border-news-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Globe2 className="w-5 h-5 text-slate-300 group-hover:text-news-600 transition-colors" />
                    <span className="font-headline text-lg font-bold text-slate-900">{country.name}</span>
                  </div>
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${count > 0 ? 'text-news-600' : 'text-slate-400'}`}
                  >
                    {count > 0 ? `${count} ${count === 1 ? 'guide' : 'guides'}` : 'Coming soon'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
    </>
  );
}
