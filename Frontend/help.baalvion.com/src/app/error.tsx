'use client';

import { useEffect } from 'react';
import Link from 'next/link';

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-bold text-on-accent">
        B
      </span>
      <div className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-muted-2">Error</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          This page didn&rsquo;t load.
        </h1>
        <p className="max-w-sm text-muted">
          Something went wrong on our side. Try again, or head back to the Help Center home.
        </p>
      </div>
      {error.digest && (
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-2">
          Ref {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to Help Center home
        </Link>
      </div>
    </main>
  );
}
