'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { money, shortDate } from '@/lib/format';

const TABS = ['Messages', 'Due Diligence', 'Term Sheets', 'Escrow'] as const;
type Tab = (typeof TABS)[number];

export default function DealRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('Messages');
  const [data, setData] = useState<any>(null);
  const [draft, setDraft] = useState('');

  async function load() {
    const d = await api(`/deals/${id}`);
    setData(d);
  }
  useEffect(() => {
    load().catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    if (!draft.trim()) return;
    await api(`/deals/${id}/messages`, { method: 'POST', body: JSON.stringify({ body: draft }) });
    setDraft('');
    await load();
  }

  async function acceptTerms() {
    await api(`/deals/${id}/term-sheets/accept`, { method: 'POST' });
    await load();
  }

  async function proposeTerms() {
    const amount = Number(prompt('Investment amount (USD)') ?? '0');
    if (!amount) return;
    await api(`/deals/${id}/term-sheets`, {
      method: 'POST',
      body: JSON.stringify({ action: 'PROPOSE', amount, currency: 'USD' }),
    });
    await load();
  }

  async function fund(escrowId: string) {
    const amount = Number(prompt('Amount to fund into escrow (USD)') ?? '0');
    if (!amount) return;
    const res = await api<{ clientSecret: string }>(`/escrow/${escrowId}/fund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    alert(`Escrow funding initiated. Payment intent secret: ${res.clientSecret}`);
    await load();
  }

  if (!data) return <div className="text-sm">Loading…</div>;
  const deal = data.deal;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deal room</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Status: <span style={{ color: 'var(--color-accent)' }}>{deal.status}</span>
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => api(`/deals/${id}/nda`, { method: 'POST' }).then(load)}>
          Sign NDA
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b" style={{ borderColor: 'var(--color-line)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm"
            style={
              tab === t
                ? { color: 'var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }
                : { color: 'var(--color-muted)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Messages' && (
          <div className="card flex h-[420px] flex-col p-4">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {data.messages.map((m: any) => (
                <div key={m.id} className="text-sm">
                  {m.isSystem ? (
                    <div className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                      {m.body}
                    </div>
                  ) : (
                    <div className="rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {shortDate(m.createdAt)}
                      </div>
                      {m.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input"
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button className="btn btn-primary" onClick={send}>
                Send
              </button>
            </div>
          </div>
        )}

        {tab === 'Due Diligence' && <DueDiligence dealId={id} />}

        {tab === 'Term Sheets' && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Term sheets</h3>
              <div className="flex gap-2">
                <button className="btn btn-ghost text-sm" onClick={proposeTerms}>
                  Propose
                </button>
                <button className="btn btn-primary text-sm" onClick={acceptTerms}>
                  Accept latest
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.termSheets.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  No term sheets yet.
                </p>
              )}
              {data.termSheets.map((ts: any) => (
                <div key={ts.id} className="rounded-lg p-4" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="tag">{ts.status}</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>v{ts.currentVersion}</span>
                  </div>
                  {ts.versions?.[0] && (
                    <div className="mt-2 text-sm">
                      {money(ts.versions[0].amount, ts.versions[0].currency)} ·{' '}
                      {ts.versions[0].equityPct ? `${ts.versions[0].equityPct}% equity` : ts.versions[0].securityType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Escrow' && (
          <div className="card p-6">
            <h3 className="font-semibold">Escrow</h3>
            <div className="mt-4 space-y-3">
              {data.escrow.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  No escrow account yet — accept a term sheet to create one.
                </p>
              )}
              {data.escrow.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg p-4" style={{ background: 'var(--color-surface-2)' }}>
                  <div>
                    <div className="font-medium">{money(e.balance, e.currency)} held</div>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {e.provider} · {e.status}
                    </div>
                  </div>
                  <button className="btn btn-primary text-sm" onClick={() => fund(e.id)}>
                    Fund
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DueDiligence({ dealId }: { dealId: string }) {
  const [dd, setDd] = useState<any>(null);

  async function load() {
    setDd(await api(`/deals/${dealId}/due-diligence`));
  }
  useEffect(() => {
    load().catch(() => setDd(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function add() {
    const title = prompt('Diligence item title');
    if (!title) return;
    await api(`/deals/${dealId}/due-diligence`, {
      method: 'POST',
      body: JSON.stringify({ category: 'FINANCIAL', title }),
    });
    await load();
  }

  async function complete(itemId: string) {
    await api(`/due-diligence/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETE' }),
    });
    await load();
  }

  if (!dd) return <div className="card p-6 text-sm">Loading…</div>;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Due diligence checklist</h3>
        <button className="btn btn-ghost text-sm" onClick={add}>
          Add item
        </button>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-surface-2)' }}>
        <div className="h-full" style={{ width: `${dd.progress.pct}%`, background: 'var(--color-accent)' }} />
      </div>
      <div className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
        {dd.progress.complete}/{dd.progress.total} complete
      </div>
      <div className="mt-4 space-y-2">
        {dd.items.map((i: any) => (
          <div key={i.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
            <span className="text-sm">{i.title}</span>
            {i.status === 'COMPLETE' ? (
              <span className="tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>Done</span>
            ) : (
              <button className="text-xs" style={{ color: 'var(--color-accent)' }} onClick={() => complete(i.id)}>
                Mark complete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
