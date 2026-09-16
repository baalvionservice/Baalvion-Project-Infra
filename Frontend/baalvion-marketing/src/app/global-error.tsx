'use client';

import { useEffect } from 'react';

// Replaces the document when the root layout itself fails, so globals.css is
// never applied — every value here is the literal token from globals.css.
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
          background: 'hsl(224 45% 6%)',
          color: 'hsl(210 40% 98%)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              color: 'hsl(217 12% 52%)',
            }}
          >
            Error
          </p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Baalvion is temporarily unavailable.
          </h1>
          <p style={{ margin: '0.75rem 0 2rem', lineHeight: 1.6, color: 'hsl(217 16% 70%)' }}>
            The site failed to start. Reloading usually clears it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              border: 0,
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'hsl(210 40% 98%)',
              color: 'hsl(224 45% 6%)',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ margin: '2rem 0 0', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'hsl(217 12% 52%)' }}>
              REF {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
