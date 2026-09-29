'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  IndianRupee, 
  Zap, 
  PieChart as PieChartIcon, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  BarChart3,
  CreditCard,
  Building2,
  Users,
  Sparkles,
  Info
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
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

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
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

// Mock Data: Revenue Trend with 3-Month Forecast
const REVENUE_TREND_DATA = [
  { name: 'Jan', revenue: 850000, type: 'actual' },
  { name: 'Feb', revenue: 920000, type: 'actual' },
  { name: 'Mar', revenue: 1100000, type: 'actual' },
  { name: 'Apr', revenue: 1050000, type: 'actual' },
  { name: 'May', revenue: 1280000, type: 'actual' },
  { name: 'Jun', revenue: 1450000, type: 'actual' },
  { name: 'Jul', revenue: 1620000, type: 'actual' },
  // Forecast Data
  { name: 'Aug', revenue: 1850000, type: 'forecast' },
  { name: 'Sep', revenue: 2100000, type: 'forecast' },
  { name: 'Oct', revenue: 2450000, type: 'forecast' },
];

const REVENUE_SOURCES = [
  { name: 'Commissions', value: 60, color: '#6C3AE8' },
  { name: 'Subscriptions', value: 30, color: '#10B981' },
  { name: 'Featured Listings', value: 10, color: '#F97316' },
];

const REVENUE_BY_NICHE = [
  { niche: 'Tech', value: 420000, color: '#6C3AE8' },
  { niche: 'Fashion', value: 280000, color: '#EC4899' },
  { niche: 'Gaming', value: 150000, color: '#3B82F6' },
  { niche: 'Fitness', value: 120000, color: '#10B981' },
  { niche: 'Food', value: 95000, color: '#F97316' },
];

export default function AdminRevenueDashboard() {
  const stats = [
    { label: 'MRR', value: '₹12.4 L', trend: '+14.2%', icon: Zap, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'ARR (Proj.)', value: '₹1.48 Cr', trend: '+18.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Brand Spend', value: '₹8,450', trend: '+5.2%', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Estimated LTV', value: '₹48,200', trend: 'Stable', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-primary" />
            Revenue Intelligence
          </h1>
          <p className="text-slate-500 font-medium">Global platform economics, recurring revenue, and financial forecasting.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="90">
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-white font-bold border-slate-200 shadow-sm">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Last 90 Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="year">Full Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Financial Export
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
            <Card className="border-none shadow-sm rounded-2xl p-6 bg-white group hover:shadow-md transition-shadow">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">{stat.value}</h3>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold mt-2",
                stat.trend.startsWith('+') ? "text-emerald-600" : "text-slate-500"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.trend}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Growth Chart */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Revenue Velocity & Growth Forecast</CardTitle>
                <CardDescription>Consolidated platform earnings with Q4 AI projections.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                  <div className="h-2 w-2 rounded-full bg-primary" /> Actual
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase">
                  <div className="h-2 w-2 rounded-full border border-primary border-dashed bg-transparent" /> Forecast
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_TREND_DATA}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    {/* Actual Area */}
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      data={REVENUE_TREND_DATA.filter(d => d.type === 'actual')}
                      stroke="#6C3AE8" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                    />
                    {/* Forecast Area (Dotted) */}
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      data={REVENUE_TREND_DATA}
                      stroke="#6C3AE8" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Niche */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Market Value by Niche</CardTitle>
              <CardDescription>Top grossing creative categories across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_BY_NICHE} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="niche" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12, fontWeight: 800}}
                      width={80}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(val: number) => `₹${val.toLocaleString()}`} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                      {REVENUE_BY_NICHE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Revenue Source Donut */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={REVENUE_SOURCES}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {REVENUE_SOURCES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {REVENUE_SOURCES.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: item.color}} />
                      <span className="text-sm font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategic Insight Panel */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">AI Growth Insight</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Subscription revenue is up **22%** this month. Upselling **Growth Tier** to the top 15% of active Starter brands could increase MRR by an additional **₹1.8L**.
                </p>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg">
                View Conversion Strategy
              </Button>
            </CardContent>
          </Card>

          {/* Financial Protocol */}
          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Settlement Sync</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Actual revenue data is synchronized every 24h with the nodal bank clearing statements.
              </p>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
