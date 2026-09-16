'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ctmAuthClient } from '@/lib/ctm-api-client';

type Step = 'trigger' | 'email' | 'code';

/**
 * Passwordless "Email me a login code" flow. Requests a one-time code, then verifies it via the
 * auth context (`loginWithOtp`), which bootstraps the session — the context redirect guard then
 * routes the user. Collapsed to a single button by default to keep the login form compact.
 */
export function EmailOtpLogin() {
  const { loginWithOtp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('trigger');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const sendCode = async () => {
    setBusy(true);
    try {
      const res = await ctmAuthClient.post<{ sentTo?: string; resendAvailableInSeconds?: number }>(
        '/email/otp/request',
        { email: email.trim() },
      );
      setSentTo(res?.sentTo || email.trim());
      setResendIn(res?.resendAvailableInSeconds || 60);
      setStep('code');
      toast({ title: 'Code sent', description: `Check your inbox for the login code.` });
    } catch (err: unknown) {
      toast({
        title: "Couldn't send code",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    const result = await loginWithOtp(email.trim(), code.trim());
    if (!result.success) {
      toast({
        title: 'Invalid code',
        description: result.message || 'That code is incorrect or expired.',
        variant: 'destructive',
      });
      setBusy(false);
    }
    // On success the auth context handles redirection.
  };

  if (step === 'trigger') {
    return (
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setStep('email')}>
        <Mail className="mr-2 h-4 w-4" />
        Email me a login code
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      {step === 'email' ? (
        <>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send a one-time login code — no password needed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="otp-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="otp-email"
                type="email"
                autoFocus
                placeholder="you@example.com"
                className="h-11 pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) sendCode(); }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" className="h-11 flex-1 font-semibold" disabled={busy || !email.trim()} onClick={sendCode}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send code
            </Button>
            <Button type="button" variant="ghost" className="h-11" onClick={() => setStep('trigger')}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
          </button>
          <div className="space-y-2">
            <Label htmlFor="otp-code">Enter the code sent to {sentTo}</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                placeholder="123456"
                className="h-11 pl-9 text-center font-mono tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter' && code.trim().length >= 4) verifyCode(); }}
              />
            </div>
          </div>
          <Button type="button" size="lg" className="h-11 w-full font-semibold" disabled={busy || code.trim().length < 4} onClick={verifyCode}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify &amp; sign in
          </Button>
          <div className="text-center">
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={sendCode}
              className="text-sm text-primary underline-offset-4 transition-colors hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default EmailOtpLogin;
