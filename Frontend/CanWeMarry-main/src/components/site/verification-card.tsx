'use client';

import { usePathname } from 'next/navigation';
import { Button, Card, CardBody } from '@/components/ui';
import { rememberReturnPath, useResendVerification } from '@/lib/auth/use-resend-verification';

/**
 * The account-settings view of the same fact the shell banner shows.
 *
 * Three states, and all three are said out loud. UNKNOWN is the one worth being careful
 * about: it means this session predates the verification claim, so the honest line is that
 * we cannot tell right now — not a reassuring "confirmed" and not an alarming "not
 * confirmed", either of which would be an invention.
 */
export function VerificationCard({ state }: { state: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN' }) {
  const pathname = usePathname();
  const { state: resend, resend: send } = useResendVerification();

  if (state === 'VERIFIED') {
    return (
      <Card>
        <CardBody>
          <h2 className="heading text-base">Your email address is confirmed</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You can open a case to others, join communities and take part in discussions.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (state === 'UNKNOWN') {
    return (
      <Card>
        <CardBody>
          <h2 className="heading text-base">We cannot check your email address right now</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Signing out and back in will refresh this. Nothing about your account has changed.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <h2 className="heading text-base">Confirm your email address</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {resend === 'sent'
            ? 'If your address still needs confirming, a new link is on its way. It is good for 24 hours.'
            : 'We sent a link when you signed up. Until it is confirmed you can write and edit privately, but not open a case to others or take part in discussions.'}
        </p>
        {resend !== 'sent' && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              loading={resend === 'sending'}
              onClick={() => { rememberReturnPath(pathname); void send(); }}
            >
              {resend === 'failed' ? 'Try sending again' : 'Send the link again'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
