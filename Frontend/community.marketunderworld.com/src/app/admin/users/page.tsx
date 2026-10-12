"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldBan, ShieldCheck, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suspendUser, unsuspendUser } from '@/lib/api/admin-users';
import { loadPeople, type Person } from '@/lib/api/admin-people';

type Filter = 'all' | 'sellers' | 'sellers_pending' | 'buyers' | 'intermediaries' | 'staff' | 'kyc' | 'payments' | 'suspended';
const FILTERS: { key: Filter; label: string; test: (p: Person) => boolean }[] = [
  { key: 'all', label: 'Everyone', test: () => true },
  { key: 'sellers', label: 'Sellers', test: (p) => p.seller?.status === 'approved' },
  { key: 'sellers_pending', label: 'Applying to sell', test: (p) => p.seller?.status === 'pending' },
  { key: 'buyers', label: 'Buyers (marketplace pass)', test: (p) => p.buyerPass },
  { key: 'intermediaries', label: 'Intermediaries', test: (p) => !!p.intermediary },
  { key: 'staff', label: 'Staff', test: (p) => !!p.staff },
  { key: 'kyc', label: 'KYC to review', test: (p) => p.kyc === 'submitted' },
  { key: 'payments', label: 'Payment waiting', test: (p) => p.waitingPayments > 0 },
  { key: 'suspended', label: 'Suspended', test: (p) => p.user.status === 'suspended' },
];

const chip = 'inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border';
function Tags({ p }: { p: Person }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.staff && <span className={`${chip} border-purple-500/40 text-purple-300`}>Staff: {p.staff}</span>}
      {p.seller?.status === 'approved' && <span className={`${chip} border-emerald-500/40 text-emerald-300`}>Seller{p.categories ? ` · ${p.categories} categor${p.categories === 1 ? 'y' : 'ies'}` : ''}</span>}
      {p.seller?.status === 'pending' && <span className={`${chip} border-amber-500/40 text-amber-300`}>Applying to sell</span>}
      {p.seller?.status === 'rejected' && <span className={`${chip} border-red-500/40 text-red-300`}>Seller not approved</span>}
      {p.buyerPass && <span className={`${chip} border-cyan-500/40 text-cyan-300`}>Buyer</span>}
      {p.tiers.map((t) => <span key={t} className={`${chip} border-yellow-500/40 text-yellow-300`}>{t.replace('-', ' ')}</span>)}
      {p.intermediary && <span className={`${chip} border-fuchsia-500/40 text-fuchsia-300`}>Intermediary · {p.intermediary.status.replace('_', ' ')}</span>}
      {p.kyc && <span className={`${chip} ${p.kyc === 'approved' ? 'border-emerald-500/40 text-emerald-300' : p.kyc === 'submitted' ? 'border-amber-500/40 text-amber-300' : 'border-red-500/40 text-red-300'}`}>KYC {p.kyc}</span>}
      {p.waitingPayments > 0 && <span className={`${chip} border-red-500/60 text-red-300`}>{p.waitingPayments} payment waiting</span>}
      {p.user.status === 'suspended' && <span className={`${chip} border-red-500/60 text-red-300`}>Suspended</span>}
    </div>
  );
}

