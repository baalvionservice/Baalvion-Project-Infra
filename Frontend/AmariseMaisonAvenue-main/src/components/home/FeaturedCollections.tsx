import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import type { HomepageCollectionTile } from "@/lib/cms";

interface FeaturedCollectionsProps {
  collections: HomepageCollectionTile[];
  countryCode: string;
}

/** Editorial grid of curated collection tiles. Images + links are admin-editable. */
export function FeaturedCollections({
  collections,
  countryCode,
}: FeaturedCollectionsProps) {
  if (!collections.length) return null;
  const href = (path: string) =>
    path.startsWith("/") ? `/${countryCode}${path}` : path;

  return (
    <section className="container mx-auto px-6 py-24">
      <div className="mb-14 flex flex-col items-center space-y-3 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
          The Maison Edit
        </span>
        <h2 className="font-headline text-4xl font-bold italic text-gray-900 md:text-5xl">
          Shop the Collections
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {collections.map((tile, idx) => (
          <Link key={idx} href={href(tile.href)} className="group block">
            <BrandImage
              src={tile.image}
              alt={tile.title}
              label={tile.title}
              className="aspect-[3/4] w-full"
              imgClassName="transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="mt-4 space-y-1 text-center">
              <h3 className="font-headline text-lg font-bold italic text-gray-900">
                {tile.title}
              </h3>
              {tile.subtitle && (
                <p className="text-[11px] font-light uppercase tracking-[0.12em] text-gray-500">
                  {tile.subtitle}
                </p>
              )}
              <span className="inline-block pt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-plum opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Discover →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
