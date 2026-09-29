'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Zap, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  TrendingUp, 
  ChevronRight,
  Download,
  Calendar,
  Filter,
  MousePointer2,
  Rocket,
  ShieldCheck,
  MapPin,
  Clock,
  IndianRupee
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
  LineChart,
  Line
} from 'recharts';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker 
} from "react-simple-maps";

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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock Aggregated Data
const DAU_MAU_DATA = [
  { name: 'Mon', dau: 4500, mau: 12000 },
  { name: 'Tue', dau: 5200, mau: 12200 },
  { name: 'Wed', dau: 4800, mau: 12100 },
  { name: 'Thu', dau: 6100, mau: 12500 },
  { name: 'Fri', dau: 5500, mau: 12400 },
  { name: 'Sat', dau: 6700, mau: 12800 },
  { name: 'Sun', dau: 7200, mau: 13000 },
];

const FUNNEL_DATA = [
  { stage: 'Signup', value: 100, count: '12,440' },
  { stage: 'Onboarded', value: 75, count: '9,330' },
  { stage: '1st Campaign', value: 42, count: '5,224' },
  { stage: 'Repeat', value: 28, count: '3,110' },
];

const CAMPAIGN_VALUE_DATA = [
  { month: 'Jan', value: 12500 },
  { month: 'Feb', value: 18400 },
  { month: 'Mar', value: 15200 },
  { month: 'Apr', value: 22100 },
  { month: 'May', value: 28500 },
  { month: 'Jun', value: 31200 },
  { month: 'Jul', value: 34500 },
];

const TOP_NICHES = [
  { name: 'Tech', value: 45, color: '#6C3AE8' },
  { name: 'Fashion', value: 28, color: '#F97316' },
  { name: 'Fitness', value: 18, color: '#10B981' },
  { name: 'Gaming', value: 9, color: '#3B82F6' },
];

const GEO_MARKERS = [
  { name: "Mumbai", coordinates: [72.8777, 19.0760], count: 420 },
  { name: "New York", coordinates: [-74.006, 40.7128], count: 310 },
  { name: "London", coordinates: [-0.1278, 51.5074], count: 280 },
  { name: "Dubai", coordinates: [55.2708, 25.2048], count: 150 },
  { name: "Singapore", coordinates: [103.8198, 1.3521], count: 120 },
];

const COHORT_DATA = [
  { cohort: 'Jan 2024', size: 1200, m1: '100%', m2: '45%', m3: '38%', m4: '32%', m5: '28%' },
  { cohort: 'Feb 2024', size: 1450, m1: '100%', m2: '42%', m3: '35%', m4: '30%', m5: '-' },
  { cohort: 'Mar 2024', size: 1100, m1: '100%', m2: '48%', m3: '40%', m4: '-', m5: '-' },
  { cohort: 'Apr 2024', size: 1800, m1: '100%', m2: '51%', m3: '-', m4: '-', m5: '-' },
];

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function PlatformAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('90');

  const stats = [
    { label: 'Signup to Onboard', value: '75.2%', trend: '+4.5%', icon: Rocket, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Application Rate', value: '18.4', trend: 'per campaign', icon: MousePointer2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completion Rate', value: '94.1%', trend: 'milestones', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg. Project Value', value: '₹34,500', trend: '+12% MoM', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Intelligence</h1>
          <p className="text-slate-500 font-medium">Aggregate platform health, conversion funnels, and retention auditing.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
            <Download className="mr-2 h-4 w-4" /> Platform Export
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
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{stat.trend}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Retention & Funnel Section */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* User Stickiness (DAU/MAU) */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">User Stickiness (DAU/MAU)</CardTitle>
                <CardDescription>Daily active users compared to monthly footprint.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px] uppercase">Ratio: 42%</Badge>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DAU_MAU_DATA}>
                    <defs>
                      <linearGradient id="colorDAU" x1="0" y1="0" x2="0" y2="1">
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
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mau" 
                      stroke="#e2e8f0" 
                      strokeWidth={2} 
                      fillOpacity={0}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="dau" 
                      stroke="#6C3AE8" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorDAU)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Retention Cohorts */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Retention Cohort Analysis</CardTitle>
              <CardDescription>Percentage of users remaining active in subsequent months.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b h-14">
                    <th className="pl-8 text-left font-black text-[10px] uppercase text-slate-400">Cohort</th>
                    <th className="text-center font-black text-[10px] uppercase text-slate-400">Size</th>
                    <th className="text-center font-black text-[10px] uppercase text-slate-400">Month 1</th>
                    <th className="text-center font-black text-[10px] uppercase text-slate-400">Month 2</th>
                    <th className="text-center font-black text-[10px] uppercase text-slate-400">Month 3</th>
                    <th className="text-center font-black text-[10px] uppercase text-slate-400">Month 4</th>
                    <th className="pr-8 text-center font-black text-[10px] uppercase text-slate-400">Month 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {COHORT_DATA.map((row) => (
                    <tr key={row.cohort} className="h-16 group hover:bg-slate-50/50">
                      <td className="pl-8 font-bold text-slate-900">{row.cohort}</td>
                      <td className="text-center font-medium text-slate-500">{row.size}</td>
                      {[row.m1, row.m2, row.m3, row.m4, row.m5].map((val, i) => {
                        const intensity = parseInt(val) || 0;
                        return (
                          <td key={i} className="text-center">
                            <div className={cn(
                              "inline-flex items-center justify-center w-12 h-8 rounded-lg font-black text-[10px]",
                              intensity >= 80 ? "bg-primary text-white" :
                              intensity >= 40 ? "bg-primary/20 text-primary" :
                              intensity > 0 ? "bg-primary/5 text-primary/60" : "text-slate-200"
                            )}>
                              {val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Funnels & Distribution */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Conversion Funnel */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Growth Funnel Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {FUNNEL_DATA.map((item, i) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700 uppercase tracking-widest">{item.stage}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-primary" 
                    />
                  </div>
                  {i < FUNNEL_DATA.length - 1 && (
                    <div className="flex justify-center -my-1">
                      <div className="h-4 w-px bg-slate-100 border-dashed border-l" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white h-[450px] flex flex-col">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Market Density
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-slate-50/30">
              <ComposableMap projectionConfig={{ scale: 140 }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#E2E8F0"
                        stroke="#FFFFFF"
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#CBD5E1", outline: "none" },
                        }}
                      />
                    ))
                  }
                </Geographies>
                {GEO_MARKERS.map(({ name, coordinates, count }) => (
                  <Marker key={name} coordinates={coordinates as [number, number]}>
                    <circle r={Math.sqrt(count) / 2} fill="#6C3AE8" opacity={0.6} />
                    <text
                      textAnchor="middle"
                      y={-10}
                      style={{ fontFamily: "Inter", fontSize: "8px", fill: "#64748b", fontWeight: 800 }}
                    >
                      {name}
                    </text>
                  </Marker>
                ))}
              </ComposableMap>
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-2xl border shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">High Volume Regions</p>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-700">South Asia (Mumbai)</span>
                  <span className="text-primary">+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niche Volume */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Market Share by Niche</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TOP_NICHES} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}}
                      width={60}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {TOP_NICHES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </aside>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex items-start gap-6 shadow-xl relative overflow-hidden group">
          <Zap className="absolute -right-4 -top-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-lg font-bold">LTV Optimization</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Users who complete 2+ campaigns within their first 60 days have a **3.4x higher** lifetime value. Focusing Q3 onboarding on technical validation.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Geographic Expansion</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              We are seeing a **22% rise** in European brand registrations. Suggesting localized currency support for EUR in the next billing update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
