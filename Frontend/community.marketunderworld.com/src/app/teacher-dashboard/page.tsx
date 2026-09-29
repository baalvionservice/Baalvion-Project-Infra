"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Zap, Users, CreditCard, MessageSquare, Plus, ArrowUpRight, Play, Clock, TrendingUp } from 'lucide-react';
import { STATS, LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function TeacherDashboardOverview() {
  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white uppercase italic font-display">Operator <span className="text-semantic-warning">Terminal.</span></h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Node: South Asia #847 • Clearance: Level 3</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-semantic-warning text-black h-12 px-8 font-bold font-mono text-[11px] uppercase">
            <Play className="w-4 h-4 mr-2" /> Initialize Broadcast
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'My Students', val: '1,240', icon: Users, color: 'text-semantic-info' },
          { label: 'Total Revenue', val: '12.4 ETH', icon: CreditCard, color: 'text-brand-green' },
          { label: 'Marketplace Volume', val: '842', icon: Zap, color: 'text-semantic-warning' },
          { label: 'Active Codes', val: '3', icon: MessageSquare, color: 'text-white' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ListingCard className="lg:col-span-8 p-10 border-brand-border bg-brand-surface">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-green" /> Revenue Performance
            </h3>
            <Badge variant="success">SYNC: LIVE</Badge>
          </div>
          <div className="h-[350px] flex items-end justify-between gap-2 px-4">
            {STATS.revenueData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full bg-brand-void rounded-t relative overflow-hidden h-full flex flex-col justify-end">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / 10000) * 100}%` }}
                    className="w-full bg-semantic-warning opacity-20 group-hover:opacity-40 transition-all"
                  />
                  <div className="absolute top-2 w-full text-center text-[8px] font-mono text-text-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.value}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase font-mono">{d.name}</span>
              </div>
            ))}
          </div>
        </ListingCard>

        <ListingCard className="lg:col-span-4 p-10 space-y-8 border-brand-border bg-brand-surface">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Secret Discount Protocols</h3>
          <div className="space-y-4">
            {[
              { code: 'SECRET70', discount: '70%', status: 'Active' },
              { code: 'MU10', discount: '10%', status: 'Active' },
            ].map(code => (
              <div key={code.code} className="p-4 bg-brand-void rounded border border-brand-border flex justify-between items-center group hover:border-semantic-warning transition-all">
                <div>
                  <div className="font-mono font-bold text-white text-sm">{code.code}</div>
                  <div className="text-[10px] text-text-muted uppercase font-bold">{code.discount} OFF</div>
                </div>
                <Badge variant="success" className="bg-brand-green/10 text-brand-green border-none">{code.status}</Badge>
              </div>
            ))}
            <AppButton variant="secondary" className="w-full border-dashed border-brand-border h-12 font-mono text-[10px] uppercase">
              <Plus className="w-4 h-4 mr-2" /> Generate Security Key
            </AppButton>
          </div>
        </ListingCard>
      </div>
    </div>
  );
}
