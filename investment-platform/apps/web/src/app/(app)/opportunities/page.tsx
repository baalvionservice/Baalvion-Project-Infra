'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { money } from '@/lib/format';

interface Opportunity {
  id: string;
  round: string;
  amountSought: string;
  currency: string;
  summary?: string;
  company?: { brandName?: string; legalName: string; country?: string; industryCode?: string };
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Opportunity[] }>('/opportunities')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    api<any[]>('/opportunities/recommended').then(setRecommended).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Opportunities</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
        Vetted rounds open for investment. Matched to your thesis where possible.
      </p>

      {recommended.length > 0 && (
        <>
          <h2 className="mt-8 text-sm uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Recommended for you
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {recommended.slice(0, 4).map((m) => (
              <Link key={m.opportunity.id} href={`/opportunities/${m.opportunity.id}`} className="card p-5 transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {m.opportunity.company?.brandName ?? m.opportunity.company?.legalName ?? 'Company'}
                  </span>
                  <span className="tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
                    {Math.round(m.score * 100)}% fit
                  </span>
                </div>
                <div className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                  {m.opportunity.round} · {money(m.opportunity.amountSought, m.opportunity.currency)}
                </div>
                {m.reasons?.[0] && (
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                    {m.reasons[0]}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
        All live rounds
      </h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {loading && <div className="card p-5 text-sm">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="card p-5 text-sm" style={{ color: 'var(--color-muted)' }}>
            No live opportunities right now.
          </div>
        )}
        {items.map((o) => (
          <Link key={o.id} href={`/opportunities/${o.id}`} className="card p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{o.company?.brandName ?? o.company?.legalName ?? 'Company'}</span>
              <span className="tag">{o.round}</span>
            </div>
            <div className="mt-1 text-lg font-semibold">{money(o.amountSought, o.currency)}</div>
            {o.summary && (
              <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                {o.summary}
              </p>
            )}
            <div className="mt-3 flex gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              {o.company?.country && <span className="tag">{o.company.country}</span>}
              {o.company?.industryCode && <span className="tag">{o.company.industryCode}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
