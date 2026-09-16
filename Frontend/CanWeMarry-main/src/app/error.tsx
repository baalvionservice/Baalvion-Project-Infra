'use client';

import { useEffect } from 'react';
import { Button, ButtonLink, Container, ErrorState } from '@/components/ui';

/**
 * The last-resort boundary. `digest` is the only detail Next exposes about a server-side
 * failure in production — the message itself is withheld, which is the behaviour we want.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[canwemarry] render error', error.digest ?? error.message); }, [error]);

  return (
    <Container className="py-24">
      <ErrorState
        title="Something went wrong"
        message="We could not show this page. Trying again often works; if it does not, the reference below helps us find what happened."
        requestId={error.digest}
        action={
          <div className="flex gap-3">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">Go to the home page</ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
