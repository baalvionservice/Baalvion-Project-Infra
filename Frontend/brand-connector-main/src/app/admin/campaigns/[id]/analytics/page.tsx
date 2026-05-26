
'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Zap, 
  MousePointer2, 
  ShoppingBag, 
  IndianRupee, 
  Download,
  Loader2,
  Target,
  ArrowUpRight,
  ChevronRight,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function CampaignInsightsPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedCampaign, creatorPerformance, loading, fetchCampaignAnalytics, fetchCreatorPerformance } = useAnalyticsStore();

  useEffect(() => {
    if (params.id) {
      fetchCampaignAnalytics(params.id as string);
      fetchCreatorPerformance(params.id as string);
    }
  }, [params.id]);

  if (loading || !selectedCampaign) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: 'Total Reach', value: (selectedCampaign.reach / 1000).toFixed(0) + 'k', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Engagement', value: selectedCampaign.engagementRate + '%', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Clicks', value: selectedCampaign.clicks.toLocaleString(), icon: MousePointer2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversions', value: selectedCampaign.conversions, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaign Intelligence</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time performance metrics for project #{params.id?.slice(0,8)}</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </header>

      {/* Main ROI Card */}
      <Card className="border-none shadow-xl shadow-primary/5 rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <TrendingUp className="h-32 w-32" />
        </div>
        <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <Badge className="bg-primary border-none font-black text-[10px] tracking-widest px-4 py-1.5">CAMPAIGN ROI</Badge>
            <h2 className="text-6xl font-black tracking-tighter">
              {selectedCampaign.roi}%
            </h2>
            <p className="text-slate-400 font-medium text-lg">
              Generated <span className="text-emerald-400 font-black">₹{selectedCampaign.revenueGenerated.toLocaleString()}</span> in direct revenue
            </p>
          </div>
          
          <div className="w-full md:w-72 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>Budget Consumed</span>
                <span>100%</span>
              </div>
              <Progress value={100} className="h-1.5 bg-white/10" />
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                <p className="text-sm font-bold text-white uppercase tracking-widest">Analytics Finalized</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm rounded-2xl p-6 bg-white">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", kpi.bg, kpi.color)}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <h3 className="text-2xl font-black mt-1 text-slate-900">{kpi.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white h-full">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Conversion Trajectory</CardTitle>
              <CardDescription>Daily engagement and click-through performance</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedCampaign.timeline}>
                    <defs>
                      <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="clicks" stroke="#6C3AE8" strokeWidth={4} fillOpacity={1} fill="url(#colorClick)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Section */}
        <div className="lg:col-span-4">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white h-full">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Marketing Funnel</CardTitle>
              <CardDescription>Audience drop-off analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {[
                { label: 'Impressions', value: selectedCampaign.impressions, color: 'bg-primary' },
                { label: 'Engagement', value: Math.round(selectedCampaign.impressions * 0.05), color: 'bg-indigo-400' },
                { label: 'Clicks', value: selectedCampaign.clicks, color: 'bg-blue-400' },
                { label: 'Conversions', value: selectedCampaign.conversions, color: 'bg-emerald-400' },
              ].map((step, i, arr) => (
                <div key={step.label} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="text-slate-400">{step.label}</span>
                    <span className="text-slate-900">{step.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", step.color)} style={{ width: `${(step.value / arr[0].value) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Creator Performance Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <CardTitle className="text-xl">Creator Performance Audit</CardTitle>
          <CardDescription>Comparative analysis of campaign talent efficiency</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="h-14 hover:bg-transparent border-slate-100">
                <TableHead className="pl-8 font-black text-[10px] uppercase">Creator</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Reach</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Engagement</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Conversions</TableHead>
                <TableHead className="pr-8 font-black text-[10px] uppercase text-right">Performance Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatorPerformance.map((c) => (
                <TableRow key={c.creatorId} className="h-20 border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">{c.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-slate-900">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-600">{(c.impressions / 1000).toFixed(0)}k</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold">{c.engagement}%</Badge>
                  </TableCell>
                  <TableCell className="text-center font-black text-slate-900">{c.conversions}</TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-primary/5 text-primary border border-primary/10">
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span className="text-sm font-black">{c.roiScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
