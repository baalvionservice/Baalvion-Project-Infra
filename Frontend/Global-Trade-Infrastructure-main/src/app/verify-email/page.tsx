'use client';

/**
 * @file verify-email/page.tsx
 * @description Email-verification landing page. The verification email links here with `?token=`.
 * On mount it POSTs the token to the gateway (which forwards to auth-service); the token IS the
 * proof of ownership, so no session is required. Single-fire guarded against React StrictMode's
 * double-invoke so a one-time token is never spent twice.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailCheck, AlertCircle, ShieldQuestion } from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { publicAuthApi } from '@/lib/admin-api';
import { AuthShell } from '../accept-invite/_components/auth-shell';

type Status = 'verifying' | 'success' | 'error' | 'missing';

function describeVerifyError(code: string | undefined, message: string): string {
  switch (code) {
    case 'INVALID_TOKEN':
    case 'NOT_FOUND':
      return 'This verification link is invalid or has already been used.';
    case 'TOKEN_EXPIRED':
      return 'This verification link has expired. Sign in to request a new one.';
    default:
      return message || 'We could not verify your email. Please try again.';
  }
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'missing');
  const [message, setMessage] = useState<string>('');
  const firedRef = useRef(false);

  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true; // single-use token: never POST it twice (StrictMode guard)

    (async () => {
      try {
        await publicAuthApi.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        const e = err as Error & { code?: string };
        setMessage(describeVerifyError(e.code, e.message));
        setStatus('error');
      }
    })();
  }, [token]);

  const body = (() => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Verifying your email…</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <MailCheck className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-medium text-muted-foreground max-w-sm">
              Your email is verified. You can now sign in and access the full trade network.
            </p>
          </div>
        );
      case 'missing':
        return (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <ShieldQuestion className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground max-w-sm">
              This page expects a verification link. Open the most recent verification email and tap the button inside it.
            </p>
          </div>
        );
      case 'error':
      default:
        return (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium text-foreground max-w-sm">{message}</p>
          </div>
        );
    }
  })();

  return (
    <>
      <CardHeader className="space-y-4 pb-8 pt-10 text-center border-b bg-muted/10">
        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Email Verification</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
          Confirm Your Identity
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">{body}</CardContent>
      <CardFooter className="flex flex-col border-t bg-muted/30 pt-8 pb-8">
        <Link href={PATHS.LOGIN} className="w-full">
          <Button className="w-full h-14 font-black uppercase tracking-widest text-sm shadow-xl">
            {status === 'success' ? 'Proceed to Sign In' : 'Go to Sign In'}
          </Button>
        </Link>
      </CardFooter>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      brandHeadline={
        <>
          Confirm Your <br />Trade <br />Identity.
        </>
      }
      brandSubcopy="Email verification keeps your organization's access secure. Links are single-use and time-bound."
    >
      <Suspense
        fallback={
          <CardContent className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  );
}
