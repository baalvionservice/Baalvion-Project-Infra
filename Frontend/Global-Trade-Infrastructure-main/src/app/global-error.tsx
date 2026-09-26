'use client';

import { useEffect } from 'react';

// Replaces the whole document when the root layout itself throws, so it owns
// <html>/<body> and cannot rely on globals.css having loaded — the palette below
// is the app's own dark institutional theme, restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global-Trade-Infrastructure-main] Root layout error:', error);
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
          background: '#05080f',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        <main style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.4em',
              color: '#3b82f6',
            }}
          >
            System fault
          </p>
          <h1
            style={{
              margin: '0.75rem 0 0.75rem',
              fontSize: 'clamp(1.9rem, 1rem + 3vw, 2.6rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
            }}
          >
            Network unavailable
          </h1>
          <p style={{ margin: '0 0 2rem', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500 }}>
            The platform shell failed to load. Nothing has been lost — retry, or return to the
            homepage.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#3b82f6',
                color: '#050a18',
                border: 0,
                borderRadius: 12,
                padding: '0.85rem 2rem',
                fontSize: 10,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: 'transparent',
                color: '#f8fafc',
                border: '1px solid #141f38',
                borderRadius: 12,
                padding: '0.85rem 2rem',
                fontSize: 10,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 28, fontSize: 11, color: '#475569', letterSpacing: '0.1em' }}>
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
