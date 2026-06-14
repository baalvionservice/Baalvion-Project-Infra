'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, verifyMfa } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { reload } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (challengeToken) {
        await verifyMfa(challengeToken, code);
      } else {
        const result = await login(email, password);
        if (result.mfaRequired) {
          setChallenge(result.challengeToken);
          setBusy(false);
          return;
        }
      }
      await reload();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Baalvion<span style={{ color: 'var(--color-accent)' }}>Invest</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">
          {challengeToken ? 'Two-factor verification' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {challengeToken
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Sign in to your investor dashboard.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!challengeToken ? (
            <>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="label">Authentication code</label>
              <input
                className="input tracking-[0.5em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          )}

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'oklch(40% 0.12 25 / 0.2)', color: 'oklch(80% 0.12 25)' }}
            >
              {error}
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : challengeToken ? 'Verify & continue' : 'Sign in'}
          </button>
        </form>

        {!challengeToken && (
          <p className="mt-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--color-accent)' }}>
              Create an account
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
