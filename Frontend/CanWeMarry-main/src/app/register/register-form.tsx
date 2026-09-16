'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ErrorState, Field, Input } from '@/components/ui';
import { session } from '@/lib/auth/session';
import { useIdentity } from '@/lib/auth/identity-context';

const BFF = '/auth-bff';

/**
 * Registration, handled by the platform identity service through the BFF.
 *
 * It asks for an email address and a password and nothing else. A platform about family
 * opposition has no business collecting a legal name, a date of birth or a phone number at
 * sign-up — everything else about a person is optional and lives on their profile, which
 * starts undiscoverable.
 */
export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useIdentity();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const confirm = String(form.get('confirm'));

    if (password !== confirm) {
      setFieldErrors({ confirm: 'Those two passwords do not match.' });
      setBusy(false);
      return;
    }
    if (password.length < 12) {
      setFieldErrors({ password: 'Use at least 12 characters. A short phrase you can remember beats a short jumble.' });
      setBusy(false);
      return;
    }

    try {
      const response = await fetch(`${BFF}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? 'We could not create that account. Please try again.');
        setBusy(false);
        return;
      }

      // Registering does not necessarily establish a session; sign in explicitly so the
      // person lands signed in rather than on a login form they just filled in.
      await session.login(email, password).catch(() => undefined);
      await refresh();
      // New accounts land on onboarding, where the expectations are set before anything
      // is written. Settings is one click away from there.
      router.push('/welcome');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <ErrorState title="Could not create your account" message={error} />}

      <Field label="Email address" required hint="Used only to sign in and to recover your account.">
        {({ id, describedBy }) => (
          <Input id={id} name="email" type="email" autoComplete="email" required aria-describedby={describedBy} autoFocus />
        )}
      </Field>

      <Field label="Password" required error={fieldErrors.password}
        hint="At least 12 characters.">
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="password" type="password" autoComplete="new-password" required
            aria-describedby={describedBy} invalid={invalid} minLength={12} />
        )}
      </Field>

      <Field label="Confirm password" required error={fieldErrors.confirm}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="confirm" type="password" autoComplete="new-password" required
            aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth loading={busy} disabled={busy}>
        {busy ? 'Creating your account…' : 'Create account'}
      </Button>

      <p className="text-xs leading-relaxed text-muted-2">
        We ask for nothing else. A display name, a bio and a location are all optional, and your
        profile is not discoverable until you turn that on.
      </p>
    </form>
  );
}
