'use client';

import { useEffect } from 'react';

/**
 * Sits above the root layout, so it replaces the document and cannot use Container
 * or the site stylesheet. The palette below restates the ground/accent tokens flat.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[canwemarry] root layout error', error.digest ?? error.message); }, [error]);

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
          background: '#fbfaf7',
          color: '#1c2530',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ maxWidth: '34rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 1.2rem + 1.6vw, 2.25rem)', lineHeight: 1.2 }}>
            Something went wrong
          </h1>
          <p style={{ margin: '1rem 0 0', lineHeight: 1.6, color: '#5a6472' }}>
            We could not load the site. Trying again often works; if it does not, the reference below
            helps us find what happened.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.75rem',
              cursor: 'pointer',
              border: 'none',
              background: '#25605f',
              color: '#fbfaf7',
              padding: '0.75rem 1.5rem',
              font: 'inherit',
              borderRadius: '6px',
              minHeight: '44px',
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: '1.5rem', fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#5a6472' }}>
              Reference {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
