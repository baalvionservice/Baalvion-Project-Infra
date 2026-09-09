'use client';

import { useEffect } from 'react';

// Root error boundary. It replaces the document, so the token stylesheet and
// the display font may never have loaded — the light-theme values are inlined.
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#ffffff',
          color: '#141924',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            padding: '0 1.5rem',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'flex',
              height: '3rem',
              width: '3rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.75rem',
              background: '#6337E6',
              color: '#ffffff',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            B
          </span>

          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.24em',
                color: '#7F8694',
              }}
            >
              Error
            </p>
            <h1 style={{ margin: '0.75rem 0 0', fontSize: '1.875rem', fontWeight: 600 }}>
              This page didn&rsquo;t load.
            </h1>
            <p style={{ margin: '0.75rem auto 0', maxWidth: '24rem', color: '#585E6A', lineHeight: 1.6 }}>
              Something went wrong on our side. Try again, or head back to the Help Center home.
            </p>
          </div>

          {error.digest && (
            <p
              style={{
                margin: 0,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.24em',
                color: '#7F8694',
              }}
            >
              Ref {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                borderRadius: '0.5rem',
                border: 0,
                background: '#6337E6',
                color: '#ffffff',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: '0.5rem',
                border: '1px solid #BFC4CF',
                background: '#F9F9FB',
                color: '#141924',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to Help Center home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
