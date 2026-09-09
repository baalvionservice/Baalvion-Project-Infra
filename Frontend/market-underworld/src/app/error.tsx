"use client"

import React, { useEffect } from 'react';
import Link from 'next/link';

// Route-segment error boundary. Uses only the global stylesheet's own classes
// and no context hooks, so it still renders when the failure came from a
// provider. The stack goes to the console, never to the page.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[market-underworld] Unhandled page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0C0F] flex items-center justify-center px-4 sm:px-6 py-24">
      <div className="mu-card rounded-lg max-w-lg w-full p-8 sm:p-10 text-center">
        <span className="text-[10px] sm:text-[12px] font-bold text-[#EF4444] uppercase tracking-[0.2em]">
          Connection fault
        </span>

        <h1 className="mt-4 text-[28px] sm:text-[36px] font-bold leading-[1.1] tracking-tight text-white">
          This page didn&apos;t load
        </h1>
        <p className="mt-4 text-[#C8CDD8] text-base leading-relaxed">
          Something failed while rendering. Nothing you submitted was lost — retry, or head back to
          the homepage.
        </p>

        {error.digest && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-[#6B7280]">
            Ref: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary h-11 px-6 text-[14px] rounded-md w-full sm:w-auto"
          >
            Try again
          </button>
          <Link
            href="/"
            className="btn-secondary h-11 px-6 text-[14px] rounded-md w-full sm:w-auto inline-flex items-center justify-center"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
