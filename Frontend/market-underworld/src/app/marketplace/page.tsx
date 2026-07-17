
"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, Globe, MapPin, ChevronRight, Zap, TrendingUp, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/data/mockData';
import Link from 'next/link';

export default function GlobalMarketplaceLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const filteredRegions = selectedRegion === 'all' 
    ? REGIONS 
    : REGIONS.filter(r => r.id === selectedRegion);

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-[1440px] mx-auto px-6 pt-44 pb-32">
        {/* Global Discovery Header */}
        <header className="mb-24 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
              <Badge variant="success" className="px-4 py-1">GLOBAL TRADE PROTOCOL ACTIVE</Badge>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase italic font-display leading-[0.9]">
                Discovery <br /> <span className="text-brand-green">Protocol.</span>
              </h1>
              <p className="text-text-secondary text-xl max-w-xl font-mono uppercase text-sm tracking-widest leading-relaxed">
                Connect to any regional node. Access localized commodities, electronics, and elite services.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand-surface p-2 border border-brand-border rounded-xl shadow-2xl">
              <div className="flex-1 relative min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-ghost" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, nodes, or cities..."
                  className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 font-mono text-sm"
                />
              </div>
              <AppButton className="h-12 px-8 font-mono text-xs uppercase tracking-widest">Execute Search</AppButton>
            </div>
          </div>
        </header>

        {/* Region Discovery Grid */}
        <section className="space-y-16">
          <div className="flex items-center justify-between border-b border-brand-border pb-8">
            <h2 className="text-2xl font-bold uppercase italic font-display">Intelligence Nodes</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
              {['all', 'sas', 'eap', 'eca', 'nam', 'mena', 'lac', 'ssa'].map(id => (
                <button 
                  key={id}
                  onClick={() => setSelectedRegion(id)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedRegion === id ? "bg-brand-green text-black" : "bg-white/5 text-text-muted hover:text-white"
                  )}
                >
                  {id === 'all' ? 'GLOBAL' : id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRegions.map((region, i) => (
              <ListingCard key={region.id} index={i} className="p-0 overflow-hidden group border-brand-border bg-brand-surface hover:border-brand-green transition-all">
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-500">{region.icon}</div>
                    <Badge variant="info">{(region.countries?.length ?? 0)} Nodes</Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{region.name}</h3>
                    <p className="text-text-muted text-xs font-mono uppercase tracking-widest">Connected Regional Grid</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-brand-border">
                    {(region.countries ?? []).slice(0, 4).map(country => (
                      <Link 
                        key={country} 
                        href={`/marketplace/${country.toLowerCase()}`}
                        className="flex items-center justify-between p-3 rounded bg-brand-void/50 hover:bg-brand-green/10 border border-transparent hover:border-brand-green/20 transition-all group/country"
                      >
                        <span className="text-sm font-bold text-text-secondary group-hover/country:text-white">{country}</span>
                        <ChevronRight size={14} className="text-text-ghost group-hover/country:text-brand-green transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              </ListingCard>
            ))}
          </div>
        </section>

        {/* Global Statistics */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Trade Nodes', val: '49', icon: Globe, color: 'text-brand-green' },
            { label: 'Market Capitalization', val: '842.3 ETH', icon: Zap, color: 'text-semantic-warning' },
            { label: 'Daily Protocol Load', val: '92%', icon: TrendingUp, color: 'text-semantic-info' },
          ].map((stat, i) => (
            <ListingCard key={i} className="bg-brand-surface border-brand-border p-8 flex items-center gap-6">
              <div className="p-4 rounded bg-brand-void border border-brand-border">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{stat.label}</div>
                <div className="text-2xl font-bold text-white font-mono">{stat.val}</div>
              </div>
            </ListingCard>
          ))}
        </section>

        {/* Terminal Sync Log */}
        <section className="mt-32">
          <ListingCard className="p-8 bg-brand-void border-brand-border border-l-4 border-l-brand-green rounded-none">
            <div className="flex items-center gap-3 mb-6">
              <Terminal size={16} className="text-brand-green" />
              <span className="text-[10px] font-bold text-brand-green uppercase tracking-[0.3em]">Protocol Synchronizer v2.4.0</span>
            </div>
            <div className="space-y-3 font-mono text-[11px] text-text-muted">
              <div>&gt; Initializing global node handshakes... [OK]</div>
              <div>&gt; Authenticating regional trade escrows... [OK]</div>
              <div>&gt; Syncing 10,000+ marketplace identifiers... [92%]</div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                <span className="text-white">&gt; Awaiting user node assignment...</span>
              </div>
            </div>
          </ListingCard>
        </section>
      </main>

      <Footer />
    </div>
  );
}
