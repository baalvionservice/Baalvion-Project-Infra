'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useProducts } from '@/lib/useCatalog';
import { ProductCard } from '@/components/category/ProductCard';
import { normalizeCountry } from '@/lib/i18n/countries';

/** Where "explore New Arrivals" sends shoppers when a query returns nothing. */
const NEW_ARRIVALS_CATEGORY = 'hermes-birkin-handbags';
/** Cap on how many results we render for a single query. */
const SEARCH_LIMIT = 50;

function SearchResults() {
  const params = useParams();
  const countryCode = normalizeCountry(params?.country);

  const searchParams = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const { products, total, loading } = useProducts({ search: query, limit: SEARCH_LIMIT });

  // No query yet — invite the shopper to search.
  if (!query) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 lg:px-12 pt-24 lg:pt-32 pb-40 text-center">
        <h1 className="font-serif text-[28px] md:text-[34px] font-medium text-[#1a1a1a] tracking-tight leading-tight mb-4">
          Search the Maison
        </h1>
        <p className="text-[13px] font-light text-[#777] tracking-wide max-w-md mx-auto leading-relaxed">
          Enter a name, a craft, or a collection to discover artifacts curated for you.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-12 pt-12 lg:pt-16 pb-28">
      <header className="mb-12 lg:mb-16">
        <p className="text-[10px] font-light text-[#999] tracking-[0.3em] uppercase mb-4">
          Search
        </p>
        <h1 className="font-serif text-[28px] md:text-[40px] font-medium text-[#1a1a1a] tracking-tight leading-[1.1] text-balance">
          Results for &ldquo;{query}&rdquo;
        </h1>
        {!loading && (
          <p className="mt-4 text-[12px] font-light text-[#777] tracking-wide">
            {total === 0
              ? 'No matching artifacts'
              : `${total} ${total === 1 ? 'result' : 'results'}`}
          </p>
        )}
      </header>

      {loading ? (
        <p className="py-24 text-center text-[12px] font-light text-[#999] tracking-[0.3em] uppercase">
          Searching&hellip;
        </p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 lg:py-36 text-center">
          <p className="font-serif text-[20px] md:text-[24px] font-medium text-[#1a1a1a] tracking-tight mb-4">
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-[13px] font-light text-[#777] tracking-wide max-w-md leading-relaxed mb-8">
            We could not find a match in this market. Perhaps a new acquisition awaits.
          </p>
          <Link
            href={`/${countryCode}/category/${NEW_ARRIVALS_CATEGORY}`}
            className="text-[11px] font-light text-[#1a1a1a] tracking-[0.2em] uppercase border-b border-[#1a1a1a] pb-1 transition-colors hover:text-[#777] hover:border-[#777]"
          >
            Explore New Arrivals
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-12 lg:gap-y-16">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} countryCode={countryCode} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="bg-white min-h-screen font-sans antialiased">
      <Suspense
        fallback={
          <p className="py-40 text-center text-[12px] font-light text-[#999] tracking-[0.3em] uppercase">
            Searching&hellip;
          </p>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
