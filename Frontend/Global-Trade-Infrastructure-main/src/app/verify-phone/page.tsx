'use client';

/**
 * @file verify-phone/page.tsx
 * @description Post-signup phone verification via SMS OTP. Authenticated — reachable only with the
 * session the gateway established at registration. Calls the auth-service phone OTP endpoints
 * through the gateway's /auth/svc/* passthrough (apiClient adds the CSRF header). Verification is
 * optional to proceed: users can skip to the dashboard and verify later.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, ShieldCheck, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { phoneApi } from '@/lib/admin-api';
import { AuthShell } from '../accept-invite/_components/auth-shell';
import { AuthField, AuthError, AuthSuccess } from '../accept-invite/_components/auth-fields';

type Phase = 'request' | 'verify' | 'done';

export default function VerifyPhonePage() {
  const [phase, setPhase] = useState<Phase>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await phoneApi.requestOtp(phone.trim() || undefined);
      if (!res.success || !res.data) {
        setError(res.error?.message || 'Could not send a code. Check the number and try again.');
        return;
      }
      setSentTo(res.data.sentTo);
      setCooldown(res.data.resendAvailableInSeconds || 60);
      setPhase('verify');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    if (!/^[0-9]{4,8}$/.test(code.trim())) {
      setError('Enter the numeric code from the SMS.');
      return;
    }
    setBusy(true);
    try {
      const res = await phoneApi.verifyOtp(code.trim());
      if (!res.success || !res.data) {
        setError(res.error?.message || 'Incorrect or expired code.');
        return;
      }
      setPhase('done');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      brandHeadline={
        <>
          Secure Your <br />Account With <br />Your Phone.
        </>
      }
      brandSubcopy="A verified phone protects sign-in and high-value trade actions. We'll text you a one-time code."
    >
      <CardHeader className="space-y-4 pb-8 pt-10 text-center border-b bg-muted/10">
        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Verify Phone</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          One-Time SMS Code
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 pt-8">
        {phase === 'request' && (
          <div className="space-y-6">
            <AuthField
              id="phone"
              name="phone"
              type="tel"
              label="Mobile Number"
              placeholder="+1 555 0100"
              autoComplete="tel"
              value={phone}
              onChange={setPhone}
              disabled={busy}
              autoFocus
              icon={Phone}
            />
            <p className="text-[10px] text-muted-foreground ml-1">
              Use the number you registered with, or enter a new one to set it.
            </p>
            <AuthError>{error}</AuthError>
            <Button onClick={sendCode} className="w-full h-16 font-black uppercase tracking-widest text-base shadow-xl" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
              Send Code
            </Button>
          </div>
        )}

        {phase === 'verify' && (
          <div className="space-y-6">
            <AuthSuccess>{sentTo ? `Code sent to ${sentTo}.` : 'Code sent.'}</AuthSuccess>
            <AuthField
              id="code"
              name="code"
              type="text"
              label="Verification Code"
              placeholder="123456"
              autoComplete="one-time-code"
              value={code}
              onChange={(v) => setCode(v.replace(/[^0-9]/g, ''))}
              disabled={busy}
              autoFocus
              icon={MessageSquare}
            />
            <AuthError>{error}</AuthError>
            <Button onClick={verifyCode} className="w-full h-16 font-black uppercase tracking-widest text-base shadow-xl" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <ShieldCheck className="mr-2 h-6 w-6" />}
              Verify
            </Button>
            <button
              type="button"
              onClick={sendCode}
              disabled={busy || cooldown > 0}
              className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-medium text-muted-foreground max-w-sm">
              Your phone number is verified. Your account is fully secured.
            </p>
            <Link href={PATHS.DASHBOARD} className="w-full pt-2">
              <Button className="w-full h-14 font-black uppercase tracking-widest text-sm shadow-xl">
                Continue to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </CardContent>

      {phase !== 'done' && (
        <CardFooter className="flex flex-col border-t bg-muted/30 pt-8 pb-8">
          <Link
            href={PATHS.DASHBOARD}
            className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
          >
            Skip for now
          </Link>
        </CardFooter>
      )}
    </AuthShell>
  );
}
