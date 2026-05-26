'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Target, 
  ChevronRight, 
  Download, 
  Calendar,
  Loader2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Area, Tooltip, XAxis, YAxis } from 'recharts';

// Lazy load heavy chart components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });

// Mock Aggregated Data
const AGGREGATED_TRENDS = [
  { month: 'Jan', spend: 45000, reach: 120000 },
  { month: 'Feb', spend: 85000, reach: 280000 },
  { month: 'Mar', spend: 120000, reach: 450000 },
  { month: 'Apr', spend: 95000, reach: 380000 },
  { month: 'May', spend: 160000, reach: 680000 },
  { month: 'Jun', spend: 210000, reach: 920000 },
  { month: 'Jul', spend: 185000, reach: 1245000 },
];

const CAMPAIGN_TABLE = [
  { title: 'AI Smart Home Review', status: 'ACTIVE', spend: 45000, reach: '1.2M', roi: '4.5x' },
  { title: 'Summer Organic Linen', status: 'COMPLETED', spend: 12500, reach: '450k', roi: '3.8x' },
  { title: 'Morning Vitality Series', status: 'COMPLETED', spend: 22000, reach: '890k', roi: '4.1x' },
  { title: 'Night Recovery Serum', status: 'ACTIVE', spend: 35000, reach: '620k', roi: '3.2x' },
];

export default function GlobalBrandAnalytics() {
  const [timeRange, setTimeRange] = useState('90');

  const stats = useMemo(() => [
    { label: 'Total Portfolio Reach', value: '4.8M+', trend: '+18.4%', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Total Capital Spent', value: '₹8,42,500', trend: '+12.5%', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Campaign ROI', value: '4.2x', trend: '+0.8x', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Top Performing Niche', value: 'Gaming', trend: '5.1x ROI', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], []);

  const handleExport = useCallback(() => {
    // Export logic implementation
    console.log('Exporting analytics for range:', timeRange);
  }, [timeRange]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Analytics</h1>
          <p className="text-slate-500 font-medium">Aggregate performance overview for all campaigns and creators.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-white font-bold border-slate-200">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Last 90 Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="year">Full Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl p-6 bg-white group hover:shadow-md transition-shadow">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">{stat.value}</h3>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold mt-2",
                stat.trend.startsWith('+') ? "text-emerald-600" : "text-slate-500"
              )}>
                {stat.trend}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Growth Area */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Spending Velocity & Impact</CardTitle>
                <CardDescription>Correlation between capital allocation and audience reach.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={AGGREGATED_TRENDS}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    />
                    <Area
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#6C3AE8" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSpend)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#10B981" 
                      strokeWidth={4} 
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Comparison Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Campaign ROI Audit</CardTitle>
              <CardDescription>Comparative overview of marketing project efficiency.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-16">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Campaign</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Budget</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Total Reach</TableHead>
                    <TableHead className="pr-8 font-black text-[10px] uppercase tracking-widest text-right">ROI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CAMPAIGN_TABLE.map((row, i) => (
                    <TableRow key={row.title} className="border-slate-50 group hover:bg-slate-50/50 transition-colors h-20">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.title}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Reference #{i+100}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border-none",
                          row.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">₹{row.spend.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-black text-primary">{row.reach}</TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/5 text-primary border border-primary/10">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-sm font-black">{row.roi}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Side panel content here */}
        </aside>
      </div>
    </div>
  );
}
