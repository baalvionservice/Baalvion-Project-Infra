import React from 'react';
import Link from 'next/link';
import { Globe2, ArrowRight } from 'lucide-react';
import { COUNTRIES } from '@/data/countries';

/**
 * Homepage jurisdiction gateway. Reuses the same 8 countries as /countries
 * (the canonical index) but intentionally omits its per-country guide-count
 * badge here -- on a teaser section, eight "0 guides" badges read as broken,
 * not as honest. /countries itself still shows real counts for anyone
 * browsing there specifically. No jurisdiction is listed that COUNTRIES
 * doesn't already define.
 */
export function JurisdictionSection() {
  return (
    <section className="py-14 border-t border-slate-200">
      <div className="flex items-end justify-between border-b-2 border-slate-900 pb-2 mb-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
          <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 m-0">
            Explore by Jurisdiction
          </h2>
        </div>
        <Link
          href="/countries"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors shrink-0"
        >
          All jurisdictions <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <p className="text-sm text-slate-500 max-w-2xl mb-6 leading-relaxed">
        Legal rules differ by country. We're organizing our library around where each guide
        applies — start with the jurisdictions we cover today.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COUNTRIES.map((country) => (
          <Link
            key={country.slug}
            href={`/countries/${country.slug}`}
            className="group flex items-center gap-2.5 p-4 rounded-lg border border-slate-200 hover:border-news-600 hover:shadow-sm transition-all"
          >
            <Globe2 className="w-4 h-4 text-slate-300 group-hover:text-news-600 transition-colors shrink-0" aria-hidden="true" />
            <span className="font-headline text-[14px] font-bold text-slate-900">{country.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
