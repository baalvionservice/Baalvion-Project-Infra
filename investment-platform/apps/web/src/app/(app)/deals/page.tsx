'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { shortDate } from '@/lib/format';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>('/deals')
      .then(setDeals)
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Deal rooms</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
        Private negotiations, due diligence and signing.
      </p>

      <div className="mt-6 space-y-3">
        {loading && <div className="card p-5 text-sm">Loading…</div>}
        {!loading && deals.length === 0 && (
          <div className="card p-5 text-sm" style={{ color: 'var(--color-muted)' }}>
            No deals yet. Express interest in an opportunity to open one.
          </div>
        )}
        {deals.map((d) => (
          <Link key={d.id} href={`/deals/${d.id}`} className="card flex items-center justify-between p-5 transition hover:-translate-y-0.5">
            <div>
              <div className="font-semibold">
                {d.opportunity?.company?.brandName ?? d.opportunity?.company?.legalName ?? 'Deal'}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Updated {shortDate(d.updatedAt)}
              </div>
            </div>
            <span className="tag" style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              {d.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
