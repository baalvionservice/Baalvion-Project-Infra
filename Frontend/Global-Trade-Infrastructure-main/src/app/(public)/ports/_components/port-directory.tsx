"use client";
/**
 * @file port-directory.tsx
 * @description Public ports / points-of-entry directory — searchable and
 * filterable by country and kind (seaport, airport, dry port, ICD, rail, land
 * border). Client-side filtering over the SSR-delivered list.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DirectoryPort } from '@/server/gckb/public-read';

type Props = { ports: DirectoryPort[] };
const ALL = 'ALL';

export function PortDirectory({ ports }: Props) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState(ALL);
  const [kind, setKind] = useState(ALL);

  const countries = useMemo(() => [ALL, ...[...new Set(ports.map((p) => p.countryName).filter((n) => n !== '—'))].sort()], [ports]);
  const kinds = useMemo(() => [ALL, ...[...new Set(ports.map((p) => p.kind).filter(Boolean) as string[])].sort()], [ports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ports.filter((p) => {
      if (country !== ALL && p.countryName !== country) return false;
      if (kind !== ALL && p.kind !== kind) return false;
      if (!q) return true;
      return [p.name, p.unlocode, p.iata, p.icao, p.countryName, p.countryCode].some((v) => v?.toLowerCase().includes(q));
    });
  }, [ports, query, country, kind]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ports, UN/LOCODE, IATA…" aria-label="Search ports"
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
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 lg:ml-auto">{filtered.length} ports</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-20 text-center">
          <Anchor className="mx-auto size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-300">No ports match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Port</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Codes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    {p.countryCode !== '—' ? (
                      <Link href={`/countries/${p.countryCode.toLowerCase()}#ports`} className="font-bold text-slate-200 hover:text-primary">{p.countryName}</Link>
                    ) : <span className="text-slate-400">{p.countryName}</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                  <td className="px-4 py-3"><span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">{p.kind?.replace(/_/g, ' ') ?? '—'}</span></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {[p.unlocode, p.iata ? `IATA ${p.iata}` : null, p.icao ? `ICAO ${p.icao}` : null].filter(Boolean).join(' · ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
