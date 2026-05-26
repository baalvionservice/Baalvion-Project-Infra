
'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PRODUCTS, formatPrice, COUNTRIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Star, ChevronRight, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * SpecialArchivePage: Restores the "previous" minimalist Maison template.
 * Reserved for specific persona audits and "special person" access.
 */
export default function SpecialArchivePage() {
  const { id, country } = useParams();
  const countryCode = (country as string) || 'us';
  const { addToCart, toggleWishlist, wishlist } = useAppStore();
  const { toast } = useToast();
  
  const product = useMemo(() => PRODUCTS.find(p => p.id === id), [id]);
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;
  const isWishlisted = wishlist.some(i => i.id === product?.id);

  if (!product) {
    return <div className="py-40 text-center font-headline text-3xl">Artifact not found.</div>;
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast({ title: "Added to Bag", description: `${product.name} is ready for you.` });
  };

  return (
    <div className="bg-ivory min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <nav className="flex items-center space-x-2 text-[10px] tracking-widest uppercase mb-12 text-muted-foreground font-bold">
          <Link href={`/${countryCode}`} className="hover:text-primary">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-black">Special Archive: {product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-24">
          {/* Previous Design: Simple 2-column layout */}
          <div className="w-full lg:w-3/5 space-y-8">
            <div className="relative aspect-[4/5] bg-white border border-border shadow-luxury overflow-hidden">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
            </div>
          </div>

          <div className="w-full lg:w-2/5 space-y-12">
            <div className="space-y-6">
              <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase border-b border-gold/40 pb-1">
                Atelier {currentCountry.office?.city}
              </span>
              <h1 className="text-5xl font-headline font-bold leading-tight text-gray-900 italic">{product.name}</h1>
              <div className="flex items-center space-x-6">
                <div className="flex text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < Math.floor(product.rating) ? "fill-current" : "text-gray-200")} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">{product.reviewsCount} Critiques</span>
              </div>
              <div className="text-6xl font-light tracking-tighter pt-4 text-gray-900">
                {formatPrice(product.basePrice, countryCode)}
              </div>
            </div>

            <div className="space-y-4">
              {/* Previous Design signature: Large Plum Button */}
              <Button 
                size="lg" 
                className="w-full bg-plum text-white hover:bg-gold hover:text-gray-900 h-20 rounded-none text-[10px] tracking-[0.4em] font-bold shadow-2xl transition-all" 
                onClick={handleAddToCart}
              >
                ADD TO SHOPPING BAG
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-gray-900 h-20 rounded-none text-[10px] tracking-[0.4em] font-bold" 
                onClick={() => toggleWishlist(product)}
              >
                {isWishlisted ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}
              </Button>
            </div>

            <Tabs defaultValue="narrative" className="w-full pt-12">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-14 p-0 space-x-12">
                <TabsTrigger value="narrative" className="text-[11px] font-bold uppercase tracking-widest data-[state=active]:text-plum data-[state=active]:border-b-2 data-[state=active]:border-plum rounded-none">The Narrative</TabsTrigger>
                <TabsTrigger value="provenance" className="text-[11px] font-bold uppercase tracking-widest data-[state=active]:text-plum data-[state=active]:border-b-2 data-[state=active]:border-plum rounded-none">Provenance</TabsTrigger>
              </TabsList>
              <TabsContent value="narrative" className="pt-10">
                <p className="text-gray-600 font-light leading-relaxed italic first-letter:text-6xl first-letter:float-left first-letter:mr-3 text-lg">
                  This artifact represents the pinnacle of the Maison's craftsmanship. Hand-finished in our central atelier, it serves as a testament to human brilliance and the pursuit of excellence that has defined our heritage since 1924.
                </p>
              </TabsContent>
              <TabsContent value="provenance" className="pt-10">
                <ul className="space-y-4 text-sm font-light">
                  <li className="flex justify-between border-b pb-2"><span>Origin</span><span>Maison Ateliers, {currentCountry.office?.city}</span></li>
                  <li className="flex justify-between border-b pb-2"><span>Authenticity</span><span>NFC Certification Included</span></li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
