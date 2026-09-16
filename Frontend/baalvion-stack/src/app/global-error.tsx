'use client';

import { useEffect } from 'react';

// Replaces the document, so it carries its own html/body and cannot rely on the
// stylesheet or the webfonts. Palette values are the site's own, stated flat.
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
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#ffffff',
          color: '#171717',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ margin: '0 auto', maxWidth: '1584px', width: '100%', padding: '0 1.5rem' }}>
          <p
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#545454',
            }}
          >
            <span aria-hidden style={{ height: '1px', width: '2rem', background: '#0f62fe' }} />
            Error
          </p>
          <h1 style={{ margin: '2rem 0 0', fontSize: 'clamp(2rem, 1.4rem + 2.4vw, 3.25rem)', fontWeight: 300, lineHeight: 1.1 }}>
            Baalvion Stack is temporarily unavailable.
          </h1>
          <p style={{ margin: '1.5rem 0 0', maxWidth: '36rem', fontSize: '18px', fontWeight: 300, lineHeight: 1.6, color: '#545454' }}>
            The fault has been recorded. Reload to try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2.5rem',
              cursor: 'pointer',
              border: 'none',
              background: '#0f62fe',
              color: '#ffffff',
              padding: '0.875rem 1.25rem',
              font: 'inherit',
              fontSize: '15px',
              minHeight: '44px',
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#545454' }}>
              REF: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
