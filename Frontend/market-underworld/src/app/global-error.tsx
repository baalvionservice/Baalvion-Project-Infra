"use client"

import React, { useEffect } from 'react';

// Root error boundary — replaces the document, so the Tailwind build and the
// webfonts may never have loaded. Brand values are inlined literally.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[market-underworld] Unhandled application error:', error);
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
          padding: '1.5rem',
          background: '#0B0C0F',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            background: '#111318',
            border: '1px solid #252A33',
            borderRadius: '0.5rem',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#EF4444',
            }}
          >
            Connection fault
          </p>
          <h1
            style={{
              margin: '1rem 0 0',
              fontSize: 'clamp(1.75rem, 1rem + 3vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            This page didn&apos;t load
          </h1>
          <p style={{ margin: '1rem 0 0', color: '#C8CDD8', lineHeight: 1.6 }}>
            Something failed while rendering. Nothing you submitted was lost — retry, or head back
            to the homepage.
          </p>

          {error.digest && (
            <p
              style={{
                margin: '1.5rem 0 0',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.6875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              Ref: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                height: '2.75rem',
                padding: '0 1.5rem',
                border: 0,
                borderRadius: '0.375rem',
                background: '#39FF14',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* Full page load, not <Link>: this boundary unmounts the router
                along with the rest of the tree. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '2.75rem',
                padding: '0 1.5rem',
                border: '1px solid #252A33',
                borderRadius: '0.375rem',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
