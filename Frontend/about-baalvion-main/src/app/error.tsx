"use client";

import { useEffect } from "react";

/**
 * Route-segment error boundary. Renders when a server component (e.g. the home
 * page) throws because the CMS is unreachable. Unlike the old inline "maintenance"
 * return, this is never cached as a 200 — and it auto-retries: `reset()` re-runs
 * the failed segment, so the moment the CMS recovers the real content appears
 * without a manual refresh.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for server/observability; auto-retry shortly in case it was transient.
    console.error("Page render failed:", error);
    const t = setTimeout(() => reset(), 4000);
    return () => clearTimeout(t);
  }, [error, reset]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Service Temporarily Unavailable
        </h1>
        <p className="text-gray-600 mb-6">
          We&apos;re reconnecting to the Baalvion content service. This page will
          retry automatically.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Retry now
        </button>
      </div>
    </main>
  );
}
