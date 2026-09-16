"use client";

import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";


interface ProductGridProps {
  products: Product[];
  countryCode: string;
  /** Whether the shopper has narrowed the list. Drives which empty state is honest. */
  filtersActive?: boolean;
}

export function ProductGrid({ products, countryCode, filtersActive = false }: ProductGridProps) {
  if (products.length === 0) {
    // An unfiltered empty category means the consignment stock has rotated out, not
    // that the shopper mis-filtered — telling them to adjust filters they never set
    // reads as a broken page.
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-[13px] font-light text-[#999] tracking-widest uppercase mb-3">
          {filtersActive ? "No products found" : "Currently unavailable"}
        </p>
        {filtersActive ? (
          <p className="text-[12px] text-[#bbb] font-light">
            Try adjusting your filters
          </p>
        ) : (
          <>
            <p className="text-[12px] text-[#bbb] font-light max-w-sm leading-relaxed">
              Every piece is one of a kind, so this collection changes as it is acquired.
              Our specialists can source a specific piece on request.
            </p>
            <div className="mt-8 flex items-center gap-8">
              <a
                href={`/${countryCode}/new-arrivals`}
                className="text-[11px] tracking-widest uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 hover:opacity-60 transition-opacity"
              >
                View New Arrivals
              </a>
              <a
                href={`/${countryCode}/contact`}
                className="text-[11px] tracking-widest uppercase text-[#999] border-b border-[#ddd] pb-1 hover:text-[#1a1a1a] transition-colors"
              >
                Request a Piece
              </a>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 md:gap-x-8 gap-y-16">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} countryCode={countryCode} />
      ))}
    </div>
  );
}