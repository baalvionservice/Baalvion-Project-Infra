
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Navbar } from '@/components/layout/navbar';
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Play, 
  Mic, 
  Video, 
  DollarSign, 
  Activity, 
  ArrowUpRight,
  MoreVertical,
  Settings,
  Zap,
  Globe
} from 'lucide-react';
import { STATS } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function CreatorDashboard() {
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
              <Zap className="w-5 h-5 text-amber-500" />
              <h1 className="text-4xl font-bold tracking-tight uppercase font-display italic leading-none text-white">
                Creator <span className="text-amber-500">Terminal.</span>
              </h1>
            </div>
            <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Operator Node: Alpha Gaming • Verified Clearance</p>
          </div>
          <div className="flex gap-4">
            <AppButton variant="secondary" className="h-12 border-brand-border px-8 font-mono text-[11px] uppercase tracking-widest">
              Broadcast Intel
            </AppButton>
            <AppButton className="h-12 px-8 font-mono text-[11px] uppercase tracking-widest shadow-xl shadow-amber-500/20 bg-amber-500 text-black">
              New Equity Listing
            </AppButton>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Follower Base', val: '1.2M+', icon: Users, color: 'text-blue-400' },
            { label: 'Total Funded', val: '4.28 ETH', icon: DollarSign, color: 'text-brand-green' },
            { label: 'Current ROI', val: '18.4%', icon: TrendingUp, color: 'text-amber-500' },
            { label: 'Platform Load', val: 'Optimal', icon: Activity, color: 'text-white' },
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
          {/* Active Allocations */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase font-display italic">Authorized <span className="text-amber-500">Allocations.</span></h2>
              <Badge variant="info">2 ACTIVE NODES</Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {[
                { title: 'Q2 Super Chat Revenue Share', investors: 42, funded: '0.84 ETH', status: 'funded' },
                { title: 'Mobile Gaming Expansion Seed', investors: 12, funded: '0.42 ETH', status: 'funding' }
              ].map((alloc, i) => (
                <ListingCard key={i} className="p-10 border-brand-border bg-brand-surface group hover:border-amber-500/30 transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-12">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-amber-500 transition-colors italic">{alloc.title}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Users size={12} className="text-blue-400" /> {alloc.investors} Stakeholders</span>
                          <span className="w-1 h-1 bg-brand-border rounded-full" />
                          <span className="flex items-center gap-1.5"><Globe size={12} className="text-brand-green" /> Global Reach</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-text-ghost uppercase">Node Settlement</div>
                          <div className="text-xl font-bold text-white font-mono">{alloc.funded}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] font-bold text-text-ghost uppercase">Distribution Status</div>
                          <div className="text-xl font-bold text-brand-green uppercase font-mono">{alloc.status}</div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col justify-center gap-3">
                      <AppButton size="sm" className="h-11 px-10 text-[10px] uppercase font-mono tracking-[0.2em] bg-amber-500 text-black">Distribute Yield</AppButton>
                      <AppButton variant="secondary" size="sm" className="h-11 px-10 text-[10px] uppercase font-mono tracking-[0.2em] border-brand-border">Audit Node</AppButton>
                    </div>
                  </div>
                </ListingCard>
              ))}
            </div>
          </div>

          {/* Yield Performance */}
          <div className="lg:col-span-4 space-y-12">
            <h2 className="text-2xl font-bold">Node <span className="text-amber-500">Health.</span></h2>
            <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span>Intelligence Throughput</span>
                  <span className="text-amber-500">High</span>
                </div>
                <div className="h-40 flex items-end justify-between gap-2 px-2">
                  {STATS.revenueData.map((d, i) => (
                    <div key={i} className="flex-1 bg-amber-500/10 rounded-t relative group overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.value / 10000) * 100}%` }}
                        className="w-full bg-amber-500 group-hover:bg-amber-400 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-brand-border">
                <div className="flex justify-between items-center group">
                  <span className="text-xs text-text-secondary group-hover:text-white transition-colors">Super Chat Conversion</span>
                  <span className="text-xs font-bold text-brand-green font-mono">92%</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-xs text-text-secondary group-hover:text-white transition-colors">Investor Engagement</span>
                  <span className="text-xs font-bold text-white font-mono">Level 4</span>
                </div>
              </div>
            </ListingCard>

            <ListingCard className="p-8 border-brand-border bg-brand-void/50 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Operator Settings</h3>
              <div className="space-y-2">
                <button className="w-full p-4 rounded bg-brand-surface border border-brand-border flex items-center justify-between group hover:border-amber-500 transition-all">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Update Yield Ratio</span>
                  <Settings size={14} className="text-text-ghost group-hover:text-amber-500 transition-all" />
                </button>
                <button className="w-full p-4 rounded bg-brand-surface border border-brand-border flex items-center justify-between group hover:border-semantic-error transition-all">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Terminate Node</span>
                  <MoreVertical size={14} className="text-text-ghost" />
                </button>
              </div>
            </ListingCard>
          </div>
        </div>
      </main>
    </div>
  );
}
