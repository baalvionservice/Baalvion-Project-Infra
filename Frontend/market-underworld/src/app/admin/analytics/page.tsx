"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { GlobalRegionIntelligence } from '@/components/admin/GlobalRegionIntelligence';
import { Globe, TrendingUp, Activity, Database, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsIntelligencePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Regional Intelligence</h1>
          <p className="text-text-muted font-medium">Global node distribution and activity mapping.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="success">SYNC: OPERATIONAL</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Growth Vector', val: '+42.8%', icon: TrendingUp, color: 'text-brand-green' },
          { label: 'Data Throughput', val: '1.2 PB/s', icon: Activity, color: 'text-semantic-info' },
          { label: 'Active Segments', val: '1,247', icon: Database, color: 'text-white' },
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

      <GlobalRegionIntelligence />
    </div>
  );
}
