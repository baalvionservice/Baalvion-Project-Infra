import type { ReactNode } from 'react';
import { ButtonLink, ErrorState } from '@/components/ui';
import type { ApiError } from '@/lib/api/client';

/**
 * Turns an API refusal into a readable message.
 *
 * The decision was made by the SERVER — this only translates the status. Anything that
 * decided access here, in a page component, would be advisory: someone who calls the
 * endpoint directly still meets the same 401 or 403.
 *
 * The refusal is an h2, not an h1: this always renders inside the /moderation or /admin
 * layout, which supplies the page title. Two h1s would give a screen-reader user two
 * competing page headings.
 */
export function StaffBoundary({ error, children }: { error: ApiError | null; children: ReactNode }) {
  if (!error) return <>{children}</>;

  if (error.status === 401) {
    return (
      <ErrorState
        as="h2"
        title="You are not signed in"
        message="This area needs a signed-in moderator or administrator account."
        action={<ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>}
      />
    );
  }

  if (error.status === 403) {
    return (
      <ErrorState
        as="h2"
        title="Not available to your account"
        message="Your account does not hold the permission this screen needs."
        action={<ButtonLink href="/" variant="secondary">Back to the site</ButtonLink>}
      />
    );
  }

  return <ErrorState as="h2" message={error.message} />;
}
