"use client"

import React, { useState, useEffect } from 'react';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Store, Tag, TrendingUp, Plus, ArrowUpRight, Search, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherProductsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Marketplace Intel</h1>
          <p className="text-text-muted font-medium">Select and promote operational assets during live broadcasts.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            Request Promotion Slot
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Promoted Sales', val: '842 Units', icon: TrendingUp, color: 'text-brand-green' },
          { label: 'Total Commission', val: '4.28 ETH', icon: Tag, color: 'text-semantic-warning' },
          { label: 'Direct Referrals', val: '1,240', icon: Store, color: 'text-semantic-info' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-green" /> Curated Assets for Promotion
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input 
              placeholder="Filter products..." 
              className="w-full bg-brand-void border border-brand-border h-10 rounded-lg pl-10 pr-4 text-xs font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MARKETPLACE_PRODUCTS.map((p) => (
            <ListingCard key={p.id} className="p-6 bg-brand-surface border-brand-border hover:border-brand-green transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <Badge variant="info" className="text-[8px] font-mono">{p.category}</Badge>
                <div className="flex items-center gap-1 text-semantic-warning font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" /> {p.rating}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <h4 className="text-xl font-bold text-white leading-tight group-hover:text-brand-green transition-colors">{p.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{p.description}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-brand-border flex items-center justify-between">
                <div className="text-lg font-bold text-white font-mono">{p.price} <span className="text-[10px] text-text-muted">USDT</span></div>
                <AppButton size="sm" className="font-mono text-[9px] uppercase px-4 h-8">Promote Asset</AppButton>
              </div>
            </ListingCard>
          ))}
        </div>
      </div>
    </div>
  );
}
