'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for failures in the root layout itself. It replaces the
 * document, so it carries its own <html>/<body> and cannot rely on the site
 * stylesheet having loaded — hence the inline styles.
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1.5rem',
          textAlign: 'center',
          background: '#090c11',
          color: '#f6f5f3',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ff9900' }}>
          Error
        </p>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.9rem, 1.2rem + 2.2vw, 3.25rem)', fontWeight: 400, lineHeight: 1.05 }}>
          baalvion.com is temporarily unavailable.
        </h1>
        <p style={{ margin: 0, maxWidth: '42ch', lineHeight: 1.6, color: '#99a1ad' }}>
          The fault has been recorded. Reload the page to try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            cursor: 'pointer',
            border: '1px solid #ff9900',
            background: 'transparent',
            color: '#f6f5f3',
            padding: '0.75rem 1.5rem',
            font: 'inherit',
            minHeight: '44px',
          }}
        >
          Reload
        </button>
        {error.digest && <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Reference {error.digest}</p>}
      </body>
    </html>
  );
}
