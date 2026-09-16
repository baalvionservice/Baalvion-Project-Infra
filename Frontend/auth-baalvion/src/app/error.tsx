'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { DEFAULT_THEME } from '@/lib/themes';

/**
 * Every style in globals.css resolves from the theme tokens that page.tsx puts on
 * `.stage`. This boundary renders *instead of* the page, so it has to carry its
 * own — DEFAULT_THEME is the same fallback resolveBrand() lands on when the brand
 * can't be determined, which is exactly the situation once the page has failed.
 */
export default function Error({
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
    <main
      className="stage"
      style={DEFAULT_THEME.vars as unknown as CSSProperties}
      data-mode={DEFAULT_THEME.mode}
    >
      <section className="card">
        <header className="brand">
          <span className="brand__mark">
            {DEFAULT_THEME.brandName}
            <span className="brand__dot" aria-hidden />
          </span>
          <span className="brand__tagline">{DEFAULT_THEME.tagline}</span>
        </header>

        <div className="step">
          <div className="alert alert--error" role="alert">
            <span aria-hidden>⚠</span>
            <span>Sign-in is temporarily unavailable.</span>
          </div>

          <h1 className="h1">Something went wrong</h1>
          <p className="sub">
            We couldn&rsquo;t load the sign-in form. No code has been sent and no account was
            changed.
          </p>

          <button className="btn" type="button" onClick={() => reset()}>
            Try again
          </button>

          {error.digest ? <p className="meta">Reference {error.digest}</p> : null}
        </div>
      </section>
    </main>
  );
}
