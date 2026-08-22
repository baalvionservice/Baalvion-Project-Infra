import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COUNTRIES } from '@/data/countries';

/**
 * Homepage jurisdiction gateway. Reuses the same 8 countries as /countries
 * (the canonical index) but intentionally omits its per-country guide-count
 * badge here -- on a teaser section, eight "0 guides" badges read as broken,
 * not as honest. /countries itself still shows real counts for anyone
 * browsing there specifically. No jurisdiction is listed that COUNTRIES
 * doesn't already define. Laid out as a ruled two-column table (matching
 * TrustSection's charter treatment) rather than bordered icon cards.
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
      <p className="text-sm text-slate-500 max-w-2xl mb-2 leading-relaxed">
        Legal rules differ by country. We're organizing our library around where each guide
        applies — start with the jurisdictions we cover today.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-slate-200">
        {COUNTRIES.map((country, i) => (
          <Link
            key={country.slug}
            href={`/countries/${country.slug}`}
            className="group flex items-center justify-between gap-3 py-4 px-1 border-b border-slate-200 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span
                className="font-serif text-sm italic text-slate-300 group-hover:text-news-600 transition-colors w-5 tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-headline text-[15px] sm:text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">
                {country.name}
              </span>
            </div>
            <ArrowRight
              className="w-4 h-4 text-slate-300 group-hover:text-news-600 transition-colors shrink-0"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
