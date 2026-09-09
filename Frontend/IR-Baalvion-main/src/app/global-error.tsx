'use client';

import { useEffect } from 'react';

// Replaces the document when the root layout itself fails, so globals.css never
// loads — every value here is the literal token from globals.css.
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
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          background: 'hsl(240 10% 3.9%)',
          color: 'hsl(210 40% 98%)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: 'hsl(24 95% 53%)',
            }}
          >
            Service Interruption
          </p>
          <h1 style={{ margin: '1rem 0 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            This resource could not be loaded
          </h1>
          <p style={{ margin: '0.75rem 0 2rem', lineHeight: 1.6, color: 'hsl(240 5% 65%)' }}>
            The investor relations site failed to initialise. Nothing has been submitted or changed.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'hsl(24 95% 53%)',
                color: 'hsl(210 40% 98%)',
              }}
            >
              Retry
            </button>
            <a
              href="/"
              style={{
                borderRadius: '0.5rem',
                border: '1px solid hsl(240 5% 20%)',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: 'hsl(210 40% 98%)',
              }}
            >
              Return to Index
            </a>
          </div>
          {error.digest ? (
            <p style={{ margin: '2rem 0 0', fontSize: '0.6875rem', letterSpacing: '0.15em', color: 'hsl(240 5% 65%)' }}>
              REF {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
