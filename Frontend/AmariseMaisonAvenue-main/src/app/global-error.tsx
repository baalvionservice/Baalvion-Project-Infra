'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Root-layout error boundary — the ONLY boundary that catches a failure in layout.tsx itself
// (src/app/error.tsx cannot, since it renders inside the layout). Must render its own <html>/
// <body>: the root layout that would normally provide them is exactly what just failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AmariseMaisonAvenue-main] Unhandled root layout error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          margin: 0,
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 2.6rem)', fontWeight: 800, margin: '0.5rem 0 0.75rem', lineHeight: 1.1 }}>
            The site failed to load
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Please try again. If this keeps happening, contact support.
          </p>
          <button
            onClick={() => reset()}
            style={{ background: '#4f46e5', color: '#fff', border: 0, borderRadius: 10, padding: '0.8rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
          {error?.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em' }}>REF: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
