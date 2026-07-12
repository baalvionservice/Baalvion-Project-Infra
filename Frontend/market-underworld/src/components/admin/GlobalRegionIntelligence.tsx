"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { REGIONS } from '@/data/mockData';
import { Globe, Users, Zap, ShoppingBag, Map as MapIcon, ChevronRight, Languages, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GlobalRegionIntelligence = () => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold uppercase font-display italic">Global <span className="text-brand-green">Region Intelligence.</span></h2>
        <p className="text-text-muted font-mono text-xs uppercase tracking-widest mt-1">Cross-Node Analytics & Geographic Load</p>
      </header>

      {/* Identity Matrix Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListingCard className="p-6 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-green/10 rounded border border-brand-green/20">
              <Fingerprint className="w-5 h-5 text-brand-green" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Identity Distribution</div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Mobile Node', val: '64%', trend: '↑ +4%' },
              { label: 'Desktop Hub', val: '28%', trend: '↓ -1%' },
              { label: 'Direct Tunnel', val: '8%', trend: '↑ +2%' }
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-end">
                <div className="text-xs text-text-secondary font-medium">{stat.label}</div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">{stat.val}</div>
                  <div className="text-[8px] text-brand-green font-bold">{stat.trend}</div>
                </div>
              </div>
            ))}
          </div>
        </ListingCard>

        <ListingCard className="p-6 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-semantic-info/10 rounded border border-semantic-info/20">
              <Languages className="w-5 h-5 text-semantic-info" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Language Protocols</div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'English', val: '42%' },
              { label: 'Hindi / Regional', val: '18%' },
              { label: 'Mandarin', val: '14%' },
              { label: 'Other Protocols', val: '26%' }
            ].map((stat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-text-muted uppercase">{stat.label}</span>
                  <span className="text-white">{stat.val}</span>
                </div>
                <div className="h-1 bg-brand-void rounded-full overflow-hidden">
                  <div className="h-full bg-semantic-info" style={{ width: stat.val }} />
                </div>
              </div>
            ))}
          </div>
        </ListingCard>

        <ListingCard className="p-6 bg-brand-surface border-brand-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-green/10 rounded border border-brand-green/20">
              <Globe className="w-5 h-5 text-brand-green" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Traffic Source Origin</div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Organic Referral', val: '52%' },
              { label: 'Teacher Sessions', val: '31%' },
              { label: 'Dark Nodes', val: '12%' },
              { label: 'Direct Entry', val: '5%' }
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="text-xs text-text-secondary group-hover:text-brand-green transition-colors">{stat.label}</div>
                <div className="text-xs font-bold text-white font-mono">{stat.val}</div>
              </div>
            ))}
          </div>
        </ListingCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive Map Block */}
        <ListingCard className="lg:col-span-8 p-0 overflow-hidden bg-brand-surface relative border-brand-border h-[500px]">
          <div className="p-6 border-b border-brand-border bg-brand-void/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Global Identity Load
            </span>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="text-[9px] font-bold text-text-muted uppercase">High Load</span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-full bg-brand-void p-12 overflow-hidden">
            <svg viewBox="0 0 800 400" className="w-full h-full opacity-10 fill-white">
              <path d="M150,150 Q200,100 250,150 T350,150" stroke="currentColor" fill="none" />
              <rect x="100" y="80" width="120" height="150" rx="40" />
              <rect x="350" y="60" width="200" height="180" rx="60" />
              <rect x="250" y="220" width="100" height="120" rx="30" />
            </svg>

            {REGIONS.map((region, i) => (
              <motion.div
                key={region.id}
                className="absolute"
                style={{ 
                  top: `${25 + (i * 10)}%`, 
                  left: `${15 + (i * 12)}%` 
                }}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <div className="relative group cursor-crosshair">
                  <div className="w-4 h-4 rounded-full bg-brand-green animate-ping absolute inset-0 opacity-20" />
                  <div className="w-4 h-4 rounded-full bg-brand-green border-4 border-brand-void relative z-10" />
                  
                  {hoveredRegion === region.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50"
                    >
                      <div className="bg-brand-surface border border-brand-border p-5 rounded shadow-2xl min-w-[220px]">
                        <div className="text-[10px] font-bold text-brand-green uppercase mb-3 flex items-center justify-between">
                          {region.name}
                          <Badge variant="info">{(region.countries?.length ?? 0)} Nodes</Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-text-muted uppercase">Users Detected</span>
                            <span className="text-white font-mono">{(region.teachers ?? 0) * 42}</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-text-muted uppercase">Local Streams</span>
                            <span className="text-white font-mono">{region.sessions ?? 0}</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-text-muted uppercase">Node Revenue</span>
                            <span className="text-brand-green font-mono">{((region.sessions ?? 0) * 1.2).toFixed(1)} ETH</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ListingCard>

        {/* Real-time Connection Log */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2 px-2">
            <Zap className="w-4 h-4 text-brand-green" /> Identity Connection Log
          </h3>
          <div className="space-y-3 max-h-[440px] overflow-y-auto no-scrollbar">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i}
                className="p-4 bg-brand-surface border border-brand-border rounded hover:border-brand-green transition-all group animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    <span className="text-[10px] font-mono text-white">IP: 103.24.{i}.{Math.floor(Math.random() * 255)}</span>
                  </div>
                  <span className="text-[8px] text-text-muted font-bold font-mono">JUST NOW</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-bold text-text-secondary">Node: {REGIONS[i % REGIONS.length].id.toUpperCase()}</div>
                  <Badge variant="info" className="text-[8px]">ROUTED</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
