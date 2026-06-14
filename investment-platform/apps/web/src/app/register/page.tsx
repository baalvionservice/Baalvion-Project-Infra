'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { reload } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        country: form.country || undefined,
      });
      await reload();
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Baalvion<span style={{ color: 'var(--color-accent)' }}>Invest</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Create your investor account</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Onboard from any country in minutes.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                className="input w-24 uppercase"
                maxLength={2}
                placeholder="US"
                value={form.country}
                onChange={set('country')}
              />
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Min 12 characters with upper, lower and a digit.
          </p>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'oklch(40% 0.12 25 / 0.2)', color: 'oklch(80% 0.12 25)' }}
            >
              {error}
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm" style={{ color: 'var(--color-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
