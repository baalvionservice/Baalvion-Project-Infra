"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { BrandImage } from "@/components/ui/BrandImage";
import { ProductBadge, getProductBadge } from "@/components/ui/ProductBadge";
import { formatProductPrice, normalizeCountry } from "@/lib/i18n/countries";

interface ProductCardProps {
  product: Product;
  countryCode: string;
}

export function ProductCard({ product, countryCode }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const badge = getProductBadge(product);

  return (
    <Link
      href={`/${countryCode}/product/${product.id}`}
      className="group block"
    >
      {/* Image container */}
      <div className="relative">
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <ProductBadge label={badge.label} variant={badge.variant} />
          </div>
        )}
        <BrandImage
          src={product.imageUrl?.[0]}
          alt={product.name}
          label={product.name}
          className="aspect-square mb-5"
          imgClassName="object-contain md:p-6 transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Product info */}
      <div className="text-center space-y-2.5 px-1">
        <h3 className="text-[11px] text-balance font-light text-[#555] leading-[1.6] uppercase tracking-[0.06em] line-clamp-3">
          {product.name}
        </h3>
        <p className="text-[13.5px] font-semibold text-[#1a1a1a] tracking-tight">
          {formatProductPrice(product, normalizeCountry(countryCode), { withDecimals: true })}
        </p>
      </div>
    </Link>
  );
}
