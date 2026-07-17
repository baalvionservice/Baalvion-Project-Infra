
"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { GlobalActivityIntelligence } from '@/components/admin/GlobalActivityIntelligence';
import { GlobalRegionIntelligence } from '@/components/admin/GlobalRegionIntelligence';
import { Activity, Globe, Database, LayoutDashboard, Terminal, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSimulatedStats } from '@/lib/simulation-engine';
import { REGIONS } from '@/data/mockData';

const TABS = [
  { id: 'intelligence', label: 'Global Intel', icon: Activity },
  { id: 'regions', label: 'Regional Load', icon: Globe },
  { id: 'audit', label: 'Audit Tunnel', icon: Database },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('intelligence');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(getSimulatedStats());
    const timer = setInterval(() => setStats(getSimulatedStats()), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-10 pb-32 max-w-[1600px] mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-brand-green font-bold text-xs uppercase tracking-[0.3em]">
            <ShieldCheck className="w-4 h-4" /> MASTER OVERSIGHT PANEL
          </div>
          <h1 className="text-5xl font-bold tracking-tight uppercase font-display italic leading-none text-white">
            Command <span className="text-brand-green">Terminal.</span>
          </h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">
            Global Node Administration • 50,000 Agents • Level 5 Clearance
          </p>
        </div>
        
        <div className="flex gap-2 p-1 bg-brand-surface border border-brand-border rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {activeTab === 'intelligence' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ListingCard className="p-10 border-brand-green/20 bg-brand-green/5 space-y-6">
            <div className="text-[10px] font-bold text-brand-green uppercase tracking-[0.3em]">Protocol Volume</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">{stats.totalVolumeEth} <span className="text-lg opacity-40">ETH</span></div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-green">
              <Zap className="w-4 h-4" /> LIVE SETTLEMENTS
            </div>
          </ListingCard>
          <ListingCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Network Population</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
              <Activity className="w-4 h-4" /> 2,430 NODES ACTIVE
            </div>
          </ListingCard>
          <ListingCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Escrow Efficiency</div>
            <div className="text-5xl font-bold text-white font-mono leading-none">99.9%</div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <ShieldCheck className="w-4 h-4" /> SECURE TUNNELS
            </div>
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
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-brand-green" /> Global Protocol Audit Log
                  </h3>
                  <p className="text-[9px] text-text-muted font-mono uppercase">Full transaction transparency node</p>
                </div>
                <AppButton variant="secondary" size="sm" className="font-mono text-[9px] uppercase tracking-widest border-brand-border">Export Hash Log</AppButton>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="p-5 bg-brand-void rounded border border-brand-border flex justify-between items-center group hover:border-brand-green transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                      <div>
                        <div className="text-xs font-bold text-white uppercase font-mono tracking-tight">PROTOCOL_AUDIT_LOG_0{i}_HEX_8472</div>
                        <div className="text-[9px] text-text-muted uppercase font-mono mt-1">Origin: {REGIONS[i % REGIONS.length].name} Node • Hash: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-mono text-text-ghost">14:32:10 UTC</span>
                      <Badge variant="info" className="text-[8px] font-mono px-2">VERIFIED</Badge>
                    </div>
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
