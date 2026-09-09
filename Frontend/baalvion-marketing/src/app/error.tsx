'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/logo-mark';

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
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-hero px-6 text-center">
      <LogoMark />
      <div className="space-y-3">
        <p className="eyebrow justify-center text-center">Error</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">This page didn&rsquo;t load.</h1>
        <p className="text-muted">Something failed while rendering. Retrying usually clears it.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary focus-ring">
          Try again
        </button>
        <Link href="/" className="btn-secondary focus-ring">
          Return to baalvion.com
        </Link>
      </div>
      {/* Digest is the only handle support has on a specific failure; the stack stays in the console. */}
      {error.digest ? (
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-2">Ref {error.digest}</p>
      ) : null}
    </main>
  );
}
