
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  Activity, 
  Users, 
  Zap, 
  ShoppingBag, 
  TrendingUp, 
  Map as MapIcon, 
  Search,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LIVE_ACTIVITY_MOCK, REGIONS } from '@/data/mockData';
import { getSimulatedStats, generateLiveEvent } from '@/lib/simulation-engine';

export const GlobalActivityIntelligence = () => {
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState(LIVE_ACTIVITY_MOCK.events);

  useEffect(() => {
    // Initial load on client to prevent hydration mismatch
    setStats(getSimulatedStats());

    const interval = setInterval(() => {
      setStats(getSimulatedStats());
      
      if (Math.random() > 0.6) {
        const newEvent = generateLiveEvent();
        setEvents(prev => [newEvent, ...prev.slice(0, 10)]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return <div className="h-[400px] flex items-center justify-center text-text-muted uppercase font-mono text-xs tracking-widest">Synchronizing Node Data...</div>;
  }

  const statItems = [
    { label: 'Total Node Users', val: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-brand-green' },
    { label: 'Agents Online', val: stats.onlineUsers.toLocaleString(), sub: 'Browsing now', icon: Activity, color: 'text-semantic-info' },
    { label: 'Daily Orders', val: stats.dailyOrders.toLocaleString(), sub: 'Fulfilling', icon: ShoppingBag, color: 'text-semantic-warning' },
    { label: 'Total Volume (ETH)', val: stats.totalVolumeEth, sub: 'Protocol Swaps', icon: CreditCard, color: 'text-white' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase font-display italic">
            Global Activity <span className="text-brand-green">Intelligence.</span>
          </h2>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest mt-1">
            Deterministic Simulation • Live Operational Load
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-brand-green/10 px-4 py-2 rounded border border-brand-green/20">
            <Activity className="w-4 h-4 text-brand-green animate-pulse" />
            <span className="text-xs font-mono font-bold text-brand-green uppercase">Sync: Operational</span>
          </div>
        </div>
      </header>

      {/* Real-time Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, i) => (
          <ListingCard key={i} variant="stats" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded bg-brand-void border border-brand-border">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white font-mono">{stat.val}</div>
            {stat.sub && <div className="text-[9px] font-bold text-text-ghost uppercase mt-1">{stat.sub}</div>}
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Heatmap Placeholder */}
        <ListingCard className="lg:col-span-8 p-0 overflow-hidden border-brand-border bg-brand-surface relative h-[500px]">
          <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-void/50 backdrop-blur-md">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Global Node Load Heatmap
            </h3>
            <div className="flex gap-4">
              <Badge variant="live">LIVE MAP</Badge>
            </div>
          </div>
          
          <div className="h-full relative bg-brand-void p-12 overflow-hidden">
            {/* Mock SVG Map Visualization */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg viewBox="0 0 800 400" className="w-full h-full fill-white">
                <rect x="100" y="80" width="120" height="150" rx="40" />
                <rect x="350" y="60" width="200" height="180" rx="60" />
                <rect x="250" y="220" width="100" height="120" rx="30" />
              </svg>
            </div>

            {/* Hotspots */}
            <div className="relative w-full h-full">
              {REGIONS.map((region, i) => (
                <motion.div
                  key={region.id}
                  className="absolute"
                  style={{ 
                    top: `${25 + (i * 10)}%`, 
                    left: `${15 + (i * 12)}%` 
                  }}
                >
                  <div className="relative group cursor-crosshair">
                    <div className="w-4 h-4 rounded-full bg-brand-green animate-ping absolute inset-0 opacity-20" />
                    <div className="w-4 h-4 rounded-full bg-brand-green border-4 border-brand-void relative z-10" />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand-surface border border-brand-border px-3 py-1 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {region.name.toUpperCase()} • LOAD: {Math.floor(Math.random() * 40) + 40}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ListingCard>

        {/* Activity Feed */}
        <ListingCard className="lg:col-span-4 p-0 overflow-hidden border-brand-border bg-brand-surface flex flex-col">
          <div className="p-6 border-b border-brand-border bg-brand-void/50">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-green" /> Real-time Global Feed
            </h3>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar max-h-[440px]">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded bg-brand-void border border-brand-border relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="info" className="text-[8px] font-mono">NODE_{event.id.slice(-4).toUpperCase()}</Badge>
                    <span className="text-[9px] font-mono text-text-muted">{event.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">{event.text}</p>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green opacity-40" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ListingCard>
      </div>

      {/* Performance Leaderboards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Top Operators', items: ['Priya Sharma', 'Yuki Tanaka', 'Marcus Wright'], metric: '98% match' },
          { label: 'High Demand Assets', items: ['Garment Guide', 'Lithium Bulk', 'HFT Module'], metric: 'High Vol' },
          { label: 'Regional Growth', items: ['South Asia', 'East Asia', 'North America'], metric: '+42% growth' },
        ].map((board, i) => (
          <ListingCard key={i} className="p-6 bg-brand-surface border-brand-border">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 pb-2 border-b border-brand-border">
              {board.label}
            </h4>
            <div className="space-y-4">
              {board.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-text-ghost">0{idx + 1}</span>
                    <span className="text-xs font-bold text-white group-hover:text-brand-green transition-colors">{item}</span>
                  </div>
                  <Badge variant="info" className="text-[8px] px-1.5">{board.metric}</Badge>
                </div>
              ))}
            </div>
          </ListingCard>
        ))}
      </section>
    </div>
  );
};
