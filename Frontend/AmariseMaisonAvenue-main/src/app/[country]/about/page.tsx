
import React from 'react';
import { Metadata } from 'next';
import { MAISON_STORY, COUNTRIES } from '@/lib/mock-data';
import { Sparkles, History, Gem, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type AboutPageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  return {
    title: 'About AMARISÉ MAISON | Our Heritage Since 1924',
    description: 'Discover the centuries-old heritage and craftsmanship of AMARISÉ MAISON AVENUE. Explore our story of luxury and excellence.',
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const country = params.country;
  const countryCode = (country as string) || 'us';

  return (
    <div className="animate-fade-in bg-ivory">
      {/* Hero Header */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden border-b border-border bg-muted">
        {/* Heritage Card Box Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[15vw] font-headline font-bold text-gray-900 italic">1924</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="relative z-10 text-center space-y-6 max-w-4xl px-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
            <Link href={`/${countryCode}`} className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold">Our Heritage</span>
          </nav>
          <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase">Est. 1924 | Paris</span>
          <h1 className="text-6xl md:text-8xl font-headline font-bold italic leading-tight text-gray-900">
            {MAISON_STORY.title}
          </h1>
          <p className="text-xl text-gray-600 font-light italic leading-relaxed max-w-2xl mx-auto">
            {MAISON_STORY.subtitle}
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center justify-center p-4 bg-plum/5 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-gray-900 italic">The Pursuit of Excellence</h2>
          <p className="text-xl text-gray-500 font-light leading-relaxed italic border-l-2 border-gold/30 pl-8 mx-auto max-w-2xl">
            {MAISON_STORY.philosophy}
          </p>
        </div>
      </section>

      {/* History Timeline */}
      <section className="bg-white py-32 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-20 space-y-4">
            <History className="w-10 h-10 text-gold mb-2" />
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum">A Century of Mastery</h3>
            <h2 className="text-5xl font-headline font-bold italic text-gray-900">Chronicles of the House</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {MAISON_STORY.history.map((item, idx) => (
              <div key={idx} className="space-y-6 group p-8 bg-ivory border border-border hover:border-gold transition-all duration-500 hover:shadow-luxury">
                <span className="text-5xl font-headline font-bold italic text-gold/30 group-hover:text-gold transition-colors">{item.year}</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-headline font-bold text-gray-900 uppercase tracking-widest">{item.milestone}</h4>
                  <p className="text-sm text-gray-500 font-light leading-relaxed italic">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="container mx-auto px-6 py-32 space-y-32">
        <div className="text-center space-y-4">
          <Gem className="w-10 h-10 text-plum mx-auto mb-4" />
          <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum">The Artisanal Heart</h3>
          <h2 className="text-5xl font-headline font-bold italic text-gray-900">Masters of the Archive</h2>
        </div>

        <div className="space-y-40">
          {MAISON_STORY.craftsmanship.map((craft, idx) => (
            <div key={idx} className={`flex flex-col lg:flex-row items-center gap-24 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="lg:w-1/2 relative aspect-[4/5] w-full shadow-luxury overflow-hidden group bg-muted flex items-center justify-center">
                {/* Craft Card Box Placeholder */}
                <div className="text-[10px] font-bold tracking-[0.5em] text-gray-300 uppercase transition-all duration-[2s] group-hover:scale-110">
                  {craft.title} Archive
                </div>
                <div className="absolute inset-0 bg-plum/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="lg:w-1/2 space-y-8 text-center lg:text-left px-6">
                <h4 className="text-4xl font-headline font-bold italic text-gray-900">{craft.title}</h4>
                <div className="h-px w-20 bg-gold mx-auto lg:mx-0" />
                <p className="text-xl text-gray-500 font-light leading-relaxed italic">
                  {craft.description}
                </p>
                <div className="pt-8">
                  <Link href={`/${countryCode}/category/apparel`}>
                    <button className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum hover:text-gold transition-colors border-b border-gold pb-2">
                      Explore the Collection
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="bg-plum/5 py-40 border-t border-border">
        <div className="container mx-auto px-6 text-center space-y-12 max-w-4xl">
          <div className="inline-flex items-center justify-center p-6 bg-white rounded-full shadow-lg mb-4">
            <ShieldCheck className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-5xl font-headline font-bold italic text-gray-900">A Heritage of Responsibility</h2>
          <p className="text-2xl text-gray-600 font-light leading-relaxed italic max-w-3xl mx-auto">
            "{MAISON_STORY.sustainability}"
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link href={`/${countryCode}/journal`}>
              <button className="bg-plum text-white hover:bg-gold hover:text-gray-900 h-16 px-14 rounded-none text-[10px] tracking-[0.4em] font-bold transition-all">
                READ OUR SUSTAINABILITY CHARTER
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
