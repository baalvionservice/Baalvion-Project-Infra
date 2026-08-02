import React from 'react';
import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { COUNTRIES, getCountryArticleCounts } from '@/data/countries';

export default async function CountriesIndexPage() {
  const counts = await getCountryArticleCounts();

  return (
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
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COUNTRIES.map((country) => (
              <Link
                key={country.slug}
                href={`/countries/${country.slug}`}
                className="group flex items-center justify-between p-6 rounded-xl border border-slate-200 hover:border-news-600 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Globe2 className="w-5 h-5 text-slate-300 group-hover:text-news-600 transition-colors" />
                  <span className="font-headline text-lg font-bold text-slate-900">{country.name}</span>
                </div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  {counts[country.slug] || 0} {counts[country.slug] === 1 ? 'guide' : 'guides'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
