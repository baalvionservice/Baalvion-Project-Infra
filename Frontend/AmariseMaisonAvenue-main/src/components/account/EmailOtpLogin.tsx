'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth';

type Step = 'trigger' | 'email' | 'code';

/**
 * Passwordless "Email me a login code" flow for the storefront login. Two steps — request a code
 * for an email, then verify it — then it sets the session (same path as password login) and
 * redirects. Styled to match the account login (editorial, rounded-none, uppercase).
 */
export function EmailOtpLogin({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('trigger');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const sendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.emailOtpRequest(email.trim());
      setSentTo(res.sentTo);
      setResendIn(res.resendAvailableInSeconds || 60);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    setBusy(true);
    try {
      await authClient.emailOtpVerify(email.trim(), code.trim());
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is incorrect or expired.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'trigger') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setStep('email')}
        className="w-full max-w-[280px] h-12 border-gray-300 text-gray-900 hover:bg-black hover:text-white hover:border-black rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all"
      >
        Email me a login code
      </Button>
    );
  }

  return (
    <div className="max-w-[420px] space-y-6 border-t border-gray-100 pt-8">
      {step === 'email' ? (
        <>
          <p className="text-[12px] text-gray-500 font-light italic leading-relaxed">
            Enter your email and we&apos;ll send a one-time login code — no password needed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="otp-email" className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
              Email Address
            </Label>
            <Input
              id="otp-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) sendCode(); }}
              className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
            />
          </div>
          {error && <p className="text-[12px] font-medium text-red-600" role="alert">{error}</p>}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !email.trim()}
              onClick={sendCode}
              className="w-full max-w-[200px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send Code'}
            </Button>
            <button type="button" onClick={() => setStep('trigger')} className="text-[11px] text-gray-500 hover:text-black underline underline-offset-4 transition-colors">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={() => { setStep('email'); setError(null); }} className="text-[11px] text-gray-500 hover:text-black underline underline-offset-4 transition-colors">
            Use a different email
          </button>
          <p className="text-[12px] text-gray-500 font-light italic leading-relaxed">
            Enter the 6-digit code sent to <span className="text-gray-900 not-italic font-medium">{sentTo}</span>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="otp-code" className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
              Login Code
            </Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter' && code.trim().length >= 4) verifyCode(); }}
              className="h-12 rounded-none border-gray-200 bg-white text-lg font-light tracking-[0.4em] text-center focus:ring-0 focus:border-black transition-all"
            />
          </div>
          {error && <p className="text-[12px] font-medium text-red-600" role="alert">{error}</p>}
          <Button
            type="button"
            variant="outline"
            disabled={busy || code.trim().length < 4}
            onClick={verifyCode}
            className="w-full max-w-[200px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Sign In'}
          </Button>
          <button
            type="button"
            disabled={resendIn > 0 || busy}
            onClick={sendCode}
            className="block text-[11px] text-gray-500 hover:text-black underline underline-offset-4 transition-colors disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </button>
        </>
      )}
    </div>
  );
}

export default EmailOtpLogin;