// Everyone on the platform in one list, with what each person is: buyer, seller, intermediary, staff, and where they stand.
export default function PeoplePage() {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    loadPeople().then(setPeople).catch((e) => setError(e instanceof Error ? e.message : 'Could not load people'));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, (people ?? []).filter(f.test).length])) as Record<Filter, number>, [people]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)!.test;
    return (people ?? []).filter((p) => test(p) && (!t || p.user.email.toLowerCase().includes(t) || (p.user.full_name ?? '').toLowerCase().includes(t) || p.user.id === t || (p.seller?.storeName ?? '').toLowerCase().includes(t) || (p.intermediary?.name ?? '').toLowerCase().includes(t)));
  }, [people, filter, q]);

  const toggleSuspend = async (p: Person) => {
    setActing(p.user.id);
    try {
      if (p.user.status === 'suspended') { await unsuspendUser(p.user.id); toast({ title: 'Reinstated', description: `${p.user.email} can sign in again.` }); }
      else { await suspendUser(p.user.id); toast({ title: 'Suspended', description: `${p.user.email}'s sessions were ended.` }); }
      load();
    } catch (e) { toast({ variant: 'destructive', title: 'Action failed', description: e instanceof Error ? e.message : 'Please try again.' }); }
    finally { setActing(null); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">People</h1>
        <p className="text-gray-400 mt-1 text-sm">Everyone on the platform and what they are: buyers, sellers, intermediaries, staff. Search by email, name, store name or user number, or pick a group.</p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
            className={`px-3.5 py-2 rounded-lg text-sm border ${filter === f.key ? 'bg-red-600 border-red-600 text-white' : 'border-white/15 text-gray-300 hover:border-white/30'}`}>
            {f.label}{people ? <span className={`ml-2 text-xs ${filter === f.key ? 'text-white/80' : 'text-gray-500'}`}>{counts[f.key]}</span> : null}
          </button>
        ))}
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name, store, user number" aria-label="Search people"
          className="w-full bg-black/40 border border-white/10 h-11 rounded-xl pl-11 pr-4 text-sm text-white outline-none focus:border-red-500" />
      </div>

      {error ? <p className="text-red-300 text-sm">{error}</p> : people === null ? (
        <div className="py-16 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading everyone…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center text-gray-400">No one matches. Clear the search or pick another group.</div>
      ) : (
        <ul className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
          {shown.map((p) => (
            <li key={p.user.id} className="bg-white/[0.02]">
              <button onClick={() => setOpen(open === p.user.id ? null : p.user.id)} aria-expanded={open === p.user.id} className="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-4 hover:bg-white/[0.04]">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold text-white truncate">{p.user.full_name || p.seller?.storeName || p.user.email}</span>
                    <span className="text-xs text-gray-500 truncate">{p.user.email}</span>
                  </div>
                  <Tags p={p} />
                </div>
                <div className="text-right text-xs text-gray-500 shrink-0 hidden sm:block">#{p.user.id}<br />Joined {new Date(p.user.created_at).toLocaleDateString()}</div>
                <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${open === p.user.id ? 'rotate-180' : ''}`} />
              </button>
              {open === p.user.id && (
                <div className="px-4 sm:px-6 pb-5 pt-1 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm bg-black/20">
                  <dl className="space-y-1.5 text-gray-300">
                    <div><dt className="inline text-gray-500">User number </dt><dd className="inline">#{p.user.id}</dd></div>
                    <div><dt className="inline text-gray-500">Email verified </dt><dd className="inline">{p.user.email_verified_at ? 'Yes' : 'No'}</dd></div>
                    <div><dt className="inline text-gray-500">Account </dt><dd className="inline">{p.user.status}</dd></div>
                    {p.seller && <div><dt className="inline text-gray-500">Store </dt><dd className="inline">{p.seller.storeName} ({p.seller.status})</dd></div>}
                    {p.intermediary && <div><dt className="inline text-gray-500">Intermediary </dt><dd className="inline">{p.intermediary.name} ({p.intermediary.status.replace('_', ' ')})</dd></div>}
                  </dl>
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-widest">Go to</p>
                    <div className="flex flex-wrap gap-2">
                      {p.seller && <Link className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-200" href="/admin/seller-applications">Seller application</Link>}
                      {(p.waitingPayments > 0 || p.buyerPass || p.categories > 0 || p.tiers.length > 0) && <Link className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-200" href="/admin/seller-payments">Payments</Link>}
                      {p.kyc && <Link className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-200" href="/admin/kyc">KYC</Link>}
                      {p.intermediary && <Link className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-200" href="/escrow/admin-dashboard">Intermediary</Link>}
                      {p.staff && <Link className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-gray-200" href="/admin/staff">Staff access</Link>}
                      <button onClick={() => toggleSuspend(p)} disabled={acting === p.user.id} className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 inline-flex items-center gap-2 disabled:opacity-50">
                        {acting === p.user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.user.status === 'suspended' ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                        {p.user.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {people && <p className="text-xs text-gray-600">Showing {shown.length} of {people.length}. A person with no tags has signed up but has not bought, applied to sell or asked for anything yet.</p>}
    </div>
  );
}
