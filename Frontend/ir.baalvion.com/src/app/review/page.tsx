'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, AlertTriangle, Building2, Users, Check, X, RefreshCw } from 'lucide-react';

/**
 * Staff review queue — approving a company or an investor.
 *
 * This existed only as an API before, so onboarding a business meant someone running a PATCH by
 * hand. Nothing could go live without that, which made the whole marketplace un-operable.
 *
 * marketplace-service owns every decision here: it enforces the staff role, and reads the queue
 * cross-org over its privileged connection (RLS hides other tenants from the app connection, so
 * the queue would otherwise come back empty). This page is a view over that, not a gate.
 */

interface Company { id: string; legal_name: string; brand_name?: string | null; country?: string | null; stage: string; industry_code?: string | null; status: string; kyc_status: string; created_at: string }
interface Investor { id: string; legal_name: string; type?: string | null; country?: string | null; status: string; kyc_status: string; aml_status?: string | null; created_at: string }

type Tab = 'companies' | 'investors';
type Load = 'loading' | 'ready' | 'forbidden' | 'error';

const STATUS_CLS: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800',
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function ReviewPage() {
  const [tab, setTab] = useState<Tab>('companies');
  const [state, setState] = useState<Load>('loading');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        fetch('/api/mp/review/companies?limit=100', { cache: 'no-store' }),
        fetch('/api/mp/review/investors?limit=100', { cache: 'no-store' }),
      ]);
      if (c.status === 401 || c.status === 403) { setState('forbidden'); return; }
      if (!c.ok) { setState('error'); return; }
      setCompanies((await c.json().catch(() => ({})))?.data?.items ?? []);
      setInvestors(i.ok ? ((await i.json().catch(() => ({})))?.data?.items ?? []) : []);
      setState('ready');
    } catch { setState('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (kind: Tab, id: string, action: 'approve' | 'reject') => {
    setBusy(id + action); setMessage('');
    try {
      const res = await fetch(`/api/mp/review/${kind}/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, kyc_status: action === 'approve' ? 'verified' : undefined }),
      });
      const json = await res.json().catch(() => ({}));
      // Surface the service's own reason — "Already approved" is information, not a failure.
      if (!res.ok || !json?.success) setMessage(json?.error?.message || 'That decision was not recorded.');
      else await load();
    } catch { setMessage('Could not reach the marketplace service.'); }
    finally { setBusy(''); }
  };

  if (state === 'loading') return <Centre><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></Centre>;
  if (state === 'forbidden') return (
    <Centre>
      <div className="max-w-md text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 font-semibold">Review is restricted</p>
        <p className="mt-1 text-sm text-gray-500">Only platform and compliance staff can approve listings.</p>
      </div>
    </Centre>
  );
  if (state === 'error') return (
    <Centre>
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-3 font-semibold">The review queue could not be loaded</p>
        <button onClick={() => { setState('loading'); load(); }} className="mt-4 rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold">Retry</button>
      </div>
    </Centre>
  );

  const pendingCompanies = companies.filter((c) => c.status === 'submitted');
  const pendingInvestors = investors.filter((i) => i.status === 'submitted');

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Platform</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Review Queue</h1>
            <p className="mt-1 text-sm text-[#6e6e73]">Nothing a founder posts reaches investors until it is verified here.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="flex gap-1 border-b border-gray-200">
          {([['companies', 'Companies', Building2, pendingCompanies.length], ['investors', 'Investors', Users, pendingInvestors.length]] as const).map(([k, label, Icon, n]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${tab === k ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-black'}`}>
              <Icon className="h-4 w-4" /> {label}
              {n > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{n}</span>}
            </button>
          ))}
        </div>

        {message && <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}

        <div className="mt-6 space-y-3">
          {tab === 'companies' && companies.length === 0 && <Empty>No companies have been posted yet.</Empty>}
          {tab === 'companies' && companies.map((c) => (
            <Row key={c.id}
              title={c.brand_name || c.legal_name}
              subtitle={`${c.legal_name} · ${c.stage}${c.industry_code ? ` · ${c.industry_code}` : ''}${c.country ? ` · ${c.country}` : ''}`}
              status={c.status} kyc={c.kyc_status} created={c.created_at}
              busy={busy} id={c.id}
              onDecide={(a) => decide('companies', c.id, a)} />
          ))}

          {tab === 'investors' && investors.length === 0 && <Empty>No investors are awaiting review.</Empty>}
          {tab === 'investors' && investors.map((i) => (
            <Row key={i.id}
              title={i.legal_name}
              subtitle={`${i.type || 'investor'}${i.country ? ` · ${i.country}` : ''}${i.aml_status ? ` · AML ${i.aml_status}` : ''}`}
              status={i.status} kyc={i.kyc_status} created={i.created_at}
              busy={busy} id={i.id}
              onDecide={(a) => decide('investors', i.id, a)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ title, subtitle, status, kyc, created, busy, id, onDecide }: {
  title: string; subtitle: string; status: string; kyc: string; created: string;
  busy: string; id: string; onDecide: (a: 'approve' | 'reject') => void;
}) {
  const decided = status === 'approved' || status === 'rejected';
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 p-5">
      <div className="min-w-[240px] flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        <p className="mt-1 text-[11px] text-gray-400">Posted {new Date(created).toLocaleDateString('en-IN')}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_CLS[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">KYC {kyc}</span>
      {/* Decided records keep their outcome visible rather than disappearing from the queue. */}
      {!decided && (
        <div className="flex gap-2">
          <button disabled={!!busy} onClick={() => onDecide('approve')}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy === id + 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
          </button>
          <button disabled={!!busy} onClick={() => onDecide('reject')}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-60">
            {busy === id + 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
          </button>
        </div>
      )}
    </div>
  );
}

const Centre = ({ children }: { children: React.ReactNode }) =>
  <div className="flex min-h-[60vh] items-center justify-center bg-white px-6">{children}</div>;

const Empty = ({ children }: { children: React.ReactNode }) =>
  <p className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-400">{children}</p>;
