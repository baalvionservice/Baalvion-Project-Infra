'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Info,
  Clock,
  MapPin,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock Data
const GROWTH_DATA = [
  { date: 'Jun 01', followers: 820000, er: 5.2 },
  { date: 'Jun 05', followers: 825000, er: 5.4 },
  { date: 'Jun 10', followers: 832000, er: 5.1 },
  { date: 'Jun 15', followers: 838000, er: 5.8 },
  { date: 'Jun 20', followers: 842000, er: 5.6 },
  { date: 'Jun 25', followers: 848000, er: 5.9 },
  { date: 'Jun 30', followers: 850000, er: 5.8 },
];

const GENDER_DATA = [
  { name: 'Female', value: 65, color: '#6C3AE8' },
  { name: 'Male', value: 28, color: '#F97316' },
  { name: 'Non-binary', value: 7, color: '#94a3b8' },
];

const AGE_DATA = [
  { range: '13-17', value: 12 },
  { range: '18-24', value: 45 },
  { range: '25-34', value: 30 },
  { range: '35-44', value: 8 },
  { range: '45+', value: 5 },
];

const LOCATION_DATA = [
  { city: 'Mumbai', count: 120000 },
  { city: 'New York', count: 85000 },
  { city: 'London', count: 62000 },
  { city: 'Dubai', count: 45000 },
  { city: 'Singapore', count: 38000 },
];

const PLATFORM_BREAKDOWN = [
  { name: 'Instagram', reach: '1.2M', er: '5.8%', color: 'bg-pink-500' },
  { name: 'YouTube', reach: '850k', er: '4.2%', color: 'bg-red-500' },
  { name: 'TikTok', reach: '420k', er: '8.1%', color: 'bg-slate-900' },
];

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_HOURS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'];

export default function CreatorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Performance Analytics</h1>
          <p className="text-slate-500 mt-1">Deep insights into your audience reach and engagement metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-white rounded-xl font-bold">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Last 30 Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl font-bold bg-white">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 12.5%
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Followers</p>
            <h3 className="text-3xl font-black mt-1 tracking-tight">850,000</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-2">+4,200 since last week</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 4.2%
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg. Engagement Rate</p>
            <h3 className="text-3xl font-black mt-1 tracking-tight">5.82%</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-2">Platform average: 3.1%</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className="bg-red-100 text-red-600 border-none font-bold">
                <ArrowDownRight className="h-3 w-3 mr-1" /> 2.1%
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monthly Total Reach</p>
            <h3 className="text-3xl font-black mt-1 tracking-tight">2.4M</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-2">Unique accounts across platforms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 px-8 py-6">
            <div>
              <CardTitle className="text-lg">Follower Growth Trend</CardTitle>
              <CardDescription>Visualizing your influence scale over time</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-primary uppercase">Followers</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    itemStyle={{fontWeight: 800, fontSize: '14px'}}
                    labelStyle={{fontWeight: 600, color: '#64748b', marginBottom: '4px'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="followers" 
                    stroke="#6C3AE8" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorFollowers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audience Breakdown: Gender */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/50 px-8 py-6 text-center md:text-left">
            <CardTitle className="text-lg">Audience Gender</CardTitle>
            <CardDescription>Gender distribution of your viewers</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={GENDER_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {GENDER_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {GENDER_DATA.map((item) => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Demographics */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="px-8 py-6 border-b bg-slate-50/50">
            <CardTitle className="text-lg">Age Distribution</CardTitle>
            <CardDescription>Most of your audience is in the 18-24 range</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AGE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="range" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#6C3AE8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="px-8 py-6 border-b bg-slate-50/50">
            <CardTitle className="text-lg">Top Geographical Locations</CardTitle>
            <CardDescription>Top cities by unique viewer count</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {LOCATION_DATA.map((loc, i) => (
                <div key={loc.city} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{loc.city}</span>
                    </div>
                    <span className="text-primary">{(loc.count / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(loc.count / LOCATION_DATA[0].count) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-primary/20 border-r-4 border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Heatmap - Optimal Posting Times */}
      <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="px-8 py-6 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Content Performance Heatmap</CardTitle>
            <CardDescription>Identify when your audience is most active and likely to engage</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span>LOW ENGAGEMENT</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.6, 0.9, 1].map((op) => (
                <div key={op} className="h-4 w-4 rounded-sm bg-primary" style={{ opacity: op }} />
              ))}
            </div>
            <span>HIGH ENGAGEMENT</span>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[100px_1fr] gap-4">
                <div className="space-y-4 pt-10">
                  {HEATMAP_DAYS.map(day => (
                    <div key={day} className="h-10 flex items-center text-xs font-black text-slate-400 uppercase">{day}</div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {HEATMAP_HOURS.map(hour => (
                      <div key={hour} className="text-center text-[10px] font-black text-slate-400 uppercase">{hour}</div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {HEATMAP_DAYS.map((day, dIdx) => (
                      <div key={day} className="grid grid-cols-7 gap-2">
                        {HEATMAP_HOURS.map((hour, hIdx) => {
                          // Mock logic for heatmap colors
                          const intensity = (Math.sin(dIdx + hIdx) + 1) / 2;
                          return (
                            <div 
                              key={hour} 
                              className="h-10 rounded-lg bg-primary transition-all hover:scale-110 cursor-pointer"
                              style={{ opacity: 0.1 + (intensity * 0.9) }}
                              title={`${day} ${hour}: ${Math.round(intensity * 100)}% active`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown Table */}
      <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="px-8 py-6 border-b bg-slate-50/50">
          <CardTitle className="text-lg">Cross-Platform Metrics</CardTitle>
          <CardDescription>Comparative performance across your connected social channels</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {PLATFORM_BREAKDOWN.map((plat) => (
              <div key={plat.name} className="p-6 md:px-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl ${plat.color} flex items-center justify-center text-white`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{plat.name}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Verified Stream</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Monthly Reach</p>
                    <p className="text-lg font-black text-slate-900">{plat.reach}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Engagement</p>
                    <p className="text-lg font-black text-emerald-600">{plat.er}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
