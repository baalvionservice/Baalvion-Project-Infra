'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { money, multiple } from '@/lib/format';

export default function PortfolioPage() {
  const [summary, setSummary] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [tax, setTax] = useState<any[]>([]);

  useEffect(() => {
    api('/portfolio').then(setSummary).catch(() => {});
    api<any[]>('/investments').then(setInvestments).catch(() => {});
    api<any[]>('/portfolio/tax-documents').then(setTax).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Portfolio</h1>

      <div className="card mt-6 p-6">
        <h3 className="font-semibold">Holdings</h3>
        <table className="mt-4 w-full text-sm">
          <thead style={{ color: 'var(--color-muted)' }}>
            <tr className="text-left">
              <th className="pb-2">Security</th>
              <th className="pb-2">Cost</th>
              <th className="pb-2">Value</th>
              <th className="pb-2">MOIC</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.positions ?? []).map((p: any) => (
              <tr key={p.positionId} className="border-t" style={{ borderColor: 'var(--color-line)' }}>
                <td className="py-2">{p.securityType}</td>
                <td>{money(p.costBasis, p.currency)}</td>
                <td>{money(p.currentValue, p.currency)}</td>
                <td>{multiple(p.moic)}</td>
              </tr>
            ))}
            {(!summary || summary.positions.length === 0) && (
              <tr>
                <td colSpan={4} className="py-3" style={{ color: 'var(--color-muted)' }}>
                  No holdings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="font-semibold">Commitments</h3>
        <div className="mt-3 space-y-2">
          {investments.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
              <span className="text-sm">{money(i.amount, i.currency)} · {i.securityType}</span>
              <span className="tag">{i.status}</span>
            </div>
          ))}
          {investments.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No commitments yet.</p>
          )}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="font-semibold">Tax documents</h3>
        <div className="mt-3 space-y-2">
          {tax.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: 'var(--color-surface-2)' }}>
              <span className="text-sm">{t.type} · {t.taxYear} · {t.jurisdiction}</span>
              <span className="tag">{t.status}</span>
            </div>
          ))}
          {tax.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Tax documents appear here after your first distribution.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
