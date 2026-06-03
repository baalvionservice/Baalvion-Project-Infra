'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Heart, ChevronRight, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PrivateArchivePage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { wishlist } = useAppStore();

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Private Archive</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Archive</h1>
          <p className="text-sm text-gray-500 font-light italic">A curated selection of artifacts reserved for your future acquisition.</p>
        </div>
        <Button variant="outline" className="h-12 border-border text-[9px] font-bold uppercase tracking-widest px-8 rounded-none">
           <Share2 className="w-3.5 h-3.5 mr-2" /> SHARE SELECTION
        </Button>
      </header>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {wishlist.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-40 text-center border-2 border-dashed border-border flex flex-col items-center space-y-6 opacity-30">
           <div className="p-8 bg-ivory border border-border rounded-full">
              <Heart className="w-12 h-12 text-gray-200" />
           </div>
           <div className="space-y-2">
              <p className="text-xl font-headline font-bold italic text-gray-900">Your Archive is Empty</p>
              <p className="text-xs text-gray-500 font-light uppercase tracking-widest">Reserve artifacts while browsing the registry.</p>
           </div>
           <Link href={`/${countryCode}`}>
              <Button className="h-12 bg-black text-white hover:bg-plum rounded-none text-[9px] font-bold tracking-widest uppercase px-12">EXPLORE THE MAISON</Button>
           </Link>
        </div>
      )}
    </div>
  );
}
