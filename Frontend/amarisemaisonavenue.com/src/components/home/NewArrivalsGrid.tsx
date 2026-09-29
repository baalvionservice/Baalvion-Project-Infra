import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/category/ProductCard";
import type { HomepageNewArrivals } from "@/lib/cms";

interface NewArrivalsGridProps {
  config: HomepageNewArrivals;
  products: Product[];
  countryCode: string;
}

/** Live "new arrivals" strip — products come from commerce-service. When the
 *  catalog is empty (e.g. unseeded store) the whole section is omitted so the
 *  homepage stays clean rather than showing an empty grid. */
export function NewArrivalsGrid({
  config,
  products,
  countryCode,
}: NewArrivalsGridProps) {
  if (!products.length) return null;
  const href = (path: string) =>
    path.startsWith("/") ? `/${countryCode}${path}` : path;

  return (
    <section className="border-y border-border bg-ivory py-24">
      <div className="container mx-auto px-6">
        <div className="mb-12 flex flex-col items-center space-y-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
            Just In
          </span>
          <h2 className="font-headline text-4xl font-bold italic text-gray-900 md:text-5xl">
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="max-w-xl text-[13px] font-light italic leading-relaxed text-gray-500">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              countryCode={countryCode}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href={href(config.ctaHref)}
            className="inline-flex h-14 items-center justify-center border border-black bg-transparent px-12 text-[10px] font-bold uppercase tracking-[0.32em] text-black transition-colors hover:bg-black hover:text-white"
          >
            {config.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
