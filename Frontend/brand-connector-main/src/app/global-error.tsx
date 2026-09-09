'use client';

import { useEffect } from 'react';

// Root error boundary. It replaces the document, so it renders its own
// html/body and cannot assume Tailwind or the webfonts loaded — the wordmark
// is plain text and every value here is inline.
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
          padding: '1rem',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: '36rem', width: '100%', textAlign: 'center' }}>
          <p style={{ margin: '0 0 3rem', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Baalvion <span style={{ color: '#6C3AE8' }}>Connect</span>
          </p>

          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em' }}>
            System Malfunction
          </h1>
          <p style={{ margin: '1rem 0 2rem', fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.6, color: '#64748b' }}>
            A critical error occurred in the marketplace engine. Your data and escrowed funds are
            safe.
          </p>

          <div
            style={{
              padding: '2rem',
              background: '#ffffff',
              border: '1px solid #f1f5f9',
              borderRadius: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  height: '3.5rem',
                  border: 0,
                  borderRadius: '1rem',
                  background: '#6C3AE8',
                  color: '#ffffff',
                  fontSize: '1.125rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Re-initialize Workspace
              </button>
              <a
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '3.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '1rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Return to Safety
              </a>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#cbd5e1',
                }}
              >
                Incident Reference
              </span>
              <code
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  background: '#f8fafc',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  color: '#94a3b8',
                }}
              >
                {error.digest || 'BV-AUTO-LOG'}
              </code>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
