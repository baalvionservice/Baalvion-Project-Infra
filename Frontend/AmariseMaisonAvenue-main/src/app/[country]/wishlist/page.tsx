'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist } = useAppStore();
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-8">
        <div className="p-8 bg-card rounded-full">
          <Heart className="w-16 h-16 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-headline font-bold">Your Wishlist is Empty</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Save your favorite pieces here to curate your ultimate luxury collection.
        </p>
        <Button
          onClick={() => router.push(`/${countryCode}`)}
          size="lg"
          className="rounded-none bg-white hover:bg-secondary shadow-lg px-12 text-xs tracking-widest font-bold"
        >
          DISCOVER PIECES
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="space-y-4 mb-16">
        <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase">Private Selection</span>
        <h1 className="text-5xl font-headline font-bold">Your Wishlist</h1>
        <p className="text-muted-foreground font-light max-w-2xl">
          A curated selection of your most desired treasures from the Amarisé ateliers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-24 pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </div>
          <p className="text-sm font-light text-muted-foreground italic">
            "True luxury is found in the objects we choose to cherish."
          </p>
        </div>
        <Link href={`/${countryCode}/cart`}>
          <Button variant="outline" className="rounded-none border-foreground h-14 px-10 text-[10px] tracking-[0.2em] font-bold">
            VIEW SHOPPING BAG <ArrowRight className="ml-2 w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
