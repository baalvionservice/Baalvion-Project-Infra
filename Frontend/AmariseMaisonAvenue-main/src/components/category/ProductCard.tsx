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
  const badge = getProductBadge(product);

  return (
    <Link
      href={`/${countryCode}/product/${product.id}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative overflow-hidden bg-[hsl(var(--muted))]">
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <ProductBadge label={badge.label} variant={badge.variant} />
          </div>
        )}
        <BrandImage
          src={product.imageUrl?.[0]}
          alt={product.name}
          label={product.name}
          className="aspect-square"
          imgClassName="object-contain md:p-6 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="mt-5 text-center space-y-2.5 px-1">
        <h3 className="text-[11px] text-balance font-light leading-[1.6] uppercase tracking-[0.06em] line-clamp-3 text-[hsl(var(--muted-foreground))] transition-colors duration-300 group-hover:text-[hsl(var(--foreground))]">
          {product.name}
        </h3>
        {/* tabular-price: prices sit in a grid column and must not wobble between rows. */}
        <p className="tabular-price text-[13.5px] font-semibold text-[hsl(var(--foreground))]">
          {formatProductPrice(product, normalizeCountry(countryCode), { withDecimals: true })}
        </p>
      </div>
    </Link>
  );
}
