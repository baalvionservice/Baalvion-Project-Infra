import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import type { Region } from '@/lib/regions';

interface CountryCount {
  country: string;
  countryCode: string;
  count: number;
}

interface JurisdictionDirectoryProps {
  regions: Region[];
  counts: CountryCount[];
}

/**
 * CNBC's /world page uses a region tab strip (Asia / Europe / Middle East /
 * Africa) to steer news; here the same subnav pattern steers a real
 * jurisdiction directory instead, since the network has no per-region news
 * feed to filter. Counts are only ever the live "active lawyer" figures from
 * /lawyers/countries — never fabricated.
 */
export function JurisdictionDirectory({ regions, counts }: JurisdictionDirectoryProps) {
  const countByCode = new Map(counts.map((c) => [c.countryCode, c.count]));

  return (
    <section id="jurisdictions">
      <div className="section-rule">
        <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
        <h2>Find a Lawyer, By Jurisdiction</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400 max-w-2xl -mt-4 mb-8 leading-relaxed">
        Browse the network by country to find practitioners licensed in that jurisdiction.
      </p>

      <div className="flex flex-wrap gap-1 mb-8 border-b border-slate-200 dark:border-slate-800 pb-px">
        {regions.map((region) => (
          <a
            key={region.id}
            href={`#region-${region.id}`}
            className="px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-news-600 border-b-2 border-transparent hover:border-news-600 transition-colors"
          >
            {region.name}
          </a>
        ))}
      </div>

      <div className="space-y-10">
        {regions.map((region) => (
          <div key={region.id} id={`region-${region.id}`} className="scroll-mt-24">
            <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-news-600" />
              {region.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {region.countries.map((country) => {
                const count = countByCode.get(country.code);
                return (
                  <Link
                    key={country.code}
                    href={`/lawyers?countryCode=${country.code}`}
                    className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-news-600 hover:text-news-600 transition-colors"
                  >
                    {country.name}
                    {typeof count === 'number' && count > 0 && (
                      <span className="ml-1.5 text-slate-400 dark:text-slate-500">{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
