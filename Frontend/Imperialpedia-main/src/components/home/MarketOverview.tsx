'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { TrendingUp, TrendingDown, Activity, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Market Overview Component.
 * Provides high-level telemetry on indices, gainers, and losers.
 */
export function MarketOverview() {
  const indices = [
    { label: 'S&P 500', value: '5,120.42', change: '+1.24%', trend: 'up' },
    { label: 'NASDAQ', value: '16,274.94', change: '+1.56%', trend: 'up' },
    { label: 'DOW 30', value: '38,905.66', change: '-0.12%', trend: 'down' },
    { label: 'BTC/USD', value: '$64,250', change: '+5.20%', trend: 'up' },
  ];

  const topGainers = [
    { name: 'NVIDIA (NVDA)', price: '$875.20', change: '+5.24%' },
    { name: 'Tesla (TSLA)', price: '$175.30', change: '+2.10%' },
  ];

  const topLosers = [
    { name: 'Apple (AAPL)', price: '$182.50', change: '-0.85%' },
    { name: 'Intel (INTC)', price: '$42.15', change: '-1.42%' },
  ];

  return (
    <section className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <Text variant="h2" className="text-2xl lg:text-3xl font-bold">Market Overview</Text>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-bold text-[10px] uppercase h-8 px-4 gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Wires Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Indices Matrix */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((idx) => (
            <Card key={idx.label} className="glass-card border-none shadow-xl hover:border-primary/20 transition-all group cursor-default">
              <CardContent className="p-6 space-y-2">
                <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest">{idx.label}</Text>
                <div className="text-2xl font-bold tracking-tighter">{idx.value}</div>
                <div className={cn(
                  "flex items-center text-[10px] font-bold",
                  idx.trend === 'up' ? "text-emerald-500" : "text-destructive"
                )}>
                  {idx.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {idx.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gainers / Losers Vertical */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          <Card className="glass-card border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-white/5 h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Gainers</span>
                  </div>
                  {topGainers.map(g => (
                    <div key={g.name} className="space-y-0.5">
                      <div className="text-xs font-bold truncate">{g.name}</div>
                      <div className="text-xs text-emerald-500 font-mono">{g.change}</div>
                    </div>
                  ))}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Losers</span>
                  </div>
                  {topLosers.map(l => (
                    <div key={l.name} className="space-y-0.5">
                      <div className="text-xs font-bold truncate">{l.name}</div>
                      <div className="text-xs text-destructive font-mono">{l.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
