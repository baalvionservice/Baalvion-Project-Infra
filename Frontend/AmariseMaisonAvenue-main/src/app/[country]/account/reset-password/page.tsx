'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth';

/**
 * Password reset — wired to the Baalvion identity gateway via the same-origin
 * `/auth-bff` proxy (see src/lib/auth.ts).
 *
 * Two modes, chosen by the presence of a `?token=` query param (the emailed
 * reset link is `…/reset-password?token=<token>`):
 *   - REQUEST  (no token): collect the email → POST /forgot-password.
 *               The backend always returns a neutral message — it never reveals
 *               whether the address is registered.
 *   - CONFIRM  (token present): collect a new password → POST /reset-password.
 *               On success every session is revoked server-side, so the user
 *               re-authenticates on the login page.
 */

const MIN_PASSWORD_LENGTH = 8;
const INPUT_CLASS =
  'h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all';
const LABEL_CLASS = 'text-[11px] font-bold tracking-widest text-gray-900 uppercase';

function ResetPasswordInner() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';
  const isConfirmMode = token.length > 0;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const message = await authClient.forgotPassword(email);
      setNotice(message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the reset email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authClient.resetPassword(token, password);
      setDone(true);
      setNotice('Your password has been reset. Redirecting you to sign in…');
      setTimeout(() => router.push(`/${countryCode}/account/login`), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const heading = isConfirmMode ? 'Set A New Password' : 'Reset Your Password';

  return (
    <div className="bg-white min-h-screen font-body text-gray-900 pb-32 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-6 pt-12 max-w-6xl flex items-center space-x-2 text-[11px] font-normal text-gray-500 mb-8">
        <Link href={`/${countryCode}`} className="hover:text-black transition-colors">Home</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <Link href={`/${countryCode}/account/login`} className="hover:text-black transition-colors">Account</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-gray-900">Reset Password</span>
      </nav>

      <main className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-5xl font-headline font-medium text-gray-900 mb-16 tracking-tight">
          {heading}
        </h1>

        <div className="w-full max-w-[450px] space-y-10">
          {/* REQUEST MODE — success confirmation */}
          {!isConfirmMode && done && (
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[13px] text-gray-700 font-light leading-relaxed">{notice}</p>
              </div>
              <p className="text-[12px] text-gray-500 font-light italic leading-relaxed">
                Open the link in that email to choose a new password. The link expires in one hour.
              </p>
              <Link href={`/${countryCode}/account/login`} className="inline-block">
                <Button
                  variant="outline"
                  className="h-12 px-8 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* REQUEST MODE — email form */}
          {!isConfirmMode && !done && (
            <>
              <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
                Enter the email address associated with your account and we&apos;ll send you a link
                to reset your password.
              </p>

              <form onSubmit={handleRequest} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className={LABEL_CLASS}>
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                {error && (
                  <p className="text-[12px] font-medium text-red-600" role="alert">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  disabled={submitting}
                  className="w-full max-w-[240px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="text-[11px] text-gray-500 font-light italic">
                Remembered it?{' '}
                <Link href={`/${countryCode}/account/login`} className="text-black underline underline-offset-4">Sign in</Link>
              </p>
            </>
          )}

          {/* CONFIRM MODE — success */}
          {isConfirmMode && done && (
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[13px] text-gray-700 font-light leading-relaxed">{notice}</p>
            </div>
          )}

          {/* CONFIRM MODE — new password form */}
          {isConfirmMode && !done && (
            <>
              <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
                Choose a new password for your account. It must be at least {MIN_PASSWORD_LENGTH} characters.
              </p>

              <form onSubmit={handleConfirm} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className={LABEL_CLASS}>
                      New Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={INPUT_CLASS}
                      minLength={MIN_PASSWORD_LENGTH}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className={LABEL_CLASS}>
                      Confirm New Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={INPUT_CLASS}
                      minLength={MIN_PASSWORD_LENGTH}
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
                  className="w-full max-w-[240px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </Button>
              </form>

              <p className="text-[11px] text-gray-500 font-light italic">
                Need a new link?{' '}
                <Link href={`/${countryCode}/account/reset-password`} className="text-black underline underline-offset-4">Request another</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white min-h-screen" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
