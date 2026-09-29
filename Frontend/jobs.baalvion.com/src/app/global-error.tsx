'use client';

import { useEffect } from 'react';

// Replaces the whole document when the root layout throws, so it owns <html>/<body>
// and cannot assume globals.css loaded — the black-on-white brand and the #ff4713
// accent are restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Baalvion-Jobs-Portal-main] Root layout error:', error);
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
          background: '#ffffff',
          color: '#000000',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 520, width: '100%' }}>
          <div
            style={{
              height: 6,
              width: 64,
              background: '#ff4713',
              marginBottom: 28,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#525252',
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 1rem + 3vw, 2.6rem)',
              fontWeight: 800,
              margin: '0.5rem 0 0.75rem',
              lineHeight: 1.1,
            }}
          >
            We hit an unexpected error
          </h1>
          <p
            style={{ color: '#525252', lineHeight: 1.6, margin: '0 0 1.75rem' }}
          >
            The page failed to render. Your data is safe — you can retry, or
            return to the homepage.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 0,
                borderRadius: 6,
                padding: '0.8rem 1.5rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                background: 'transparent',
                color: '#000000',
                border: '1px solid #d6d6d6',
                borderRadius: 6,
                padding: '0.8rem 1.5rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to homepage
            </a>
          </div>
          {error?.digest ? (
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                color: '#8a8a8a',
                letterSpacing: '0.1em',
              }}
            >
              REF: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
