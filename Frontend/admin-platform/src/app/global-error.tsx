'use client';

import { useEffect } from 'react';

// Replaces the whole document when the root layout throws, so it owns <html>/<body>
// and cannot assume globals.css loaded — the console's palette is restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin-platform] Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          background: '#f8fafc',
          color: '#020817',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '2.5rem 2rem',
          }}
        >
          <p
            style={{
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#64748b',
              margin: 0,
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.6rem, 1rem + 2.5vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0.5rem 0 0.75rem',
              lineHeight: 1.15,
            }}
          >
            The console failed to load
          </h1>
          <p style={{ color: '#64748b', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Nothing was changed. Retry, or go back to the dashboard.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#2563eb',
                color: '#f8fafc',
                border: 0,
                borderRadius: 8,
                padding: '0.65rem 1.25rem',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                background: 'transparent',
                color: '#020817',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '0.65rem 1.25rem',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Go to dashboard
            </a>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em' }}>
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
