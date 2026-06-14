'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { money, pct } from '@/lib/format';

export default function OpportunityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [opp, setOpp] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/opportunities/${id}`).then(setOpp).catch(() => setOpp(null));
  }, [id]);

  async function expressInterest() {
    setBusy(true);
    try {
      const deal = await api<{ id: string }>('/deals', {
        method: 'POST',
        body: JSON.stringify({ opportunityId: id }),
      });
      router.push(`/deals/${deal.id}`);
    } finally {
      setBusy(false);
    }
  }

  if (!opp) return <div className="text-sm">Loading…</div>;
  const company = opp.company;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.back()} className="text-sm" style={{ color: 'var(--color-muted)' }}>
        ← Back
      </button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{company?.brandName ?? company?.legalName}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            {company?.country} · {company?.industryCode} · {opp.round}
          </p>
        </div>
        <button className="btn btn-primary" onClick={expressInterest} disabled={busy}>
          {busy ? 'Opening…' : 'Express interest'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Raising</div>
          <div className="mt-1 text-xl font-semibold">{money(opp.amountSought, opp.currency)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Pre-money</div>
          <div className="mt-1 text-xl font-semibold">
            {opp.preMoneyValuation ? money(opp.preMoneyValuation, opp.currency) : '—'}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Equity offered</div>
          <div className="mt-1 text-xl font-semibold">{pct(opp.equityOfferedPct ? Number(opp.equityOfferedPct) / 100 : null)}</div>
        </div>
      </div>

      {company?.profile && (
        <div className="card mt-6 space-y-4 p-6">
          {company.profile.summary && (
            <section>
              <h3 className="font-semibold">Overview</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{company.profile.summary}</p>
            </section>
          )}
          {company.profile.problem && (
            <section>
              <h3 className="font-semibold">Problem</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{company.profile.problem}</p>
            </section>
          )}
          {company.profile.solution && (
            <section>
              <h3 className="font-semibold">Solution</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{company.profile.solution}</p>
            </section>
          )}
        </div>
      )}

      {company?.founders?.length > 0 && (
        <div className="card mt-6 p-6">
          <h3 className="font-semibold">Founders</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {company.founders.map((f: any) => (
              <div key={f.id} className="rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
                <div className="font-medium">{f.name}</div>
                <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
