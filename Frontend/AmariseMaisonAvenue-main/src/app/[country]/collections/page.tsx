import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { ChevronRight, Ban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CollectionsPageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: CollectionsPageProps): Promise<Metadata> {
  return {
    title: 'Collections | AMARISÉ MAISON - Curated Luxury Collections',
    description: 'Browse our exclusive collections featuring the finest curated selections from premier luxury brands and artisan craftspeople.',
  };
}

/**
 * CollectionsPage: Refined for a more compact and elegant presentation.
 */
export default function CollectionsPage({ params }: CollectionsPageProps) {
  const countryCode = (params.country as string) || 'us';
  const { collections } = useAppStore();

  return (
    <div className="bg-white min-h-screen relative">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[12px] font-normal text-gray-500 mb-6">
          <Link href={`/${countryCode}`} className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300 font-light flex items-center justify-center">
            <ChevronRight className="w-3 h-3 mx-1" strokeWidth={1.5} />
          </span>
          <span className="text-gray-900">Collections</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-5xl font-headline font-medium text-black mb-16 tracking-tight">
          Collections
        </h1>

        {/* Collections Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-24 mb-24">
          {collections.slice(0, 9).map((col) => {
            return (
              <div key={col.id} className="flex flex-col items-center text-center group">
                {/* Circular Structural Asset - Reduced size */}
                <Link href={`/${countryCode}/collection/${col.id}`} className="relative block mb-8">
                  <div className="relative w-52 h-52 rounded-full bg-[#f8f8f8] flex items-center justify-center border border-gray-100 transition-transform duration-500 group-hover:scale-105">
                    <Ban className="w-24 h-24 text-gray-100/60 stroke-[0.5px]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#262626] w-8 h-8 flex items-center justify-center shadow-lg">
                        <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <span className="text-xl font-headline italic text-gray-300/70 tracking-tight block">No image</span>
                  </div>
                </Link>

                {/* Info & CTA */}
                <div className="w-full flex flex-col items-center">
                  <Link href={`/${countryCode}/collection/${col.id}`} className="w-full max-w-[180px]">
                    <Button variant="outline" className="w-full h-10 rounded-none border border-black bg-transparent text-[10px] font-bold tracking-[0.25em] text-black uppercase hover:bg-black hover:text-white transition-all duration-300">
                      SHOP NOW
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
