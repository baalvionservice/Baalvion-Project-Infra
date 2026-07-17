
"use client"

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Star, 
  Users, 
  TrendingUp, 
  ArrowRight,
  DollarSign,
  Clock,
  ShieldCheck,
  Globe,
  Youtube,
  Instagram,
  Mic,
  Play,
  Zap,
  Lock
} from 'lucide-react';
import { CREATOR_INVESTMENTS } from '@/data/mockData';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<string, any> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Play,
  podcast: Mic,
  livestream: Zap
};

export default function PlatformListingsPage({ params }: { params: Promise<{ country: string, platform: string }> }) {
  const resolvedParams = use(params);
  const { country, platform } = resolvedParams;
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
  const formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
  
  const Icon = PLATFORM_ICONS[platform.toLowerCase()] || Globe;
  const [search, setSearch] = useState("");

  const listings = CREATOR_INVESTMENTS.filter(inv => 
    inv.platform.toLowerCase() === platform.toLowerCase() &&
    (inv.title.toLowerCase().includes(search.toLowerCase()) || inv.creatorName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16">
          <Link href={`/marketplace/${country}/creators`} className="inline-flex items-center gap-2 text-text-muted hover:text-blue-400 transition-colors text-xs font-bold uppercase tracking-widest mb-12">
            <ChevronLeft size={16} /> Back to Creator Hub
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-400/10 text-blue-400 border border-blue-400/20">
                  <Icon size={32} />
                </div>
                <div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase italic font-display leading-none">
                    {formattedPlatform} <span className="text-blue-400">Equity.</span>
                  </h1>
                  <p className="text-text-muted font-mono text-xs uppercase tracking-widest mt-2">Active Trade Node: {formattedCountry} • Verified High-Performance Assets</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost group-focus-within:text-blue-400 transition-colors" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search creators or listings..." 
                  className="w-full bg-brand-surface border border-brand-border h-12 rounded-xl pl-12 pr-4 text-sm font-mono text-white outline-none focus:border-blue-400 transition-all shadow-xl"
                />
              </div>
              <AppButton variant="secondary" className="h-12 border-brand-border">
                <Filter className="w-4 h-4" />
              </AppButton>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {listings.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface group hover:border-blue-400 transition-all h-full flex flex-col">
                  <div className="relative aspect-video overflow-hidden shrink-0">
                    <img src={item.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80" alt={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      {item.isLive && <Badge variant="live">LIVE EVENT</Badge>}
                      <Badge variant="info" className="bg-brand-void/80 border-white/10 uppercase">{item.category}</Badge>
                    </div>
                  </div>

                  <div className="p-8 space-y-8 flex-1 flex flex-col">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight italic line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Operator: {item.creatorName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-brand-void/50 rounded-xl border border-brand-border space-y-1">
                          <div className="text-[8px] font-bold text-text-ghost uppercase">Req. Investment</div>
                          <div className="text-sm font-bold text-white font-mono">₹{item.investmentRequired.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-blue-400/5 rounded-xl border border-blue-400/20 space-y-1">
                          <div className="text-[8px] font-bold text-blue-400 uppercase">Investor Share</div>
                          <div className="text-sm font-bold text-blue-400 font-mono">{item.investorShare}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-brand-border mt-auto flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Expected ROI</div>
                        <div className="text-xl font-bold text-brand-green font-mono">+{Math.round(((item.expectedRevenue - item.investmentRequired) / item.investmentRequired) * 100)}%</div>
                      </div>
                      <Link href={`/marketplace/${country}/creators/${platform}/investment/${item.id}`}>
                        <AppButton className="h-10 px-6 text-[10px] uppercase font-mono tracking-widest shadow-xl shadow-blue-400/10 group-hover:scale-105 transition-all">
                          Analyze Yield <ArrowRight size={14} className="ml-2" />
                        </AppButton>
                      </Link>
                    </div>
                  </div>
                </ListingCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {listings.length === 0 && (
          <div className="py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-brand-surface rounded-[2.5rem] flex items-center justify-center mx-auto border border-brand-border text-text-ghost">
              <Icon size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest italic font-display">No Active Allocations</h3>
              <p className="text-sm text-gray-600 font-mono mt-2 max-w-sm mx-auto leading-relaxed">
                Zero revenue-share opportunities discovered for {formattedPlatform} in the {formattedCountry} node.
              </p>
              <Link href={`/marketplace/${country}/creators`}>
                <AppButton variant="secondary" className="mt-8 px-10 h-12">Return to Creator Hub</AppButton>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
