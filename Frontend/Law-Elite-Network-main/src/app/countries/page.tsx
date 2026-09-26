import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { COUNTRIES } from '@/lib/countries';
import { countryUrl } from '@/lib/country-url';
import { getAllPeople } from '@/data/people';

export const revalidate = 86400;

export default function CountriesPage() {
  // Only list countries something on the network is actually connected to —
  // an empty A-Z list of 100+ countries with nothing behind most of them
  // would be exactly the thin-content pattern this network has been
  // burned by before (see feedback_no-word-count-padding).
  const activeCodes = new Set(getAllPeople().map((p) => p.countryCode).filter(Boolean));
  const countries = COUNTRIES.filter((c) => activeCodes.has(c.code));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">Countries</h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">People, cases, and coverage connected to each country.</p>
          </header>

          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <Link key={c.code} href={countryUrl(c.code)} className="text-[13.5px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-4 py-2 transition-colors">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
