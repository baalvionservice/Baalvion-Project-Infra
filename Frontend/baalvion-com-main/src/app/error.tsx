'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';
import { ROUTES } from '@/lib/content';

/**
 * Route-level error boundary. Says what the reader can do next; the stack trace
 * goes to the console for the browser sweep, never onto the page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark className="text-foreground" />
      <div className="space-y-3">
        <p className="mono-label text-accent">Error</p>
        <h1 className="running-head">This page could not be loaded.</h1>
        <p className="body">
          The fault has been recorded. Try again — if it persists, the rest of the site is unaffected.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
          <span aria-hidden="true">→</span>
        </button>
        <Link href={ROUTES.contact} className="mono-caption transition-colors duration-200 hover:text-accent">
          Report the problem
        </Link>
      </div>

      {error.digest && <p className="mono-caption opacity-60">Reference {error.digest}</p>}
    </main>
  );
}
