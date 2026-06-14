'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Briefcase, LogIn } from 'lucide-react';

interface Deal { id: string; status: string; opportunity_id: string | null; created_at: string }

const STAGE: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-blue-100 text-blue-700' },
  dd: { label: 'Due Diligence', cls: 'bg-amber-100 text-amber-700' },
  negotiating: { label: 'Negotiating', cls: 'bg-amber-100 text-amber-700' },
  term_sheet: { label: 'Term Sheet', cls: 'bg-purple-100 text-purple-700' },
  signing: { label: 'Signing', cls: 'bg-indigo-100 text-indigo-700' },
  funding: { label: 'Funding', cls: 'bg-teal-100 text-teal-700' },
  closed: { label: 'Closed', cls: 'bg-green-100 text-green-700' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-gray-100 text-gray-600' },
};

export default function MyDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mp/deals');
        if (res.status === 401) return setState('unauth');
        const json = await res.json();
        if (!res.ok) throw new Error();
        setDeals(json.data?.items ?? []);
        setState('ready');
      } catch { setState('error'); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Baalvion Invest</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">My Deal Pipeline</h1>
          <p className="mt-2 text-[#6e6e73]">Track every opportunity you&apos;re progressing — from interest through diligence, terms, signing and funding.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-10">
        {state === 'loading' && <div className="flex items-center gap-2 py-16 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading your deals…</div>}

        {state === 'unauth' && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <LogIn className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 text-lg font-semibold">Sign in to view your pipeline</p>
            <p className="mt-1 text-sm text-gray-500">Investor access is required to open and manage deals.</p>
            <Link href="/invest/deals?login=1" className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">Sign in</Link>
          </div>
        )}

        {state === 'error' && <div className="py-16 text-center text-gray-500">Could not load your deals. Please try again.</div>}

        {state === 'ready' && deals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 text-lg font-semibold">No deals yet</p>
            <p className="mt-1 text-sm text-gray-500">Browse opportunities and express interest to open your first deal.</p>
            <Link href="/invest" className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">Discover opportunities</Link>
          </div>
        )}

        {state === 'ready' && deals.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <tr><th className="px-5 py-3">Deal</th><th className="px-5 py-3">Stage</th><th className="px-5 py-3">Opened</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((d) => {
                  const s = STAGE[d.status] ?? { label: d.status, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{d.id.slice(0, 8)}…</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span></td>
                      <td className="px-5 py-4 text-gray-500">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/invest/deals/${d.id}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Open deal room <ArrowRight className="h-4 w-4" /></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
