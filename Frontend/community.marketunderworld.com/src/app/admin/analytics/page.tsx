"use client"

import React, { useState, useEffect } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { GlobalRegionIntelligence } from '@/components/admin/GlobalRegionIntelligence';
import { TrendingUp, TrendingDown, Activity, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlatformStats, type PlatformStats } from '@/lib/api/admin-users';

function loginGrowthPercent(trend: PlatformStats['loginTrend']): number | null {
  if (!trend || trend.length < 14) return null;
  const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7).reduce((sum, d) => sum + Number(d.success), 0);
  const prev7 = sorted.slice(-14, -7).reduce((sum, d) => sum + Number(d.success), 0);
  if (prev7 === 0) return null;
  return ((last7 - prev7) / prev7) * 100;
}

export default function AnalyticsIntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    setMounted(true);
    getPlatformStats().then(setStats).catch(() => setStats(null));
  }, []);

  if (!mounted) return null;

  const growth = stats ? loginGrowthPercent(stats.loginTrend) : null;

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
          {
            label: 'Login Growth (7d vs prior 7d)',
            val: growth === null ? '—' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
            icon: growth !== null && growth < 0 ? TrendingDown : TrendingUp,
            color: growth !== null && growth < 0 ? 'text-semantic-error' : 'text-brand-green',
          },
          { label: 'Active Sessions', val: stats ? Number(stats.sessionCount.count).toLocaleString() : '—', icon: Activity, color: 'text-semantic-info' },
          { label: 'Organizations', val: stats ? Number(stats.orgCount.count).toLocaleString() : '—', icon: Database, color: 'text-white' },
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
