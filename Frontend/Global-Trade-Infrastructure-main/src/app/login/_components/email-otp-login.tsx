'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, KeyRound, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { safeInternalPath } from '@/lib/safe-redirect';
import { publicAuthApi } from '@/lib/admin-api';

type Step = 'trigger' | 'email' | 'code';

const INPUT_CLASS = 'h-14 pl-12 border-2 font-bold focus-visible:ring-primary/20 transition-all bg-muted/5 group-hover:bg-background';
const LABEL_CLASS = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1';

/**
 * Passwordless "one-time code" login for the institutional gateway. Requests a code, verifies it
 * (the gateway then sets the session cookies), and hard-navigates so the AppProvider rehydrates
 * identity from the cookies — mirroring the MFA-complete flow on this page.
 */
export function EmailOtpLogin() {
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
      const res = await publicAuthApi.requestEmailOtp(email.trim());
      const data = res?.data ?? (res as { sentTo?: string; resendAvailableInSeconds?: number });
      setSentTo(data?.sentTo || email.trim());
      setResendIn(data?.resendAvailableInSeconds || 60);
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
      await publicAuthApi.verifyEmailOtp(email.trim(), code.trim());
      // Session cookies are now set by the gateway — hard-navigate so AppProvider rehydrates.
      const rawRedirect = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect')
        : null;
      window.location.assign(rawRedirect ? safeInternalPath(rawRedirect, PATHS.DASHBOARD) : PATHS.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is incorrect or expired.');
      setBusy(false);
    }
  };

  if (step === 'trigger') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setStep('email')}
        className="w-full h-14 font-black uppercase tracking-widest text-sm border-2"
      >
        <Mail className="mr-2 h-5 w-5" />
        Email me a one-time code
      </Button>
    );
  }

  return (
    <div className="space-y-5 rounded-lg border-2 bg-muted/10 p-5">
      {step === 'email' ? (
        <>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Passwordless access — we&apos;ll email a one-time code.
          </p>
          <div className="space-y-3">
            <Label htmlFor="otp-email" className={LABEL_CLASS}>Corporate Identifier</Label>
            <div className="relative group">
              <Input
                id="otp-email"
                type="email"
                autoFocus
                placeholder="institution@email.gov"
                className={INPUT_CLASS}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) sendCode(); }}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button type="button" disabled={busy || !email.trim()} onClick={sendCode} className="flex-1 h-14 font-black uppercase tracking-widest text-sm">
              {busy ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Send Code
            </Button>
            <Button type="button" variant="ghost" className="h-14" onClick={() => setStep('trigger')}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={() => { setStep('email'); setError(null); }} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Different email
          </button>
          <p className="text-xs font-bold text-muted-foreground">
            Enter the code sent to <span className="text-foreground">{sentTo}</span>.
          </p>
          <div className="space-y-3">
            <Label htmlFor="otp-code" className={LABEL_CLASS}>One-Time Code</Label>
            <div className="relative group">
              <Input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                placeholder="123456"
                className={`${INPUT_CLASS} text-center text-xl tracking-[0.5em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter' && code.trim().length >= 4) verifyCode(); }}
              />
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <Button type="button" disabled={busy || code.trim().length < 4} onClick={verifyCode} className="w-full h-16 font-black uppercase tracking-widest text-base shadow-xl">
            {busy ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <KeyRound className="mr-2 h-6 w-6" />}
            Authorize Session
          </Button>
          <button
            type="button"
            disabled={resendIn > 0 || busy}
            onClick={sendCode}
            className="w-full text-center text-xs font-bold uppercase tracking-widest text-primary hover:underline disabled:text-muted-foreground disabled:no-underline transition-colors"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </button>
        </>
      )}
    </div>
  );
}

export default EmailOtpLogin;
