'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { money, multiple } from '@/lib/format';

interface Summary {
  positions: Array<{ companyOrgId: string; currentValue: number; costBasis: number; currency: string; moic: number | null }>;
  totals: { invested: number; currentValue: number; unrealizedGain: number; moic: number | null };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distributions, setDistributions] = useState<any[]>([]);

  useEffect(() => {
    api<Summary>('/portfolio').then(setSummary).catch(() => setSummary(null));
    api<any[]>('/portfolio/distributions').then(setDistributions).catch(() => {});
  }, []);

  const t = summary?.totals;
  const navSeries = (summary?.positions ?? []).map((p, i) => ({
    name: `P${i + 1}`,
    value: p.currentValue,
  }));

  const cards = [
    { label: 'Total invested', value: t ? money(t.invested) : '—' },
    { label: 'Current value', value: t ? money(t.currentValue) : '—' },
    { label: 'Unrealized gain', value: t ? money(t.unrealizedGain) : '—' },
    { label: 'Portfolio MOIC', value: t ? multiple(t.moic) : '—' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Portfolio overview</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
        Your holdings, performance and payouts at a glance.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {c.label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <div className="mb-4 font-semibold">Holdings value</div>
        {navSeries.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={navSeries}>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-line)', borderRadius: 12 }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No active positions yet. Explore opportunities to begin investing.
          </p>
        )}
      </div>

      <div className="card mt-6 p-6">
        <div className="mb-4 font-semibold">Recent distributions</div>
        {distributions.length ? (
          <table className="w-full text-sm">
            <thead style={{ color: 'var(--color-muted)' }}>
              <tr className="text-left">
                <th className="pb-2">Type</th>
                <th className="pb-2">Gross</th>
                <th className="pb-2">Net</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map((d) => (
                <tr key={d.id} className="border-t" style={{ borderColor: 'var(--color-line)' }}>
                  <td className="py-2">{d.type}</td>
                  <td>{money(d.grossAmount, d.currency)}</td>
                  <td>{money(d.netAmount, d.currency)}</td>
                  <td>
                    <span className="tag">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No payouts yet.
          </p>
        )}
      </div>
    </div>
  );
}
