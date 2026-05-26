
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import {
  ChevronRight,
  ArrowRight,
  Sparkles,
  Compass,
  Bookmark,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BuyingGuidePageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: BuyingGuidePageProps): Promise<Metadata> {
  return {
    title: 'Buying Guides | AMARISÉ MAISON - Expert Curation & Intelligence',
    description: 'Explore our curated collection of buying guides featuring expert advice on luxury acquisitions, material mastery, and heritage craftsmanship.',
  };
}

/**
 * BuyingGuideListingPage: The curated directory of Maison intelligence.
 */
export default function BuyingGuideListingPage({ params }: BuyingGuidePageProps) {
  const countryCode = (params.country as string) || 'us';
  const { buyingGuides, socialMetrics } = useAppStore();

  const filteredGuides = buyingGuides.filter(g => g.country === countryCode || g.country === 'us');

  return (
    <div className="animate-fade-in bg-ivory pb-40">
      {/* Header Section */}
      <section className="container mx-auto px-6 py-24 text-center space-y-8">
        <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
          <Link href={`/${countryCode}`} className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-bold">Buying Guides</span>
        </nav>
        <div className="inline-flex items-center space-x-3 text-plum mb-4">
          <Compass className="w-6 h-6 text-gold" />
          <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Intelligence & Curation</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-headline font-bold italic text-gray-900">Buying Guides</h1>
        <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl mx-auto italic">
          "The acquisition of an artifact is a dialogue between human brilliance and timeless heritage. We invite you to master the art of the selection."
        </p>
      </section>

      {/* Featured Grid */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {filteredGuides.map((guide, idx) => {
            const metrics = socialMetrics[guide.id] || { likes: 0, shares: 0 };
            return (
              <Link
                key={guide.id}
                href={`/${countryCode}/buying-guide/${guide.id}`}
                className="group flex flex-col bg-white border border-border shadow-sm hover:shadow-luxury transition-all duration-700"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={guide.imageUrl}
                    alt={guide.title}
                    fill
                    className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <div className="absolute top-6 left-6 luxury-blur px-4 py-2 border border-border/40">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-plum">{guide.category}</span>
                  </div>
                  <div className="absolute top-6 right-6 flex items-center space-x-2 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-3 h-3 fill-white" />
                    <span className="text-[9px] font-bold">{metrics.likes.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-10 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <h2 className="text-3xl font-headline font-bold text-gray-900 group-hover:text-gold transition-colors duration-500 italic">
                      {guide.title}
                    </h2>
                    <p className="text-sm text-gray-500 font-light italic leading-relaxed line-clamp-3">
                      {guide.excerpt}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-border flex items-center justify-between">
                    <div className="text-[9px] font-bold tracking-widest uppercase text-gray-400">
                      By {guide.author}
                    </div>
                    <div className="flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-plum group-hover:translate-x-2 transition-transform">
                      Master the Art <ArrowRight className="w-3 h-3 ml-2" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-40 text-muted-foreground italic">
            The curators are currently drafting new guides for this market.
          </div>
        )}
      </section>

      {/* Bespoke Request Section */}
      <section className="container mx-auto px-6 mt-40 pt-40 border-t border-border text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <Sparkles className="w-10 h-10 text-gold mx-auto" />
          <h3 className="text-5xl font-headline font-bold italic">Bespoke Guidance</h3>
          <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl mx-auto">
            "For acquisitions that transcend the standard, our senior curators provide private, one-on-one digital consultations."
          </p>
          <Link href={`/${countryCode}/contact`}>
            <Button className="h-16 px-14 rounded-none bg-plum text-white hover:bg-gold hover:text-gray-900 text-[10px] tracking-[0.4em] font-bold transition-all shadow-xl shadow-plum/10">
              REQUEST PRIVATE CONSULTATION
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
