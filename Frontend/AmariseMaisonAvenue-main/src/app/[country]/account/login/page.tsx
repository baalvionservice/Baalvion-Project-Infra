'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth';

/**
 * Account login — REAL authentication against the Baalvion identity gateway.
 * "Returning Customer" / "New Customer" are accessible tabs that switch panels
 * (previously inert <span>s that the layout styled like tabs but never wired up).
 * On success we honour the `?redirect=` the auth middleware appended.
 */
type Tab = 'returning' | 'new';

export default function LoginPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only follow a same-site relative path (no open-redirect to //evil.com).
  const redirectParam = searchParams.get('redirect');
  const safeRedirect =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : `/${countryCode}/account`;

  const [tab, setTab] = useState<Tab>('returning');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authClient.login(formData.email, formData.password);
      router.push(safeRedirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-body text-gray-900 pb-32 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-6 pt-12 max-w-6xl flex items-center space-x-2 text-[11px] font-normal text-gray-500 mb-8">
        <Link href={`/${countryCode}`} className="hover:text-black transition-colors">Home</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-gray-900">Account</span>
      </nav>

      <main className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-5xl font-headline font-medium text-gray-900 mb-16 tracking-tight">
          Account
        </h1>

        {/* Tabs */}
        <div
          className="flex border-b border-gray-100 bg-[#fcfcfc] mb-12"
          role="tablist"
          aria-label="Account access"
        >
          {([
            { key: 'returning' as Tab, label: 'Returning Customer' },
            { key: 'new' as Tab, label: 'New Customer' },
          ]).map((t, i) => (
            <React.Fragment key={t.key}>
              {i === 1 && <div className="w-px bg-gray-100" aria-hidden="true" />}
              <button
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={tab === t.key}
                aria-controls={`panel-${t.key}`}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 py-4 text-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-black',
                  tab === t.key ? 'border-b-2 border-black bg-white' : 'hover:bg-white/60'
                )}
              >
                <span
                  className={cn(
                    'text-[11px] font-bold tracking-[0.2em] uppercase transition-colors',
                    tab === t.key ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {t.label}
                </span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Returning Customer panel */}
        {tab === 'returning' && (
          <div
            id="panel-returning"
            role="tabpanel"
            aria-labelledby="tab-returning"
            className="max-w-[420px] space-y-10"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-[12px] font-medium text-red-600" role="alert">{error}</p>
              )}

              <Button
                type="submit"
                variant="outline"
                disabled={submitting}
                className="w-full max-w-[200px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Login'}
              </Button>
            </form>

            <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-light italic">
              <Link href={`/${countryCode}/account/reset-password`} className="hover:text-black transition-colors underline underline-offset-4">Forgot your password?</Link>
              <span>or</span>
              <Link href={`/${countryCode}`} className="hover:text-black transition-colors underline underline-offset-4">Return to Store</Link>
            </div>

            <p className="text-[11px] text-gray-400 font-light italic">
              New here?{' '}
              <button type="button" onClick={() => setTab('new')} className="text-gray-700 underline underline-offset-4 hover:text-black transition-colors">
                Create an account
              </button>
            </p>
          </div>
        )}

        {/* New Customer panel */}
        {tab === 'new' && (
          <div
            id="panel-new"
            role="tabpanel"
            aria-labelledby="tab-new"
            className="max-w-[420px] space-y-10"
          >
            <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
              Register with us for a faster checkout, to track the status of your orders, access
              private allocations and more.
            </p>

            <Link href={`/${countryCode}/account/register`} className="block w-full max-w-[280px]">
              <Button className="w-full h-12 bg-[#262626] text-white hover:bg-black rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-xl">
                CREATE AN ACCOUNT
              </Button>
            </Link>

            <p className="text-[11px] text-gray-400 font-light italic">
              Already have an account?{' '}
              <button type="button" onClick={() => setTab('returning')} className="text-gray-700 underline underline-offset-4 hover:text-black transition-colors">
                Sign in
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
