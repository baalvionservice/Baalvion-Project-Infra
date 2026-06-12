"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandImage } from "@/components/ui/BrandImage";
import { useCollections } from "@/lib/useCatalog";
import { normalizeCountry } from "@/lib/i18n/countries";

/**
 * CollectionsPage — real collections from the live catalog API.
 *
 * Previously this was an async Server Component that called useAppStore() (a 'use client'
 * Context hook), so on the server AppContext was undefined and the grid rendered empty /
 * threw. It is now a Client Component that loads collections via useCollections()
 * (catalog.getCollections), renders the real name + a BrandImage (graceful monogram when no
 * media), and links each tile to /collection/[id].
 */
export default function CollectionsPage() {
  const { country } = useParams();
  const countryCode = normalizeCountry(country);
  const { collections, loading } = useCollections(countryCode);

  return (
    <div className="bg-white min-h-screen relative">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[12px] font-normal text-gray-500 mb-6">
          <Link href={`/${countryCode}`} className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-gray-300 font-light flex items-center justify-center">
            <ChevronRight className="w-3 h-3 mx-1" strokeWidth={1.5} />
          </span>
          <span className="text-gray-900">Collections</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-5xl font-headline font-medium text-black mb-16 tracking-tight">
          Collections
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
            <span className="ml-3 text-[11px] font-bold uppercase tracking-[0.3em]">
              Loading collections
            </span>
          </div>
        ) : collections.length === 0 ? (
          <p className="py-32 text-center text-[15px] font-light italic text-gray-500">
            No collections are available in this market yet.
          </p>
        ) : (
          /* Collections Grid - 3 Columns */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-24 mb-24">
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex flex-col items-center text-center group"
              >
                <Link
                  href={`/${countryCode}/collection/${col.id}`}
                  className="relative block mb-8 w-full"
                  aria-label={`Shop the ${col.name} collection`}
                >
                  <div className="relative w-52 h-52 mx-auto rounded-full overflow-hidden border border-gray-100 transition-transform duration-500 group-hover:scale-105">
                    <BrandImage
                      src={col.imageUrl}
                      alt={col.name}
                      label={col.name}
                      variant="compact"
                      className="absolute inset-0 h-full w-full"
                      sizes="208px"
                    />
                  </div>
                  <div className="mt-6">
                    <span className="text-xl font-headline italic text-gray-900 tracking-tight block">
                      {col.name}
                    </span>
                  </div>
                </Link>

                {/* CTA */}
                <div className="w-full flex flex-col items-center">
                  <Link
                    href={`/${countryCode}/collection/${col.id}`}
                    className="w-full max-w-[180px]"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-none border border-black bg-transparent text-[10px] font-bold tracking-[0.25em] text-black uppercase hover:bg-black hover:text-white transition-all duration-300"
                    >
                      SHOP NOW
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
