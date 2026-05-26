"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  countryCode: string;
}

export function ProductCard({ product, countryCode }: ProductCardProps) {
  const [liked, setLiked] = useState(false);

  return (
    <Link
      href={`/${countryCode}/product/${product.id}`}
      className="group block"
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden mb-5">
        <Image
          src={product.imageUrl[0]}
          alt={product.name}
          fill
          className="object-contain md:p-6 transition-transform duration-700 "
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Product info */}
      <div className="text-center space-y-2.5 px-1">
        <h3 className="text-[11px] text-balance font-light text-[#555] leading-[1.6] uppercase tracking-[0.06em] line-clamp-3">
          {product.name}
        </h3>
        <p className="text-[13.5px] font-semibold text-[#1a1a1a] tracking-tight">
          $
          {product.basePrice.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>
    </Link>
  );
}
