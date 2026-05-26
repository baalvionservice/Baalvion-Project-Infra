import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Heart,
  Share2,
  Sparkles,
  ChevronRight,
  Package,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';

type GiftRegistryPageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: GiftRegistryPageProps): Promise<Metadata> {
  return {
    title: 'Private Gift Registry | AMARISÉ MAISON - Create Your Wishlist',
    description: 'Create and share your luxury gift registry with friends and family. Curate your collection of fine artifacts for special occasions.',
  };
}

export default function GiftRegistryPage({ params }: GiftRegistryPageProps) {
  const countryCode = (params.country as string) || 'us';
  const { wishlist } = useAppStore();

  return (
    <div className="animate-fade-in bg-ivory pb-32">
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-border">
        <Image src="https://picsum.photos/seed/amarise-gift/2560/1440" alt="Maison Gifting" fill className="object-cover opacity-60 grayscale-[50%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ivory/20 to-ivory" />
        <div className="relative z-10 text-center space-y-4 px-6">
          <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase">Heritage Gifting</span>
          <h1 className="text-6xl md:text-7xl font-headline font-bold italic text-gray-900 leading-tight">Private Registry</h1>
        </div>
      </section>

      <div className="container mx-auto px-6 mt-20">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="bg-white p-12 shadow-luxury border border-border text-center space-y-8">
            <div className="inline-flex items-center justify-center p-4 bg-plum/5 rounded-full">
              <Gift className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-4xl font-headline font-bold italic">Curating for Occasions</h2>
            <p className="text-lg text-muted-foreground font-light italic leading-relaxed max-w-2xl mx-auto">
              "The AMARISÉ Registry allows you to share your desired artifacts with those who wish to commemorate your milestones with the pinnacle of craft."
            </p>
            <div className="pt-8 flex justify-center space-x-6">
              <Button className="bg-plum text-white hover:bg-gold h-14 px-10 rounded-none text-[9px] font-bold tracking-widest uppercase">CREATE NEW REGISTRY</Button>
              <Button variant="outline" className="border-border h-14 px-10 rounded-none text-[9px] font-bold tracking-widest uppercase"><Share2 className="w-4 h-4 mr-2" /> SHARE SELECTION</Button>
            </div>
          </div>

          <div className="space-y-12">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">Registry Selection: Your Wishlist</h3>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{wishlist.length} Artifacts Reserved</span>
            </div>

            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                {wishlist.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center space-y-6">
                <Heart className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="text-xl text-muted-foreground italic font-light">Your selection is currently empty.</p>
                <Link href={`/${countryCode}/category/jewelry`}>
                  <Button variant="outline" className="rounded-none border-plum text-plum text-[9px] font-bold tracking-widest uppercase px-12 h-12">EXPLORE ATELIERS</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
