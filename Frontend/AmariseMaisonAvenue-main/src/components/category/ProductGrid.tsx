"use client";

import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";


interface ProductGridProps {
  products: Product[];
  countryCode: string;
}

export function ProductGrid({ products, countryCode }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-[13px] font-light text-[#999] tracking-widest uppercase mb-3">
          No products found
        </p>
        <p className="text-[12px] text-[#bbb] font-light">
          Try adjusting your filters
        </p>
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