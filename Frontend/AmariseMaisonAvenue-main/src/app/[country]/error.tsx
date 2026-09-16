'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { normalizeCountry } from '@/lib/i18n/countries';

/**
 * Storefront error boundary. Renders inside CountryChrome, so header, cart and
 * footer stay up and the shopper keeps their place — unlike (entry)/error.tsx,
 * which sits outside the chrome and is deliberately style-free.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const country = normalizeCountry(params?.country);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-ivory px-6 py-24">
      <div className="max-w-xl text-center">
        <span className="eyebrow text-muted-foreground">Maison Notice</span>
        <h1 className="font-headline mt-6 text-4xl font-bold italic leading-[1.05] sm:text-5xl">
          This page could not be presented
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Something interrupted the request. Nothing in your bag or your order has been changed.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="flex h-14 min-w-[220px] items-center justify-center bg-black px-10 text-[10px] font-bold uppercase tracking-[0.32em] text-white transition-colors hover:bg-gold hover:text-black"
          >
            Try again
          </button>
          <Link
            href={`/${country}`}
            className="flex h-14 min-w-[220px] items-center justify-center border border-black bg-transparent px-10 text-[10px] font-bold uppercase tracking-[0.32em] text-black transition-colors hover:bg-black hover:text-white"
          >
            Return to the maison
          </Link>
        </div>
        {error.digest ? (
          <p className="eyebrow mt-12 text-muted-foreground">Ref {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
