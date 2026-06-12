import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import type { ProductCategory } from "@/lib/content/types";

/**
 * Presentational card for a single product category. Links into the
 * category listing. Imagery falls back to the branded mineral placeholder.
 */
export function CategoryCard({ category }: { category: ProductCategory }) {
  const imageSrc = category.image?.url ?? BRAND_IMAGES.mineral;
  const imageAlt = category.image?.alt ?? `${category.name} category`;

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <Card className="overflow-hidden border-none shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
          <Badge className="absolute top-4 left-4 bg-white/90 text-primary font-bold uppercase tracking-widest text-[10px] px-3 py-1">
            <Layers className="h-3 w-3 mr-1" aria-hidden="true" /> Category
          </Badge>
        </div>
        <CardContent className="p-6 space-y-2">
          <h3 className="text-xl font-bold text-primary leading-snug">
            {category.name}
          </h3>
          {category.description ? (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
              {category.description}
            </p>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary pt-1">
            Browse products
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
