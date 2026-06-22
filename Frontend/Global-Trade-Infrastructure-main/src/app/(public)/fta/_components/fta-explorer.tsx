"use client";
/**
 * @file fta-explorer.tsx
 * @description Public FTA / trade-agreement explorer — searchable by name or
 * member country and filterable by agreement kind. Client-side filtering over the
 * SSR-delivered list; each card links to the agreement's rules-of-origin detail.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Handshake, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgreementView } from '@/server/gckb/public-read';

type Props = {
  agreements: AgreementView[];
};

const ALL = 'ALL';

export function FtaExplorer({ agreements }: Props) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState(ALL);

  const kinds = useMemo(() => {
    const set = new Set<string>();
    for (const a of agreements) if (a.kind) set.add(a.kind);
    return [ALL, ...[...set].sort()];
  }, [agreements]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agreements.filter((a) => {
      if (kind !== ALL && a.kind !== kind) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.recordKey.toLowerCase().includes(q) ||
        a.memberCountryCodes.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [agreements, query, kind]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agreements or member countries…"
            aria-label="Search trade agreements"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{filtered.length} / {agreements.length} agreements</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest transition',
              kind === k ? 'border-primary/60 bg-primary/15 text-primary' : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/25 hover:text-slate-200',
            )}
          >
            {k === ALL ? 'All kinds' : k}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-20 text-center">
          <Handshake className="mx-auto size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-300">No agreements match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Link
              key={a.recordKey}
              href={`/fta/${a.recordKey.toLowerCase()}`}
              className="group flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-black text-white group-hover:text-primary">{a.name}</h3>
                {a.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{a.kind}</span> : null}
              </div>
              {a.status ? <p className="text-[11px] font-bold text-emerald-400">{a.status}</p> : null}
              {a.rulesOfOriginSummary ? <p className="line-clamp-2 text-sm text-slate-400">{a.rulesOfOriginSummary}</p> : null}
              <p className="mt-auto flex items-center gap-1.5 text-[11px] text-slate-500">
                <Users className="size-3" /> {a.memberCountryCodes.length} member{a.memberCountryCodes.length === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
