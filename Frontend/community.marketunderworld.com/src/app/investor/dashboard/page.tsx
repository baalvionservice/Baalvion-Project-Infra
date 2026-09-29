
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Navbar } from '@/components/layout/navbar';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Users, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  ChevronRight,
  Zap,
  Youtube,
  Mic,
  DollarSign,
  Activity
} from 'lucide-react';
import { CREATOR_INVESTMENTS } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InvestorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-[1600px] mx-auto px-6 pt-44 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h1 className="text-4xl font-bold tracking-tight uppercase font-display italic leading-none text-white">
                Capital <span className="text-blue-400">Command.</span>
              </h1>
            </div>
            <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Investor Node: US-8472 • Level 4 Authorization</p>
          </div>
          <div className="flex gap-4">
            <AppButton variant="secondary" className="h-12 border-brand-border px-8 font-mono text-[11px] uppercase tracking-widest">
              Withdraw Yield
            </AppButton>
            <AppButton className="h-12 px-8 font-mono text-[11px] uppercase tracking-widest shadow-xl shadow-blue-400/20 bg-blue-400 text-black">
              Explore Nodes
            </AppButton>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Allocation', val: '1.24 ETH', icon: Wallet, color: 'text-blue-400' },
            { label: 'Yield Generated', val: '0.18 ETH', icon: TrendingUp, color: 'text-brand-green' },
            { label: 'Active Stakes', val: '4 Channels', icon: Zap, color: 'text-semantic-warning' },
            { label: 'Avg ROI', val: '22.4%', icon: Activity, color: 'text-white' },
          ].map((stat, i) => (
            <ListingCard key={i} variant="stats" className="p-8 border-brand-border bg-brand-surface flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-xl bg-brand-void border border-brand-border">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-ghost opacity-40" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-3xl font-bold text-white font-mono">{stat.val}</div>
              </div>
            </ListingCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Active Investment Grid */}
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-2xl font-bold uppercase font-display italic">Live <span className="text-blue-400">Equity Stakes.</span></h2>
            <div className="grid grid-cols-1 gap-6">
              {CREATOR_INVESTMENTS.map((inv) => (
                <ListingCard key={inv.id} className="p-8 border-brand-border bg-brand-surface group hover:border-blue-400 transition-all flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden shrink-0">
                    <img src={inv.images[0]} className="w-full h-full object-cover opacity-60" alt="" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white leading-tight mb-1">{inv.title}</h3>
                        <p className="text-xs text-text-muted font-mono uppercase tracking-widest">Operator: {inv.creatorName}</p>
                      </div>
                      <Badge variant={inv.isLive ? 'live' : 'info'}>{inv.platform.toUpperCase()}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-brand-border pt-4">
                      <div>
                        <div className="text-[8px] font-bold text-text-ghost uppercase">Locked Value</div>
                        <div className="text-sm font-bold text-white font-mono">₹{inv.investmentRequired.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-text-ghost uppercase">Equity Share</div>
                        <div className="text-sm font-bold text-blue-400 font-mono">{inv.investorShare}%</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-text-ghost uppercase">Current Yield</div>
                        <div className="text-sm font-bold text-brand-green font-mono">₹12,400</div>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-2">
                    <AppButton size="sm" className="h-9 px-6 text-[10px] uppercase font-mono tracking-widest bg-blue-400 text-black">Audit Reports</AppButton>
                    <button className="text-[9px] font-bold text-text-muted hover:text-white uppercase tracking-widest transition-colors">Contact Operator</button>
                  </div>
                </ListingCard>
              ))}
            </div>
          </div>

          {/* Portfolio Analysis */}
          <div className="lg:col-span-4 space-y-12">
            <section className="space-y-8">
              <h2 className="text-2xl font-bold">Node <span className="text-blue-400">Distribution.</span></h2>
              <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-10">
                <div className="aspect-square relative flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-8 border-brand-void ring-8 ring-blue-400/20" />
                  <div className="absolute flex flex-col items-center">
                    <PieChart className="w-8 h-8 text-blue-400 mb-2" />
                    <span className="text-2xl font-bold text-white font-mono">1.2 ETH</span>
                    <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Portfolio Value</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'YouTube', val: '64%', color: 'bg-red-500' },
                    { label: 'Podcasts', val: '22%', color: 'bg-purple-500' },
                    { label: 'Live Stream', val: '14%', color: 'bg-amber-500' }
                  ].map(plat => (
                    <div key={plat.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                        <span>{plat.label}</span>
                        <span className="text-white">{plat.val}</span>
                      </div>
                      <div className="h-1 bg-brand-void rounded-full overflow-hidden">
                        <div className={cn("h-full", plat.color)} style={{ width: plat.val }} />
                      </div>
                    </div>
                  ))}
                </div>
              </ListingCard>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-bold">Event <span className="text-semantic-warning">Log.</span></h2>
              <div className="space-y-4">
                {[
                  { text: 'Payout confirmed: Node #INV-847', time: '2h ago', color: 'text-brand-green' },
                  { text: 'Creator Alpha initialize Live Event', time: '5h ago', color: 'text-blue-400' },
                  { text: 'New equity node authorized', time: '1d ago', color: 'text-text-muted' },
                ].map((log, i) => (
                  <div key={i} className="p-4 bg-brand-surface border border-brand-border rounded-xl flex justify-between items-center group hover:border-brand-green transition-all">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-white leading-none">{log.text}</p>
                      <p className="text-[9px] text-text-ghost uppercase font-mono">{log.time}</p>
                    </div>
                    <ChevronRight size={14} className="text-text-ghost group-hover:text-brand-green transition-all" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
