
'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Heart, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/mock-data';
import { PRODUCTS_EXTENDED } from '@/lib/mock-monetization';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(({ product }: ProductCardProps) => {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { toggleWishlist, wishlist } = useAppStore();
  const { toast } = useToast();
  
  const isWishlisted = wishlist.some(i => i.id === product.id);
  const monetization = useMemo(() => PRODUCTS_EXTENDED[product.id] || { priceVisible: true }, [product.id]);

  const targetFlow = product.isVip ? 'private-order' : 'product';

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast({ title: isWishlisted ? "Removed from Archive" : "Saved to Archive", description: product.name });
  };

  return (
    <article className="group relative flex flex-col bg-transparent overflow-hidden h-full luxury-reveal">
      {/* 1. Visual Matrix */}
      <Link href={`/${countryCode}/${targetFlow}/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-[#fcfcfc] border border-gray-50 shadow-sm" aria-label={`Registry Details for ${product.name}`}>
        <PlaceholderImage 
          id={product.isVip ? "home-mastery" : "product-luxury-default"} 
          alt={product.name}
          className="absolute inset-0 w-full h-full transition-transform duration-[3s] group-hover:scale-110" 
        />
        
        {product.isVip && (
          <div className="absolute top-4 lg:top-8 left-4 lg:left-8 bg-black px-4 py-2 text-[8px] lg:text-[10px] font-bold tracking-[0.5em] text-white uppercase z-10 shadow-2xl luxury-blur bg-opacity-80 border border-white/10">
            PRIVATE ALLOCATION
          </div>
        )}

        <button 
          onClick={handleToggleWishlist}
          className="absolute top-4 lg:top-8 right-4 lg:right-8 z-20 p-3 rounded-full bg-white/90 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl"
          aria-label={isWishlisted ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={cn("w-5 h-5 transition-colors", isWishlisted ? "fill-plum text-plum" : "text-gray-400")} />
        </button>

        <div className="hidden lg:flex absolute inset-x-0 bottom-0 p-10 flex-col space-y-6 translate-y-full group-hover:translate-y-0 transition-transform duration-[0.8s] ease-[cubic-bezier(0.19,1,0.22,1)] bg-white/98 backdrop-blur-3xl z-20 border-t border-gray-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
          <div className="flex items-center space-x-4 text-[9px] font-bold uppercase tracking-[0.4em] text-plum mb-2">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <span>Provenance Verified</span>
          </div>
          <Button className="w-full h-16 bg-black text-white hover:bg-plum rounded-none text-[10px] font-bold tracking-[0.5em] uppercase transition-all shadow-2xl">
            {product.isVip ? 'INITIATE BRIEF' : 'AUDIT REGISTRY'}
          </Button>
        </div>
      </Link>
      
      {/* 2. Institutional Metadata */}
      <div className="pt-8 lg:pt-12 pb-6 flex-1 flex flex-col space-y-3 lg:space-y-6 text-center px-4">
        <Link href={`/${countryCode}/${targetFlow}/${product.id}`} className="block">
          <h3 className="font-headline text-lg lg:text-3xl text-gray-900 group-hover:text-plum transition-colors duration-700 leading-tight tracking-tight line-clamp-1 italic font-medium">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col items-center space-y-3">
          <span className="text-sm lg:text-lg font-bold tracking-tighter text-gray-900 tabular uppercase">
            {monetization.priceVisible ? formatPrice(product.basePrice, countryCode) : "Inquire for Private Quote"}
          </span>
          <div className="w-10 lg:w-16 h-[1.5px] bg-gray-100 group-hover:w-24 group-hover:bg-plum transition-all duration-1000" />
        </div>

        <div className="lg:hidden pt-4">
           <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-plum flex items-center justify-center border-b border-plum/20 pb-1.5 mx-auto w-fit">
             Registry Details <ArrowRight className="w-3 h-3 ml-3" />
           </span>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
