"use client";
/**
 * @file country-explorer.tsx
 * @description Public Country Explorer — a searchable, region-filterable grid of
 * every published country in the knowledge base. Pure client-side filtering over
 * the SSR-delivered list (no extra fetch); each card links to the country profile.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Globe2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CountrySummary } from '@/server/gckb/public-read';

type Props = {
  countries: CountrySummary[];
};

const ALL = 'ALL';

export function CountryExplorer({ countries }: Props) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string>(ALL);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) if (c.region) set.add(c.region);
    return [ALL, ...[...set].sort()];
  }, [countries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((c) => {
      if (region !== ALL && c.region !== region) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.officialName?.toLowerCase().includes(q) ?? false) ||
        (c.capital?.toLowerCase().includes(q) ?? false) ||
        (c.alpha3?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [countries, query, region]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries, codes, capitals…"
            aria-label="Search countries"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {filtered.length} / {countries.length} jurisdictions
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest transition',
              region === r
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/25 hover:text-slate-200',
            )}
          >
            {r === ALL ? 'All regions' : r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-20 text-center">
          <Globe2 className="mx-auto size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-300">No countries match your search.</p>
          <p className="mt-1 text-xs text-slate-500">Try a different name, ISO code, or region.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <Link
              key={c.code}
              href={`/countries/${c.code.toLowerCase()}`}
              className="group relative flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none" aria-hidden>
                  {c.flagEmoji ?? '🏳️'}
                </span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-black tracking-widest text-slate-300">
                  {c.code}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black text-white group-hover:text-primary">{c.name}</p>
                {c.region ? <p className="text-[11px] font-medium text-slate-500">{c.region}</p> : null}
              </div>
              {c.capital ? (
                <p className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin className="size-3 text-slate-500" /> {c.capital}
                </p>
              ) : null}
              <ArrowUpRight className="absolute right-4 top-4 size-4 text-transparent transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
