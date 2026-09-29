'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

/**
 * Posts a company, then its profile, through the marketplace BFF.
 *
 * The company is created as a draft and submitted for review in one pass — a founder should not
 * have to discover a separate "submit" button before anything happens. Publishing a round is a
 * deliberate second step on the dashboard, because that is the action investors actually see.
 */

const INDUSTRIES = ['software', 'fintech', 'healthtech', 'robotics', 'energy', 'agritech', 'logistics', 'consumer', 'manufacturing', 'other'];
const STAGES = [
  { value: 'startup', label: 'Startup — pre-revenue or early revenue' },
  { value: 'sme', label: 'SME — established, profitable or near it' },
  { value: 'growth', label: 'Growth — scaling, raising to accelerate' },
  { value: 'enterprise', label: 'Enterprise — large, established' },
];

export default function ListBusinessForm() {
  const router = useRouter();
  const [f, setF] = useState({
    legal_name: '', brand_name: '', registration_no: '', country: 'IN',
    industry_code: 'software', stage: 'startup', website: '',
    summary: '', problem: '', solution: '', founded_year: '', team_size: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setNeedsAuth(false);
    try {
      const company = await fetch('/api/mp/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: f.legal_name.trim(),
          brand_name: f.brand_name.trim() || undefined,
          registration_no: f.registration_no.trim() || undefined,
          country: f.country || undefined,
          industry_code: f.industry_code,
          stage: f.stage,
          website: f.website.trim() || undefined,
        }),
      });
      if (company.status === 401) { setNeedsAuth(true); return; }
      const cj = await company.json().catch(() => ({}));
      if (!company.ok || !cj?.success) throw new Error(cj?.error?.message || cj?.error || 'Could not save your business.');
      const id = cj.data.id;

      // Best-effort: the narrative is useful but must not lose the company record if it fails.
      // PATCH, not POST — the profile is an upsert on the company record.
      await fetch(`/api/mp/companies/${id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: f.summary.trim() || undefined,
          problem: f.problem.trim() || undefined,
          solution: f.solution.trim() || undefined,
          founded_year: f.founded_year ? Number(f.founded_year) : undefined,
          team_size: f.team_size ? Number(f.team_size) : undefined,
        }),
      }).catch(() => null);

      await fetch(`/api/mp/companies/${id}/submit`, { method: 'POST' }).catch(() => null);
      router.push('/invest/my-business');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
        <LogIn className="mx-auto h-9 w-9 text-gray-300" />
        <p className="mt-4 text-lg font-semibold">Sign in to post your business</p>
        <p className="mt-1 text-sm text-gray-500">Your listing is tied to your account so only you can edit it.</p>
        <a href="/invest/list-your-business?login=1" className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white">Sign in</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
      <Group title="The company">
        <Row>
          <Field label="Registered legal name" required>
            <input required value={f.legal_name} onChange={(e) => set('legal_name', e.target.value)}
              placeholder="Northwind Robotics Private Limited" className={input} />
          </Field>
          <Field label="Trading name">
            <input value={f.brand_name} onChange={(e) => set('brand_name', e.target.value)} placeholder="Northwind" className={input} />
          </Field>
        </Row>
        <Row>
          <Field label="Registration number" hint="CIN, company number or equivalent">
            <input value={f.registration_no} onChange={(e) => set('registration_no', e.target.value)} className={input} />
          </Field>
          <Field label="Country" hint="Two-letter code">
            <input value={f.country} onChange={(e) => set('country', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} className={input} />
          </Field>
        </Row>
        <Row>
          <Field label="Industry">
            <select value={f.industry_code} onChange={(e) => set('industry_code', e.target.value)} className={input}>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i[0].toUpperCase() + i.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Stage">
            <select value={f.stage} onChange={(e) => set('stage', e.target.value)} className={input}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Website">
          <input type="url" value={f.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" className={input} />
        </Field>
      </Group>

      <Group title="What you do" hint="This is what an investor reads first.">
        <Field label="In one or two sentences">
          <textarea rows={2} value={f.summary} onChange={(e) => set('summary', e.target.value)}
            placeholder="Warehouse automation for mid-market distributors across India." className={input} />
        </Field>
        <Field label="The problem">
          <textarea rows={3} value={f.problem} onChange={(e) => set('problem', e.target.value)} className={input} />
        </Field>
        <Field label="Your solution">
          <textarea rows={3} value={f.solution} onChange={(e) => set('solution', e.target.value)} className={input} />
        </Field>
        <Row>
          <Field label="Founded">
            <input inputMode="numeric" value={f.founded_year} onChange={(e) => set('founded_year', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2023" className={input} />
          </Field>
          <Field label="Team size">
            <input inputMode="numeric" value={f.team_size} onChange={(e) => set('team_size', e.target.value.replace(/\D/g, ''))} placeholder="12" className={input} />
          </Field>
        </Row>
      </Group>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-4">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Post my business
        </button>
        <span className="text-xs text-gray-500">Saved as a draft and sent for verification. Nothing is public yet.</span>
      </div>
    </form>
  );
}

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none';

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</legend>
      {hint && <p className="-mt-2 text-xs text-gray-500">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">
        {label}{required && <span className="text-primary"> *</span>}
      </span>
      {hint && <span className="ml-2 text-[11px] text-gray-400">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
