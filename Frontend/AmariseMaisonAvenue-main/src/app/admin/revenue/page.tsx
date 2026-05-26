'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowRight,
  Activity, 
  Zap, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  ArrowDownRight, 
  BrainCircuit, 
  Scale, 
  ShieldCheck, 
  Sparkles,
  BarChart3,
  BadgeDollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from '@/lib/store';
import { useSimulationData } from '@/hooks/use-simulation-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { getAnalytics } from '@/lib/analytics/mock-data';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Area,
  AreaChart,
  Line,
  CartesianGrid
} from 'recharts';

/**
 * Bank-Grade Revenue Matrix: Tactical Yield oversight.
 * Enhanced with 1-Hour Predictive Horizon Node for Jurisdictional Liquidity Tracking.
 */
export default function RevenueDashboard() {
  const { scopedInquiries, currentUser, transactions, countryConfigs } = useAppStore();
  const { regions, globalPredictedInflow } = useSimulationData();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const stats = useMemo(() => {
    if (!currentUser) return null;
    return getAnalytics(currentUser.role, currentUser.country);
  }, [currentUser]);

  const revenueByHub = useMemo(() => {
    return countryConfigs.map(c => {
      const hubTransactions = transactions.filter(t => t.country.toLowerCase() === c.code.toLowerCase() && t.status === 'Settled');
      return {
        country: c.name,
        value: hubTransactions.reduce((acc, t) => acc + t.amount, 0),
        code: c.code
      };
    });
  }, [transactions, countryConfigs]);

  const totalSettledRevenue = useMemo(() => 
    revenueByHub.reduce((a, b) => a + b.value, 0),
  [revenueByHub]);

  const funnelData = {
    visitors: 425000,
    leads: scopedInquiries.length * 100, 
    buyers: transactions.filter(t => t.status === 'Settled').length * 50 
  };

  const revenueTrends = [
    { date: '01 Mar', revenue: 42000, forecast: 40000 },
    { date: '05 Mar', revenue: 38000, forecast: 41000 },
    { date: '10 Mar', revenue: 52000, forecast: 45000 },
    { date: '15 Mar', revenue: 48000, forecast: 50000 },
    { date: '20 Mar', revenue: 61000, forecast: 55000 },
    { date: '25 Mar', revenue: 59000, forecast: 62000 },
    { date: '30 Mar', revenue: 74000, forecast: 70000 },
  ];

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-body">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-1">
          <nav className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30 flex items-center space-x-2">
             <Link href="/admin" className="hover:text-white transition-colors">Terminal</Link>
             <ChevronRight className="w-2 h-2" />
             <span className="text-white">Yield Matrix</span>
          </nav>
          <h1 className="text-3xl font-headline font-bold italic tracking-tight text-white uppercase">Revenue Matrix</h1>
          <p className="text-xs text-white/40 font-light italic">Jurisdictional Unit Economics & Predictive Yield</p>
        </div>
        <div className="flex items-center space-x-4">
             <div className="flex bg-[#111113] border border-white/10 p-0.5">
                {(['daily', 'weekly', 'monthly'] as const).map(range => (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all",
                      timeRange === range ? "bg-plum text-white" : "text-white/20 hover:text-plum"
                    )}
                  >
                    {range}
                  </button>
                ))}
             </div>
            <Link href="/admin/finance">
              <div className="w-9 h-9 bg-plum rounded-none flex items-center justify-center font-headline text-lg font-bold italic text-white shadow-xl hover:bg-black transition-colors cursor-pointer">RM</div>
            </Link>
          </div>
      </header>

      {/* Primary Metrics: Tactical Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Net Settled Yield" value={`$${(totalSettledRevenue / 1000).toFixed(1)}k`} trend="+14.2% MoM" positive href="/admin/finance" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="1h Incoming Yield" value={`$${(globalPredictedInflow / 1000).toFixed(1)}k`} trend="Predicted Inflow" color="text-blue-400" positive />
        <StatCard icon={<Scale className="w-4 h-4" />} label="Tax Compliance" value="Verified" trend="Audited" positive href="/admin/compliance" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Mean Acquisition" value="$42.5k" trend="+8.4%" positive href="/admin/sales" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Yield Chart: Sharp Line Aesthetics */}
        <div className="lg:col-span-8 space-y-8">
           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden">
             <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-6 bg-white/[0.02]">
               <div className="space-y-1">
                 <div className="flex items-center space-x-2 text-blue-400">
                   <BrainCircuit className="w-4 h-4" />
                   <CardTitle className="font-headline text-xl uppercase italic">Yield Trajectory</CardTitle>
                 </div>
                 <p className="text-[9px] uppercase tracking-widest text-white/20">Actual revenue vs AI forecasted yield</p>
               </div>
               <div className="flex items-center space-x-4">
                  <LegendNode color="bg-plum" label="ACTUAL" />
                  <LegendNode color="bg-blue-500" label="FORECAST" />
               </div>
             </CardHeader>
             <CardContent className="p-8">
               <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={revenueTrends}>
                     <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#7E3F98" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="#7E3F98" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#666', fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#666'}} tickFormatter={(val) => `$${val/1000}k`} />
                     <Tooltip 
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="bg-black text-white p-4 border border-white/10 shadow-2xl space-y-2 rounded-none">
                               <p className="text-[7px] font-bold uppercase tracking-[0.4em] text-white/40 border-b border-white/5 pb-1.5">{payload[0].payload.date}</p>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-plum tabular">Settled: ${(payload[0].value as number).toLocaleString()}</p>
                                  <p className="text-[10px] font-bold text-blue-400 tabular">Target: ${(payload[1].value as number).toLocaleString()}</p>
                               </div>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Area type="monotone" dataKey="revenue" stroke="#7E3F98" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                     <Line type="monotone" dataKey="forecast" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>

           {/* 1-Hour Forecast Horizon Node: Jurisdictional Liquidity Tracking */}
           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02] flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-blue-400">
                       <Clock className="w-4 h-4" />
                       <CardTitle className="font-headline text-lg uppercase italic tracking-tight">1-Hour Forecast Horizon</CardTitle>
                    </div>
                    <p className="text-[8px] uppercase tracking-widest text-white/20">Incoming liquidity based on active cart resonance</p>
                 </div>
                 <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none px-3 h-7 rounded-none text-[7px] font-bold uppercase tracking-widest">
                    Neural Flow Active
                 </Badge>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-white/[0.01]">
                       <TableRow className="border-white/5 h-10">
                          <TableHead className="text-[8px] uppercase font-bold pl-6 text-white/40">Market Hub</TableHead>
                          <TableHead className="text-[8px] uppercase font-bold text-white/40 text-center">Active Carts</TableHead>
                          <TableHead className="text-[8px] uppercase font-bold text-white/40 text-center">Conv. Prob.</TableHead>
                          <TableHead className="text-[8px] uppercase font-bold text-right pr-6 text-white/40">Inflow</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {Object.values(regions).map(hub => (
                         <TableRow key={hub.id} className="hover:bg-white/5 transition-colors border-white/5 h-12">
                            <TableCell className="pl-6 font-bold text-[10px] text-white/80 uppercase tracking-widest">{hub.name}</TableCell>
                            <TableCell className="text-xs font-body font-bold text-white/60 tabular text-center">{hub.cart}</TableCell>
                            <TableCell>
                               <div className="flex items-center justify-center space-x-2">
                                  <Progress value={((hub.purchased / (hub.activeUsers || 1)) * 100) * 2} className="h-0.5 w-12 bg-white/5" />
                                  <span className="text-[8px] font-bold text-blue-400 tabular">{((hub.purchased / (hub.activeUsers || 1)) * 100).toFixed(1)}%</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                               <span className="text-xs font-bold text-blue-400 tabular">${hub.predictedInflow.toLocaleString()}</span>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </div>

        {/* Tactical Conversion Pipeline */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-[#111113] border-white/5 rounded-none shadow-2xl">
            <CardHeader className="border-b border-white/5 p-5 bg-white/[0.02]">
              <CardTitle className="font-headline text-lg text-white">Acquisition Funnel</CardTitle>
              <p className="text-[8px] uppercase tracking-widest text-white/20">Institutional Conversion Index</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <FunnelStep label="Global Visitors" value={funnelData.visitors} color="bg-white/5" />
              <FunnelStep label="Verified Leads" value={funnelData.leads} color="bg-blue-500/10" percent={(funnelData.leads / funnelData.visitors * 100).toFixed(1) + '%'} />
              <FunnelStep label="Successful Buyers" value={funnelData.buyers} color="bg-plum/20" percent={(funnelData.buyers / funnelData.leads * 100).toFixed(1) + '%'} />
              
              <div className="pt-6 border-t border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Pipeline Velocity</span>
                    <span className="text-xs font-bold text-blue-400 tabular">{(funnelData.buyers / funnelData.visitors * 100).toFixed(2)}%</span>
                 </div>
                 <Progress value={(funnelData.buyers / funnelData.visitors * 100) * 10} className="h-0.5 bg-white/5" />
              </div>
              <Link href="/admin/sales">
                <Button className="w-full h-10 bg-white text-black hover:bg-plum hover:text-white rounded-none text-[8px] font-bold uppercase tracking-widest transition-all">
                  MANAGE SALES PIPELINE
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Strategic Alert: Yield Volatility */}
          <div className="bg-blue-500/5 border border-blue-500/20 p-6 space-y-3 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                <Sparkles className="w-16 h-16 text-blue-400" />
             </div>
             <div className="flex items-center space-x-2 text-blue-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <h4 className="text-[9px] font-bold uppercase tracking-widest">Inflow Prediction</h4>
             </div>
             <p className="text-[10px] text-white/60 font-light italic leading-relaxed relative z-10">
               "High activity across jurisdictional carts. Potential $125k yield surge predicted."
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LegendNode({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center space-x-1.5">
       <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
       <span className="text-[7px] font-bold uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

function FunnelStep({ label, value, color, percent }: { label: string, value: number, color: string, percent?: string }) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-end">
        <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">{label}</span>
        <div className="text-right">
           <span className="text-base font-body font-bold tabular text-white">{value.toLocaleString()}</span>
           {percent && <span className="text-[7px] font-bold text-blue-400 block leading-none tabular tracking-tighter">{percent} yield</span>}
        </div>
      </div>
      <div className={cn("h-6 w-full border border-white/5 transition-all group-hover:scale-[1.01]", color)} />
    </div>
  );
}

function StatCard({ icon, label, value, trend, positive, color = "text-white", href }: { icon: any, label: string, value: string, trend: string, positive: boolean, color?: string, href?: string }) {
  const content = (
    <Card className="bg-[#111113] border-white/5 p-5 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-2xl h-full">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/5 rounded-none group-hover:bg-blue-500/10 transition-colors text-blue-400 border border-white/5">{icon}</div>
        <div className={cn(
          "flex items-center text-[8px] font-bold tracking-widest uppercase",
          positive ? "text-emerald-400" : "text-red-500"
        )}>
          {trend} {positive ? <ArrowUpRight className="ml-1 w-2.5 h-2.5" /> : <ArrowDownRight className="ml-1 w-2.5 h-2.5" />}
        </div>
      </div>
      <div>
        <div className="text-white/20 text-[8px] uppercase tracking-[0.4em] font-bold group-hover:text-white/40 transition-colors">{label}</div>
        <div className={cn("text-2xl font-body font-bold tabular mt-1.5 group-hover:text-white", color)}>{value}</div>
      </div>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
