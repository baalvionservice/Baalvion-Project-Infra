'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// The trace belongs in the console, not in front of a reader.
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
    <div className="mx-auto flex min-h-[60vh] max-w-[1584px] flex-col justify-center px-6 py-24">
      <p className="label flex items-center gap-3 text-[hsl(var(--muted-ink))]">
        <span aria-hidden className="h-px w-8 bg-[hsl(var(--accent))]" />
        Error
      </p>
      <h1 className="display-sm mt-8">This page could not be loaded.</h1>
      <p className="mt-6 max-w-xl text-[18px] font-light leading-relaxed text-[hsl(var(--muted-ink))]">
        The index itself is unaffected. Try again, or return to the product list.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center gap-6 bg-[hsl(var(--accent))] py-3.5 pl-5 pr-4 text-[15px] text-white transition-colors hover:brightness-90"
        >
          Try again
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-6 border border-[hsl(var(--line))] py-3.5 pl-5 pr-4 text-[15px] transition-colors hover:bg-[hsl(var(--paper-alt))]"
        >
          All products
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-[13px] text-[hsl(var(--muted-ink))]">REF: {error.digest}</p>
      )}
    </div>
  );
}
