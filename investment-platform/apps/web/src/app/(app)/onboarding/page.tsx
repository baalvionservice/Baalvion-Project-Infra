'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Kyc {
  status: string;
  provider: string;
  applicantId: string;
}

export default function OnboardingPage() {
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [busy, setBusy] = useState(false);
  const [investorSaved, setInvestorSaved] = useState(false);
  const [type, setType] = useState('ANGEL');

  useEffect(() => {
    api<Kyc | null>('/compliance/kyc/status').then(setKyc).catch(() => {});
  }, []);

  async function saveInvestor() {
    await api('/investors/profile', { method: 'POST', body: JSON.stringify({ type }) });
    setInvestorSaved(true);
  }

  async function startKyc() {
    setBusy(true);
    try {
      const res = await api<Kyc>('/compliance/kyc/start', {
        method: 'POST',
        body: JSON.stringify({ subjectType: 'INDIVIDUAL' }),
      });
      setKyc(res);
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    {
      n: 1,
      title: 'Investor profile',
      done: investorSaved,
      body: (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Investor type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {['ANGEL', 'VENTURE_CAPITAL', 'PRIVATE_EQUITY', 'FAMILY_OFFICE', 'INSTITUTIONAL', 'RETAIL'].map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={saveInvestor}>
            {investorSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      ),
    },
    {
      n: 2,
      title: 'Identity verification (KYC/AML)',
      done: kyc?.status === 'APPROVED',
      body: (
        <div>
          {kyc ? (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Provider: {kyc.provider} · Status:{' '}
                <span style={{ color: 'var(--color-accent)' }}>{kyc.status}</span>
              </span>
              <span className="tag">{kyc.applicantId}</span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={startKyc} disabled={busy}>
              {busy ? 'Starting…' : 'Start verification'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Get verified</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
        Complete these steps to unlock investing. It takes a few minutes.
      </p>

      <div className="mt-6 space-y-4">
        {steps.map((s) => (
          <div key={s.n} className="card p-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  background: s.done ? 'var(--color-accent)' : 'var(--color-surface-2)',
                  color: s.done ? 'var(--color-ink)' : 'var(--color-muted)',
                }}
              >
                {s.done ? '✓' : s.n}
              </span>
              <span className="font-semibold">{s.title}</span>
            </div>
            <div className="mt-4">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
