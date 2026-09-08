'use client';

import { usePathname } from 'next/navigation';
import { Button, Container } from '@/components/ui';
import { useIdentity } from '@/lib/auth/identity-context';
import { rememberReturnPath, useResendVerification } from '@/lib/auth/use-resend-verification';

/**
 * A standing note that an address has not been confirmed yet.
 *
 * Shown before somebody runs into the limit rather than only after, because being stopped
 * mid-sentence while writing to a stranger about your own family is a bad moment to
 * discover a rule. It states what still works — everything private — so it reads as a
 * pending step rather than a locked account.
 *
 * Only UNVERIFIED renders. UNKNOWN says nothing: a session issued before the platform
 * emitted the claim cannot be judged, and a warning drawn from an unknown would be a
 * guess presented as a fact.
 *
 * Deliberately not dismissible. A dismissed banner is a rule somebody has stopped seeing
 * and has not satisfied; the way to make it disappear is to confirm the address.
 */
export function VerificationNotice() {
  const { identity } = useIdentity();
  const pathname = usePathname();
  const { state, resend } = useResendVerification();

  if (identity?.emailVerification?.state !== 'UNVERIFIED') return null;
  // The confirmation screen is already about exactly this.
  if (pathname === '/verify-email') return null;

  return (
    <aside
      aria-labelledby="verify-notice-title"
      className="border-b border-line bg-accent-soft"
    >
      <Container className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="verify-notice-title" className="text-ui font-medium">
            Confirm your email address
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            {state === 'sent'
              ? 'If your address still needs confirming, a new link is on its way. It is good for 24 hours.'
              : 'You can write and edit privately in the meantime. Confirming lets you open your case to others, and lets us reach you if you lose access.'}
          </p>
        </div>

        {state !== 'sent' && (
          <Button
            variant="secondary"
            size="sm"
            loading={state === 'sending'}
            onClick={() => { rememberReturnPath(pathname); void resend(); }}
            className="shrink-0"
          >
            {state === 'failed' ? 'Try sending again' : 'Send the link again'}
          </Button>
        )}
      </Container>
    </aside>
  );
}
