
"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { GlobalActivityIntelligence } from '@/components/admin/GlobalActivityIntelligence';
import { GlobalRegionIntelligence } from '@/components/admin/GlobalRegionIntelligence';
import { 
  ShieldAlert, 
  Globe, 
  TrendingUp, 
  Activity, 
  Database,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSimulatedStats } from '@/lib/simulation-engine';
import { REGIONS } from '@/data/mockData';

const TABS = [
  { id: 'intelligence', label: 'Activity', icon: Activity },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'audit', label: 'Audit Logs', icon: Database },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Initial load on client to prevent hydration mismatch
    setStats(getSimulatedStats());
    const timer = setInterval(() => setStats(getSimulatedStats()), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (id: string) => setActiveTab(id);

  return (
    <div className="p-10 pb-32 max-w-[1600px] mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-brand-green" />
            <h1 className="text-4xl font-bold tracking-tight uppercase font-display italic leading-none">
              Command <span className="text-brand-green">Terminal.</span>
            </h1>
          </div>
          <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">
            Global Node Administration • 50,000 Agents • Level 5 Clearance
          </p>
        </div>
        
        <div className="flex gap-2 p-1 bg-brand-surface border border-brand-border rounded-lg overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-brand-green text-brand-void shadow-lg shadow-brand-green/20" 
                  : "text-text-muted hover:text-white hover:bg-brand-elevated"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Global Quick Stats */}
      {activeTab === 'intelligence' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListingCard className="p-8 border-brand-green/20 bg-brand-green/5 space-y-4">
            <div className="text-[10px] font-bold text-brand-green uppercase tracking-[0.3em]">Protocol Volume</div>
            <div className="text-4xl font-bold text-white font-mono">{stats.totalRevenueUsdt} <span className="text-lg opacity-40">USDT</span></div>
            <p className="text-xs text-text-muted">Total marketplace revenue processed across all nodes.</p>
          </ListingCard>
          <ListingCard className="p-8 border-white/5 bg-white/[0.02] space-y-4">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Network Population</div>
            <div className="text-4xl font-bold text-white font-mono">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-text-muted">Active students, teachers, and merchants in registry.</p>
          </ListingCard>
          <ListingCard className="p-8 border-white/5 bg-white/[0.02] space-y-4">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Trade Efficiency</div>
            <div className="text-4xl font-bold text-white font-mono">99.9%</div>
            <p className="text-xs text-text-muted">Successful automated escrow releases in last 24h.</p>
          </ListingCard>
        </div>
      )}

      <main>
        {activeTab === 'intelligence' && <GlobalActivityIntelligence />}
        {activeTab === 'regions' && <GlobalRegionIntelligence />}
        
        {activeTab === 'audit' && (
          <div className="space-y-12">
            <ListingCard className="p-10 border-brand-border bg-brand-surface">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Global System Registry</h3>
                <AppButton variant="secondary" size="sm" className="font-mono text-[10px] uppercase">Verify All Nodes</AppButton>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="p-4 bg-brand-void rounded border border-brand-border flex justify-between items-center group hover:border-brand-green transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                      <div>
                        <div className="text-xs font-bold text-white">PROTOCOL_AUDIT_LOG_0{i}</div>
                        <div className="text-[9px] text-text-muted uppercase font-mono">Origin: {REGIONS[i % REGIONS.length].name} Node</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-text-ghost">14:32:10 UTC</span>
                  </div>
                ))}
              </div>
            </ListingCard>
          </div>
        )}
      </main>
    </div>
  );
}
