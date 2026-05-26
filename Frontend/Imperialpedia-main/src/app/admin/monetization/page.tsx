'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, 
  Zap, Loader2, Download, CreditCard, PieChart as PieIcon, 
  Globe, ArrowUpRight, ShieldCheck, ChevronRight, 
  Calendar, Layers, ArrowRight, Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { adminService } from '@/services/mock-api/admin';
import { RevenueMetric } from '@/types/admin';
import { cn } from '@/lib/utils';

export default function MonetizationGovernance() {
  const [revenue, setRevenue] = useState<RevenueMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await adminService.getRevenueTrends();
      setRevenue(res.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  if (loading) return (
    <div className="py-40 flex justify-center flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <Text variant="caption" className="animate-pulse font-bold tracking-widest uppercase">Syncing Monetization Nodes...</Text>
    </div>
  );

  const kpis = [
    { label: 'Monthly Revenue', value: '$168,000', icon: DollarSign, color: 'text-emerald-500', trend: '+12.4%' },
    { label: 'Active Subs', value: '7,100', icon: CreditCard, color: 'text-primary', trend: '+850' },
    { label: 'Avg. RPM', value: '$12.45', icon: Activity, color: 'text-secondary', trend: '+4.2%' },
    { label: 'Ad Yield', value: '92%', icon: Zap, color: 'text-amber-500', trend: 'Stable' }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <DollarSign className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Fiscal Orchestration</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Monetization Hub</Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4 text-primary" /> Monthly Statement
          </Button>
          <Button className="rounded-xl shadow-lg shadow-emerald-900/20 font-bold bg-emerald-600 hover:bg-emerald-700 h-11 px-8 transition-all scale-105 active:scale-95">
            <Download className="mr-2 h-4 w-4" /> Export Ledger
          </Button>
        </div>
      </header>

      {/* REVENUE VITALS MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((v) => (
          <Card key={v.label} className="glass-card border-none shadow-xl group hover:border-emerald-500/20 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-2.5 rounded-xl bg-background/50 border border-white/5 transition-transform group-hover:scale-110", v.color)}>
                  <v.icon size={20} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-white/10 bg-black/20">{v.trend}</Badge>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tighter">{v.value}</div>
                <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest mt-1">{v.label}</Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Revenue Momentum</CardTitle>
              <CardDescription>Correlation of subscriptions and ad-revenue yields.</CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold px-3">PRO ANALYTICS</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="subscriptions" name="Total Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <PieIcon size={16} /> Ad Network Yield
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { placement: "Header Leaderboard", ctr: "1.2%", yield: "$12,400", type: "Display" },
                  { placement: "In-Article Sponsorship", ctr: "3.5%", yield: "$22,100", type: "Sponsored" },
                  { placement: "Sidebar Tools", ctr: "0.8%", yield: "$4,200", type: "Affiliate" }
                ].map((ad, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="space-y-1">
                      <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors">{ad.placement}</Text>
                      <Text variant="caption" className="text-muted-foreground uppercase text-[8px] font-bold">{ad.type}</Text>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{ad.yield}</div>
                      <Text variant="label" className="text-[8px] text-emerald-500 font-bold">{ad.ctr} CTR</Text>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/10 border-t border-white/5">
              <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
                Review Ad Inventory
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <ShieldCheck size={16} /> Settlement Node
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "Next creator payout cycle: **Mar 25**. $42,500 currently held in the accrual buffer for 156 verified analysts."
            </Text>
          </Card>
        </div>
      </div>
    </div>
  );
}
