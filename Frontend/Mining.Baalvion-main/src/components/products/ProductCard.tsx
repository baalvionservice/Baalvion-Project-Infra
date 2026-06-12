import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Ruler, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import type { Product, ProductCategory } from "@/lib/content/types";

/**
 * Presentational card for a single product within a category. Renders only the
 * facts present on the record — never invents grade, size, or specifications.
 */
export function ProductCard({
  product,
  category,
}: {
  product: Product;
  category?: ProductCategory;
}) {
  const imageSrc = product.gallery[0]?.url ?? BRAND_IMAGES.mineral;
  const imageAlt = product.gallery[0]?.alt ?? `${product.name} sample`;
  const categorySlug = category?.slug;

  const href = categorySlug
    ? `/products/${categorySlug}/${product.slug}`
    : `/products`;

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <Card className="overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute top-3 left-3 bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] px-3 py-1">
            <Package className="h-3 w-3 mr-1" aria-hidden="true" /> Product
          </Badge>
        </div>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-lg font-bold text-primary leading-snug">
            {product.name}
          </h3>
          {product.description ? (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {product.grade ? (
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
                <Tag className="h-3 w-3 mr-1" aria-hidden="true" /> {product.grade}
              </Badge>
            ) : null}
            {product.size ? (
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
                <Ruler className="h-3 w-3 mr-1" aria-hidden="true" /> {product.size}
              </Badge>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary pt-1">
            View details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
