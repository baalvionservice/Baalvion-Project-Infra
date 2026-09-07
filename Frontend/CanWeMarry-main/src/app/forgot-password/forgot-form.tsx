'use client';

import { useState } from 'react';
import { Button, Card, CardBody, ErrorState, Field, Input } from '@/components/ui';

const BFF = '/auth-bff';

/**
 * Password reset, handled by the platform identity service.
 *
 * The response is the SAME whether the address is known or not, and the copy says so
 * plainly. Anything that distinguished the two would turn this form into a way to test
 * whether a particular person has an account here — which, on a platform about family
 * opposition, is exactly the lookup a hostile relative would want.
 */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null);

    const email = String(new FormData(event.currentTarget).get('email'));
    try {
      await fetch(`${BFF}/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Success regardless of the response: the endpoint intentionally does not say
      // whether the address exists, and neither does this page.
      setSent(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardBody>
          <h2 className="heading text-base">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            If that address has an account, a reset link is on its way. We do not say whether it
            does — that would let anyone check who has an account here.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <ErrorState message={error} />}

      <Field label="Email address" required hint="We will send a reset link if the address has an account.">
        {({ id, describedBy }) => (
          <Input id={id} name="email" type="email" autoComplete="email" required aria-describedby={describedBy} autoFocus />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth loading={busy} disabled={busy}>
        {busy ? 'Sending…' : 'Send a reset link'}
      </Button>
    </form>
  );
}
