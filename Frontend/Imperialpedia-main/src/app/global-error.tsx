'use client';

import React, { useEffect } from 'react';

/**
 * Root-level error boundary. Replaces the whole document, so it cannot rely on
 * the layout, the Tailwind build or the webfonts having loaded — everything
 * here is inline, using the editorial palette's literal values.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
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
          padding: '2rem',
          background: '#ffffff',
          color: '#212121',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 0 0.75rem',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.012em',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 1.75rem', fontSize: '1.0625rem', lineHeight: 1.6, color: '#525252' }}>
            Imperialpedia hit an unexpected error. It&apos;s likely temporary — try again, or head
            back to the homepage.
          </p>

          {error.digest && (
            <p
              style={{
                margin: '0 0 1.75rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.8125rem',
                color: '#525252',
              }}
            >
              Error reference: {error.digest}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minWidth: '11.25rem',
                padding: '0.75rem 2rem',
                border: 0,
                borderRadius: '0.25rem',
                background: '#1d4fc4',
                color: '#ffffff',
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                minWidth: '11.25rem',
                padding: '0.75rem 2rem',
                border: '1px solid #e3e3e3',
                borderRadius: '0.25rem',
                color: '#212121',
                fontSize: '0.9375rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to Homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
