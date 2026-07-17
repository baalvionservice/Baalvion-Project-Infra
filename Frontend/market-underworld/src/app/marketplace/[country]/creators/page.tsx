
"use client"

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  Youtube, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  DollarSign,
  Users,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Monetized channels and super-chat investments.' },
];

export default function CreatorMarketplaceHub({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-20 space-y-8">
          <Link href={`/marketplace/${country}`} className="text-xs font-bold text-text-muted hover:text-brand-green transition-colors uppercase tracking-widest flex items-center gap-2 mb-4">
            <ChevronLeft size={14} /> Back to {formattedCountry} Hub
          </Link>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-400 font-bold text-xs uppercase tracking-[0.3em]">
              <TrendingUp className="w-4 h-4" /> Intellectual Asset Node
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase italic font-display leading-none">
              Creator <span className="text-blue-400">Equity.</span>
            </h1>
            <p className="text-text-secondary text-xl max-w-2xl font-mono uppercase text-sm tracking-widest leading-relaxed">
              Invest in global talent and receive direct revenue distributions from content performance in the {formattedCountry} node.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PLATFORMS.map((plat, i) => (
            <motion.div
              key={plat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/marketplace/${country}/creators/${plat.id}`}>
                <ListingCard className="p-10 border-brand-border bg-brand-surface group hover:border-blue-400 transition-all h-full flex flex-col space-y-8 relative overflow-hidden">
                  <div className={cn("absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform", plat.color)}>
                    <plat.icon size={120} />
                  </div>
                  
                  <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl", plat.bg, plat.color)}>
                    <plat.icon size={32} />
                  </div>

                  <div className="space-y-2 flex-1">
                    <h3 className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors italic leading-none">
                      {plat.name}
                    </h3>
                    <p className="text-xs text-text-muted font-mono uppercase tracking-widest leading-relaxed">
                      {plat.desc}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-brand-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-text-ghost uppercase">Listings</div>
                        <div className="text-lg font-bold text-white">42</div>
                      </div>
                      <div className="w-px h-8 bg-brand-border" />
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-text-ghost uppercase">Avg Yield</div>
                        <div className="text-lg font-bold text-brand-green">18%</div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-text-ghost group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                  </div>
                </ListingCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Global Performance Summary */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Creators', val: '1,247', icon: Users, color: 'text-blue-400' },
            { label: 'Platform Volume', val: '84.2 ETH', icon: Globe, color: 'text-brand-green' },
            { label: 'Pending Distributions', val: '1.24 ETH', icon: DollarSign, color: 'text-semantic-warning' },
          ].map((stat, i) => (
            <ListingCard key={i} className="bg-brand-surface border-brand-border p-8 flex items-center gap-6">
              <div className="p-4 rounded-xl bg-brand-void border border-brand-border">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{stat.label}</div>
                <div className="text-2xl font-bold text-white font-mono">{stat.val}</div>
              </div>
            </ListingCard>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
