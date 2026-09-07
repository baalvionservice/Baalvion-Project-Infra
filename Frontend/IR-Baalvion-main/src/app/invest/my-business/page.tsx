'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogIn, Building2, Plus, Rocket, ShieldCheck, Clock, ArrowRight, AlertTriangle } from 'lucide-react';

/**
 * The founder's side of the marketplace: the business they posted, the rounds on it, and the
 * investors who have opened a room.
 *
 * Every rule shown here is enforced in marketplace-service, not in this page. A round cannot go
 * live until the company is approved (the service refuses with 412), and the deal rooms listed
 * are whatever the API returns for this org — this page never decides who may see what.
 */

interface Company { id: string; legal_name: string; brand_name?: string | null; status: string; kyc_status: string; stage: string; country?: string | null }
interface Opportunity { id: string; company_id: string; title: string; round?: string | null; amount_sought?: string | number | null; pre_money_valuation?: string | number | null; equity_offered_pct?: string | number | null; min_ticket?: string | number | null; status: string }
interface Deal { id: string; status: string; opportunity_id: string | null; created_at: string }

const money = (v: unknown) => {
  const n = Number(v);
  if (!v || !Number.isFinite(n)) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const STATUS: Record<string, { label: string; cls: string; note: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700', note: 'Not yet sent for verification.' },
  submitted: { label: 'In review', cls: 'bg-amber-100 text-amber-800', note: 'We are verifying the company. You can prepare a round now; it can go live once this clears.' },
  approved: { label: 'Verified', cls: 'bg-green-100 text-green-800', note: 'You can publish a round.' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', note: 'Verification did not pass. Contact us to resolve it.' },
  suspended: { label: 'Suspended', cls: 'bg-red-100 text-red-700', note: 'This listing is suspended.' },
};

export default function MyBusinessPage() {
  const [state, setState] = useState<'loading' | 'ready' | 'unauth' | 'none' | 'error'>('loading');
  const [company, setCompany] = useState<Company | null>(null);
  const [rounds, setRounds] = useState<Opportunity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [r, setR] = useState({ title: '', round: 'seed', amount_sought: '', pre_money_valuation: '', equity_offered_pct: '', min_ticket: '' });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mp/companies', { cache: 'no-store' });
      if (res.status === 401) { setState('unauth'); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setState('error'); return; }
      const items: Company[] = json?.data?.items ?? [];
      if (!items.length) { setState('none'); return; }
      const c = items[0];
      setCompany(c);

      const [oppRes, dealRes] = await Promise.all([
        // /mine, not the public list — discovery only returns live rounds, so a founder would
        // never see the draft they just created.
        fetch('/api/mp/opportunities/mine?limit=50', { cache: 'no-store' }),
        fetch('/api/mp/deals?limit=50', { cache: 'no-store' }),
      ]);
      const oppJson = await oppRes.json().catch(() => ({}));
      const dealJson = await dealRes.json().catch(() => ({}));
      setRounds((oppJson?.data?.items ?? []).filter((o: Opportunity) => o.company_id === c.id));
      setDeals(dealJson?.data?.items ?? []);
      setState('ready');
    } catch { setState('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (label: string, fn: () => Promise<Response>) => {
    setBusy(label); setMessage('');
    try {
      const res = await fn();
      const json = await res.json().catch(() => ({}));
      // Show the service's own reason — "company must be approved before publishing" is the
      // answer the founder needs, not a generic failure.
      if (!res.ok || !json?.success) setMessage(json?.error?.message || 'That did not work.');
      else await load();
      return res.ok;
    } finally { setBusy(''); }
  };

  const createRound = () => act('create', () => fetch('/api/mp/opportunities', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_id: company!.id,
      title: r.title.trim(),
      round: r.round,
      amount_sought: r.amount_sought ? Number(r.amount_sought) : undefined,
      pre_money_valuation: r.pre_money_valuation ? Number(r.pre_money_valuation) : undefined,
      equity_offered_pct: r.equity_offered_pct ? Number(r.equity_offered_pct) : undefined,
      min_ticket: r.min_ticket ? Number(r.min_ticket) : undefined,
    }),
  })).then((ok) => { if (ok) { setShowForm(false); setR({ ...r, title: '' }); } });

  if (state === 'loading') return <Centre><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></Centre>;
  if (state === 'unauth') return (
    <Centre>
      <div className="text-center">
        <LogIn className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 font-semibold">Sign in to manage your business</p>
        <Link href="/invest/my-business?login=1" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Sign in</Link>
      </div>
    </Centre>
  );
  if (state === 'none') return (
    <Centre>
      <div className="max-w-md text-center">
        <Building2 className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-lg font-semibold">You have not posted a business yet</p>
        <p className="mt-1 text-sm text-gray-500">Post it once and investors can find you.</p>
        <Link href="/invest/list-your-business" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white">
          Post your business <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Centre>
  );
  if (state === 'error' || !company) return (
    <Centre><div className="text-center text-gray-500"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-2">Could not load your business.</p></div></Centre>
  );

  const s = STATUS[company.status] ?? { label: company.status, cls: 'bg-gray-100 text-gray-700', note: '' };
  const canPublish = company.status === 'approved';

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Your business</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{company.brand_name || company.legal_name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
          </div>
          <p className="mt-2 text-sm text-[#6e6e73]">{company.legal_name} · {company.stage} · {company.country || '—'}</p>
          {s.note && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {company.status === 'approved' ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
              {s.note}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Rounds</h2>
          {!showForm && <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"><Plus className="h-4 w-4" /> New round</button>}
        </div>

        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); createRound(); }} className="mt-5 space-y-4 rounded-2xl border border-gray-200 p-6">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">What are you raising for? *</span>
              <input required value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })}
                placeholder="Seed — first 20 industrial deployments" className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Round</span>
                <select value={r.round} onChange={(e) => setR({ ...r, round: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                  {['pre_seed', 'seed', 'series_a', 'series_b', 'growth'].map((x) => <option key={x} value={x}>{x.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
              {([['amount_sought', 'Raising (₹)'], ['pre_money_valuation', 'Pre-money (₹)'], ['equity_offered_pct', 'Equity offered (%)'], ['min_ticket', 'Minimum ticket (₹)']] as const).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                  <input inputMode="decimal" value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value.replace(/[^\d.]/g, '') })}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button disabled={busy === 'create'} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy === 'create' && <Loader2 className="h-4 w-4 animate-spin" />} Save as draft
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-black">Cancel</button>
            </div>
          </form>
        )}

        {message && <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}

        <div className="mt-6 space-y-3">
          {rounds.length === 0 && !showForm && <p className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">No rounds yet. Create one, then publish it when your company is verified.</p>}
          {rounds.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 p-5">
              <div className="min-w-[220px] flex-1">
                <p className="font-semibold">{o.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-gray-400">{String(o.round || '').replace(/_/g, ' ')}</p>
              </div>
              <Stat label="Raising" value={money(o.amount_sought)} />
              <Stat label="Pre-money" value={money(o.pre_money_valuation)} />
              <Stat label="Min ticket" value={money(o.min_ticket)} />
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${o.status === 'live' ? 'bg-green-100 text-green-800' : o.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'}`}>{o.status}</span>
              {o.status === 'draft' && (
                <button
                  onClick={() => act('pub' + o.id, () => fetch(`/api/mp/opportunities/${o.id}/publish`, { method: 'POST' }))}
                  disabled={busy === 'pub' + o.id}
                  title={canPublish ? 'Make this round visible to investors' : 'Your company must be verified first'}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {busy === 'pub' + o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish
                </button>
              )}
              {o.status === 'live' && <Link href={`/invest/${o.id}`} className="text-sm font-semibold text-primary hover:underline">View as investor →</Link>}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <h2 className="text-xl font-bold">Investor deal rooms</h2>
          <p className="mt-1 text-sm text-gray-500">Every investor who has opened a room on one of your rounds. Documents, diligence and terms all happen inside.</p>
          <div className="mt-5 space-y-3">
            {deals.length === 0 && <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400">No investor has opened a room yet.</p>}
            {deals.map((d) => (
              <Link key={d.id} href={`/invest/deals/${d.id}`} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary/40">
                <div>
                  <p className="font-semibold">Deal room {d.id.slice(0, 8)}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Opened {new Date(d.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">{String(d.status).replace(/_/g, ' ')}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center bg-white px-6">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[92px]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
