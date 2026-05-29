'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth';

/**
 * Account login — REAL authentication against the Baalvion identity gateway.
 * (Replaces the prior mock that matched emails against ADMIN_ACCOUNTS with no password check
 * and routed by a frontend-only role.)
 */
export default function LoginPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authClient.login(formData.email, formData.password);
      router.push(`/${countryCode}/account`);
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

        <div className="flex border-b border-gray-100 bg-[#fcfcfc] mb-12">
          <div className="flex-1 py-4 text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">Returning Customer</span>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 py-4 text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">New Customer</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row relative">
          {/* Returning Customer — real login */}
          <div className="flex-1 pr-0 md:pr-20 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-8 max-w-[400px]">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
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

            {/* Divider */}
            <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center">
              <div className="w-px flex-1 bg-gray-100" />
              <div className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center my-12 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-gray-300 italic">or</span>
              </div>
              <div className="w-px flex-1 bg-gray-100" />
            </div>

            {/* New Customer */}
            <div className="flex-1 pl-0 md:pl-20 py-12 md:py-0 flex flex-col items-center justify-start text-center space-y-10">
              <div className="space-y-4 max-w-[300px]">
                <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
                  Register with us for a faster checkout, to track the status of your order and more.
                </p>
              </div>

              <Link href={`/${countryCode}/account/register`} className="w-full max-w-[280px]">
                <Button
                  className="w-full h-12 bg-[#262626] text-white hover:bg-black rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-xl"
                >
                  CREATE AN ACCOUNT
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
