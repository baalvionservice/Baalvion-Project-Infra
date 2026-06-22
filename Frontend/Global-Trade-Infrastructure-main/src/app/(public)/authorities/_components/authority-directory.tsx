"use client";
/**
 * @file authority-directory.tsx
 * @description Public government / customs authority directory — searchable and
 * filterable by country and kind. Client-side filtering over the SSR list.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Building2, Globe2, Mail, Phone } from 'lucide-react';
import type { DirectoryAuthority } from '@/server/gckb/public-read';

type Props = { authorities: DirectoryAuthority[] };
const ALL = 'ALL';

export function AuthorityDirectory({ authorities }: Props) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState(ALL);
  const [kind, setKind] = useState(ALL);

  const countries = useMemo(() => [ALL, ...[...new Set(authorities.map((a) => a.countryName))].sort()], [authorities]);
  const kinds = useMemo(() => [ALL, ...[...new Set(authorities.map((a) => a.kind).filter(Boolean) as string[])].sort()], [authorities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return authorities.filter((a) => {
      if (country !== ALL && a.countryName !== country) return false;
      if (kind !== ALL && a.kind !== kind) return false;
      if (!q) return true;
      return [a.name, a.kind, a.countryName, a.jurisdiction].some((v) => v?.toLowerCase().includes(q));
    });
  }, [authorities, query, country, kind]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search authorities…" aria-label="Search authorities"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Filter by country" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-primary/60">
            {countries.map((c) => <option key={c} value={c}>{c === ALL ? 'All countries' : c}</option>)}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by kind" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-primary/60">
            {kinds.map((k) => <option key={k} value={k}>{k === ALL ? 'All kinds' : k.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 lg:ml-auto">{filtered.length} authorities</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-20 text-center">
          <Building2 className="mx-auto size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-300">No authorities match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <article key={a.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">{a.name}</h3>
                  {a.countryCode !== '—' ? (
                    <Link href={`/countries/${a.countryCode.toLowerCase()}#authorities`} className="text-[11px] font-bold text-slate-500 hover:text-primary">{a.countryName}</Link>
                  ) : <span className="text-[11px] font-bold text-slate-500">{a.countryName}</span>}
                </div>
                {a.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{a.kind}</span> : null}
              </div>
              <div className="mt-auto space-y-1 text-xs text-slate-400">
                {a.website ? <p className="flex items-center gap-1.5 truncate text-primary"><Globe2 className="size-3 shrink-0" /> {a.website}</p> : null}
                {a.email ? <p className="flex items-center gap-1.5"><Mail className="size-3 shrink-0" /> {a.email}</p> : null}
                {a.phone ? <p className="flex items-center gap-1.5"><Phone className="size-3 shrink-0" /> {a.phone}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
