
"use client"

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { MarketplaceModule } from '@/lib/types';
import { ChevronRight, Globe, Terminal, ShieldCheck, MapPin, Box, RefreshCcw, LayoutGrid, Cpu, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CountryMarketplaceHub({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const countryKey = country.toLowerCase();
  
  const [data, setData] = useState<{ name: string, modules: MarketplaceModule[], nodeStatus: string, payoutKey: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHub = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/marketplaces/${countryKey}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (e) {
        console.error("Failed to initialize country hub protocol", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHub();
  }, [countryKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-base flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCcw className="w-10 h-10 text-brand-green animate-spin mx-auto" />
          <p className="text-[10px] font-bold text-brand-green uppercase tracking-[0.3em]">Handshaking Modular Hub Node: {country.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-base flex items-center justify-center">
        <div className="text-center space-y-6">
          <Box className="w-16 h-16 text-text-ghost mx-auto" />
          <h2 className="text-2xl font-bold uppercase italic">Hub Node missing from registry.</h2>
          <p className="text-text-muted font-mono text-xs">The requested country node "{country}" is currently unprovisioned.</p>
          <Link href="/marketplace">
            <AppButton variant="secondary" className="px-8">Return to Global Grid</AppButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-brand-green font-bold text-[10px] uppercase tracking-[0.3em]">
                <Cpu className="w-4 h-4" /> Node Detected: {data.name} HUB
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase italic font-display leading-[0.9]">
                Modular <br /> <span className="text-brand-green">Protocol.</span>
              </h1>
              <p className="text-text-secondary text-xl max-w-2xl font-mono uppercase text-sm tracking-widest leading-relaxed">
                Localized Plugin-Based Trade Grid. Initialize a module to access specialized commodity and intelligence sectors for {data.name}.
              </p>
            </div>
            
            <div className="p-8 bg-brand-surface border border-brand-border rounded-xl space-y-6 w-full md:w-96 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Globe size={120} />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest relative z-10">
                <span>Protocol Sync</span>
                <Badge variant="success">OPTIMAL</Badge>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="text-[9px] font-bold text-text-ghost uppercase">Master Settlement Key</div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand-green" />
                  <div className="font-mono text-[10px] text-white break-all leading-tight">{data.payoutKey}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Modular Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/marketplace/${countryKey}/${mod.slug}`}>
                <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface group hover:border-brand-green transition-all h-full flex flex-col relative">
                  <div className={cn("h-48 bg-gradient-to-br relative flex items-center justify-center overflow-hidden", mod.color)}>
                    <span className="text-8xl group-hover:scale-110 transition-transform duration-700 select-none">{mod.icon}</span>
                    <div className="absolute inset-0 bg-brand-void/20" />
                    <div className="absolute top-4 right-4">
                      <Badge variant="live" className="bg-brand-void/60 border-white/10 text-[8px] uppercase">PLUGIN ACTIVE</Badge>
                    </div>
                  </div>
                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <h3 className="text-3xl font-bold text-white group-hover:text-brand-green transition-colors leading-none italic uppercase font-display">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed font-mono uppercase tracking-widest">
                        {mod.description}
                      </p>
                    </div>
                    
                    <div className="pt-6 border-t border-brand-border flex items-center justify-between">
                      <div className="text-[10px] font-bold text-text-ghost uppercase tracking-widest">
                        Initializing sector...
                      </div>
                      <div className="flex items-center gap-2 text-brand-green text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Connect Node <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </ListingCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <section className="mt-32 space-y-8">
          <div className="flex items-center gap-3 text-brand-green font-bold text-[10px] uppercase tracking-[0.3em]">
            <Terminal className="w-4 h-4" /> Plugin Synchronization Log
          </div>
          <ListingCard className="p-8 bg-brand-void border-brand-border rounded-none border-l-4 border-l-brand-green">
            <div className="space-y-4 font-mono text-[11px] text-text-muted">
              <div className="flex gap-4">
                <span className="text-brand-green">[OK]</span>
                <span>&gt; Modular hub handshake completed for {data.name}.</span>
              </div>
              <div className="flex gap-4">
                <span className="text-brand-green">[OK]</span>
                <span>&gt; Syncing {data.modules.length} marketplace plugins from global registry.</span>
              </div>
              <div className="flex gap-4">
                <span className="text-brand-green">[OK]</span>
                <span>&gt; Loading sector-specific metadata protocols... [100%]</span>
              </div>
              <div className="flex gap-4">
                <span className="text-brand-green animate-pulse">[_]</span>
                <span className="text-white">&gt; Awaiting module selection for protocol initialization...</span>
              </div>
            </div>
          </ListingCard>
        </section>
      </main>

      <Footer />
    </div>
  );
}
