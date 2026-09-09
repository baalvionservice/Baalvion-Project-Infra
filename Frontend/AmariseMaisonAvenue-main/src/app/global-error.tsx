'use client';

import { useEffect } from 'react';

/**
 * Replaces the document when a root layout itself fails. There are two of them
 * here — (entry) and [country] — and neither can catch its own failure, so this
 * is the only boundary above them. globals.css and the next/font faces never
 * load at this point, hence literal token values and the serif fallback stack.
 */
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
          background: '#FAF9F6',
          color: '#1a1a1a',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '34rem' }}>
          <span
            style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.42em',
              color: '#726c66',
            }}
          >
            Maison Notice
          </span>
          <h1
            style={{
              margin: '1.75rem 0 0',
              fontFamily: '"Iowan Old Style", Palatino, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 1.4rem + 2.4vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            The maison is momentarily unavailable
          </h1>
          <p style={{ margin: '1.5rem 0 2.5rem', fontSize: '0.875rem', lineHeight: 1.75, color: '#726c66' }}>
            The site could not be loaded. Nothing in your bag or your order has been changed.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: '3.5rem',
              minWidth: '220px',
              padding: '0 2.5rem',
              border: 0,
              background: '#000000',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.32em',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                margin: '3rem 0 0',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.42em',
                color: '#726c66',
              }}
            >
              Ref {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
