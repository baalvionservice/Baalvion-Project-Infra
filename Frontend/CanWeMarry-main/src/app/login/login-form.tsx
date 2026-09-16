'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Field, Input, ErrorState } from '@/components/ui';
import { session } from '@/lib/auth/session';
import { useIdentity } from '@/lib/auth/identity-context';

/**
 * Sign-in goes to the platform's auth-gateway, which sets HttpOnly cookies and returns no
 * token in the body. Nothing on this page ever holds a credential — which is why there is
 * no "remember me" writing anything to storage: the session lives in the cookie or nowhere.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useIdentity();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only a same-site path is honoured, so a crafted ?next=https://… cannot bounce someone
  // off this site with their session freshly established.
  const raw = params.get('next') ?? '';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/my-cases';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      await session.login(String(form.get('email')), String(form.get('password')));
      await refresh();
      router.push(next);
      router.refresh();
    } catch (e) {
      // Deliberately the same message whether the address is unknown or the password is
      // wrong: distinguishing them tells an attacker which accounts exist.
      const message = e instanceof Error && e.message && !/^\d+$/.test(e.message)
        ? e.message
        : 'Those details were not recognised.';
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <ErrorState title="Could not sign in" message={error} />}

      <Field label="Email address" required>
        {({ id, describedBy }) => (
          <Input id={id} name="email" type="email" autoComplete="email" required
            aria-describedby={describedBy} autoFocus />
        )}
      </Field>

      <Field label="Password" required>
        {({ id, describedBy }) => (
          <Input id={id} name="password" type="password" autoComplete="current-password" required
            aria-describedby={describedBy} />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth loading={submitting} disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
