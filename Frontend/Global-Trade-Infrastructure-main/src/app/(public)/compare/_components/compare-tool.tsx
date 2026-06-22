"use client";
/**
 * @file compare-tool.tsx
 * @description Public country-comparison tool. Pick 2–4 countries; the server
 * returns a side-by-side comparison of their published trade posture (policy
 * counts by group, headline taxes, agreements, authorities, ports).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Loader2, GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CountrySummary, CountryComparison } from '@/server/gckb/public-read';

type Props = {
  countries: CountrySummary[];
};

const MAX = 4;

const METRICS: Array<{ key: string; label: string }> = [
  { key: 'policies', label: 'Total policies' },
  { key: 'tariff', label: 'Tariffs & duties' },
  { key: 'tax', label: 'Taxes' },
  { key: 'license', label: 'Licenses' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'restriction', label: 'Restricted / prohibited' },
  { key: 'agreements', label: 'Trade agreements' },
  { key: 'authorities', label: 'Authorities' },
  { key: 'ports', label: 'Ports' },
];

export function CompareTool({ countries }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<CountryComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected.length < 2) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/gckb/public/compare?codes=${selected.join(',')}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
        setData(json.data as CountryComparison);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Comparison failed');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selected]);

  function add(code: string) {
    setSelected((prev) => (prev.includes(code) || prev.length >= MAX ? prev : [...prev, code]));
  }
  function remove(code: string) {
    setSelected((prev) => prev.filter((c) => c !== code));
  }

  const available = countries.filter((c) => !selected.includes(c.code));

  function metricValue(entry: CountryComparison['countries'][number], key: string): number {
    if (key === 'policies') return entry.policies;
    if (key === 'agreements') return entry.agreements;
    if (key === 'authorities') return entry.authorities;
    if (key === 'ports') return entry.ports;
    return entry.groupCounts[key as keyof typeof entry.groupCounts] ?? 0;
  }

  return (
    <div className="space-y-8">
      {/* Selection */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((code) => {
            const c = countries.find((x) => x.code === code);
            return (
              <span key={code} className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                <span aria-hidden>{c?.flagEmoji ?? '🏳️'}</span> {c?.name ?? code}
                <button type="button" onClick={() => remove(code)} aria-label={`Remove ${c?.name ?? code}`} className="text-primary/70 hover:text-primary">
                  <X className="size-3.5" />
                </button>
              </span>
            );
          })}
          {selected.length < MAX ? (
            <select
              value=""
              onChange={(e) => { if (e.target.value) add(e.target.value); }}
              aria-label="Add a country to compare"
              className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-1.5 text-sm text-slate-300 outline-none transition focus:border-primary/60"
            >
              <option value="">+ Add country…</option>
              {available.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
            </select>
          ) : null}
        </div>
        <p className="mt-3 text-[11px] font-medium text-slate-500">Select between two and {MAX} countries to compare.</p>
      </div>

      {error ? <p className="text-sm font-bold text-red-400">{error}</p> : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400"><Loader2 className="size-5 animate-spin" /> Comparing…</div>
      ) : data && data.countries.length >= 2 ? (
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Metric</th>
                {data.countries.map((entry) => (
                  <th key={entry.country.code} className="px-5 py-4 text-left">
                    <Link href={`/countries/${entry.country.code.toLowerCase()}`} className="flex items-center gap-2 font-black text-white hover:text-primary">
                      <span aria-hidden className="text-xl">{entry.country.flagEmoji ?? '🏳️'}</span>
                      {entry.country.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {METRICS.map((m) => (
                <tr key={m.key}>
                  <td className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">{m.label}</td>
                  {data.countries.map((entry) => {
                    const value = metricValue(entry, m.key);
                    const max = Math.max(...data.countries.map((e) => metricValue(e, m.key)));
                    return (
                      <td key={entry.country.code} className={cn('px-5 py-3 tabular-nums', value > 0 && value === max ? 'font-black text-primary' : 'text-slate-200')}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Headline tax</td>
                {data.countries.map((entry) => {
                  const tax = entry.taxes[0];
                  return (
                    <td key={entry.country.code} className="px-5 py-3 text-slate-200">
                      {tax ? `${tax.taxType ?? tax.name}${tax.ratePercent !== null ? ` · ${tax.ratePercent}%` : ''}` : '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 py-20 text-center">
          <div>
            <GitCompareArrows className="mx-auto size-8 text-slate-600" />
            <p className="mt-4 text-sm font-bold text-slate-300">Pick at least two countries to compare.</p>
          </div>
        </div>
      )}

      {data && data.missing.length > 0 ? (
        <p className="text-xs text-slate-500">Not published: {data.missing.join(', ')}</p>
      ) : null}
    </div>
  );
}
