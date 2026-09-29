'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Loader2, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Capital Operations — the IR/finance view of the register.
 *
 * This page used to run entirely on hardcoded investors held in React state: "issue capital call"
 * showed a toast and changed nothing, and a wire could be marked Confirmed in the browser with no
 * money involved. Every figure below now comes from the ir-service capital ledgers, and the two
 * write actions hit the real endpoints.
 *
 * Two things deliberately absent:
 *  - The role switcher. Authority comes from the session; a control that lets you pick your own
 *    role is a demo device, and ir-service refuses the staff endpoints regardless of what the
 *    browser claims.
 *  - The SPV allocation engine. There is no SPV or allocation domain behind it — rebuilding it on
 *    invented state would put the same fiction back.
 */

interface RegisterRow {
  id: string;
  investorName: string;
  currency: string;
  status: string;
  commitmentAmount: number;
  calledToDate: number;
  paidToDate: number;
  outstanding: number;
  remainingCommitment: number;
}

type Load = 'loading' | 'ready' | 'forbidden' | 'error';

const fmt = (v: number, ccy: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: ccy || 'INR', maximumFractionDigits: 0 }).format(v || 0);

export default function CapitalOperationsPage() {
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [state, setState] = useState<Load>('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [pct, setPct] = useState('10');
  const [purpose, setPurpose] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/capital/register', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) { setState('forbidden'); return; }
      const json = await res.json();
      if (!res.ok || !json?.success) { setState('error'); return; }
      setRows(json.data ?? []);
      setState('ready');
    } catch { setState('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => rows.reduce(
    (t, r) => ({
      committed: t.committed + r.commitmentAmount,
      called: t.called + r.calledToDate,
      paid: t.paid + r.paidToDate,
      outstanding: t.outstanding + r.outstanding,
    }),
    { committed: 0, called: 0, paid: 0, outstanding: 0 },
  ), [rows]);
  const currency = rows[0]?.currency || 'INR';

  const issueCall = async () => {
    setBusy('call'); setMessage('');
    try {
      const res = await fetch('/api/v1/capital/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callPct: Number(pct), purpose: purpose || undefined, dueDate: dueDate || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      // Surface the service's refusal verbatim — over-calling a commitment is rejected there, and
      // the operator needs the actual reason, not a generic failure.
      setMessage(res.ok && json?.success
        ? `Capital call ${json.data?.reference} issued at ${pct}%. Notices are now visible to investors.`
        : json?.error?.message || 'The call was not issued.');
      if (res.ok) { setPurpose(''); await load(); }
    } catch { setMessage('Could not reach the capital service.'); }
    finally { setBusy(''); }
  };

  if (state === 'loading') return <Centre><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Centre>;
  if (state === 'forbidden') return (
    <Centre>
      <div className="max-w-md text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-semibold">Capital operations is restricted</p>
        <p className="mt-1 text-sm text-muted-foreground">This view is limited to the IR and finance team.</p>
      </div>
    </Centre>
  );
  if (state === 'error') return (
    <Centre>
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-3 font-semibold">The register could not be loaded</p>
        <p className="mt-1 text-sm text-muted-foreground">No figures are shown rather than stale ones. Try again shortly.</p>
        <Button variant="outline" className="mt-4" onClick={() => { setState('loading'); load(); }}>Retry</Button>
      </div>
    </Centre>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/40">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Landmark className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Capital Operations</h1>
              <p className="text-xs text-muted-foreground">Commitments, drawdowns and receipts — from the ledger.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh</Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-8 px-6 py-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total committed" value={fmt(totals.committed, currency)} />
          <Stat label="Called to date" value={fmt(totals.called, currency)} />
          <Stat label="Received" value={fmt(totals.paid, currency)} />
          <Stat label="Outstanding" value={fmt(totals.outstanding, currency)} tone={totals.outstanding > 0 ? 'warn' : 'ok'} />
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Issue a drawdown</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applied pro-rata across every signed commitment. A call that would exceed an investor&apos;s
            remaining commitment is refused rather than reduced.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Percentage of commitment">
              <input value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal"
                className="w-28 rounded-md border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Purpose (appears on the notice)">
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Phase 2 deployment"
                className="w-80 rounded-md border bg-background px-3 py-2 text-sm" />
            </Field>
            <Button onClick={issueCall} disabled={busy === 'call' || rows.length === 0}>
              {busy === 'call' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Issue call
            </Button>
          </div>
          {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
        </section>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">Register</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Called and received are summed from the call and settlement ledgers — nothing here is stored on the commitment.
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No commitments on the register yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <Th className="text-left">Investor</Th><Th>Status</Th><Th>Committed</Th>
                    <Th>Called</Th><Th>Received</Th><Th>Outstanding</Th><Th>Uncalled</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{r.investorName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(r.commitmentAmount, r.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(r.calledToDate, r.currency)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(r.paidToDate, r.currency)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${r.outstanding > 0 ? 'text-amber-600' : ''}`}>
                        {fmt(r.outstanding, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(r.remainingCommitment, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Receipts are recorded against a bank settlement reference through the capital API — a wire is
          never marked received from this screen alone.
        </p>
      </div>
    </main>
  );
}

function Centre({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[70vh] items-center justify-center px-6">{children}</div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${tone === 'warn' ? 'text-amber-600' : ''}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className || 'text-right'}`}>{children}</th>;
}
