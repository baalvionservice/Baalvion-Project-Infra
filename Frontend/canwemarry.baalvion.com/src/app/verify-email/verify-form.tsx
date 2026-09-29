'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ButtonLink, Card, CardBody, ErrorState, LoadingState } from '@/components/ui';
import { takeReturnPath } from '@/lib/auth/use-resend-verification';
import { useIdentity } from '@/lib/auth/identity-context';

const BFF = '/auth-bff';

type Result = 'pending' | 'ok' | 'failed' | 'missing';

/**
 * Confirming an email address.
 *
 * The token is handed to the platform's identity service, which owns the whole flow — this
 * page is the landing point, not a second implementation of it. The result is reported
 * plainly: a link that has expired or been used says so, rather than failing into a generic
 * error that leaves somebody unsure whether their account works.
 */
export function VerifyEmailForm() {
  const { refresh } = useIdentity();
  const params = useSearchParams();
  const token = params.get('token');
  const [result, setResult] = useState<Result>(token ? 'pending' : 'missing');
  const [message, setMessage] = useState<string | null>(null);
  // Read once, on mount, and cleared as it is read — the page it names was stored before
  // the person left for their inbox. Absent when the link is opened on another device,
  // which is why it only ever ADDS a button rather than replacing the usual ones.
  const [returnPath] = useState<string | null>(() => (typeof window === 'undefined' ? null : takeReturnPath()));

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`${BFF}/auth/verify-email`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        if (response.ok) {
          setResult('ok');
          // The access token was minted before the address was confirmed and still says so.
          // Rotating it first means the app — and the standing notice in the shell — reflect
          // the new state on this page rather than at some later, arbitrary refresh.
          await fetch(`${BFF}/auth/refresh`, { method: 'POST', credentials: 'include' }).catch(() => {});
          if (!cancelled) await refresh();
          return;
        }
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error?.message ?? null);
        setResult('failed');
      } catch {
        if (!cancelled) { setMessage('We could not reach the server.'); setResult('failed'); }
      }
    })();

    return () => { cancelled = true; };
  }, [token, refresh]);

  if (result === 'missing') {
    return (
      <ErrorState
        title="This link is incomplete"
        message="Open the link from your email exactly as it was sent — it carries a code this page needs."
        action={<ButtonLink href="/" variant="secondary">Go to the home page</ButtonLink>}
      />
    );
  }

  if (result === 'pending') return <LoadingState label="Confirming your email address" rows={1} />;

  if (result === 'failed') {
    return (
      <ErrorState
        title="We could not confirm that link"
        message={message ?? 'The link may have expired or already been used. Signing in and asking for a new one will send a fresh link.'}
        action={<ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>}
      />
    );
  }

  return (
    <Card>
      <CardBody>
        <h2 className="heading text-base">Your email address is confirmed</h2>
        <p className="mt-2 text-ui leading-relaxed text-muted">
          Thank you. You can carry on where you left off.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {returnPath && <ButtonLink href={returnPath}>Continue where you left off</ButtonLink>}
          <ButtonLink href="/my-cases" variant={returnPath ? 'secondary' : 'primary'}>Go to your cases</ButtonLink>
          <ButtonLink href="/welcome" variant="secondary">Read the introduction</ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}
