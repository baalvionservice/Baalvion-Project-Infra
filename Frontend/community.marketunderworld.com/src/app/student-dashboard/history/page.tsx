"use client"

import React from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { Clock, Download, Search, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentHistoryPage() {
  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Activity Archive</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">A complete log of your historical node interactions.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 h-12 rounded bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            Filter by Date
          </button>
        </div>
      </header>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input 
              placeholder="Search historical records..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-brand-border/50">
          {[
            { event: "Session Completed", target: "Priya Sharma", date: "Mar 8, 2026", type: "education" },
            { event: "Purchase Authorized", target: "TechGadgets Store", date: "Mar 5, 2026", type: "marketplace" },
            { event: "Identity Re-verified", target: "South Asia Node", date: "Mar 1, 2026", type: "system" },
            { event: "Reward Claimed", target: "0.005 ETH", date: "Feb 28, 2026", type: "wallet" },
          ].map((log, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-ghost group-hover:text-brand-green transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{log.event}</div>
                  <div className="text-xs text-text-muted font-medium">{log.target} • {log.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="info" className="text-[8px] uppercase">{log.type}</Badge>
                <button className="p-2 text-text-ghost hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </ListingCard>
    </div>
  );
}