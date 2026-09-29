
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Briefcase,
  IndianRupee,
  AlertTriangle,
  Zap,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Activity,
  ShieldAlert,
  Loader2,
  PieChart,
  Target,
  FileBox,
  History
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';
import { PlatformHealthMonitor } from '@/components/admin/PlatformHealth';
import { TopOpportunities } from '@/components/crm/TopOpportunities';

const REVENUE_TRENDS = [
  { name: 'Jan', revenue: 120000, gmv: 800000 },
  { name: 'Feb', revenue: 185000, gmv: 1230000 },
  { name: 'Mar', revenue: 240000, gmv: 1600000 },
  { name: 'Apr', revenue: 210000, gmv: 1400000 },
  { name: 'May', revenue: 320000, gmv: 2130000 },
  { name: 'Jun', revenue: 410000, gmv: 2730000 },
  { name: 'Jul', revenue: 385000, gmv: 2560000 },
];

export default function AdminDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { stats, logs, fetchDashboard, loading: statsLoading } = useAdminStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = [
    { label: 'Total GMV', value: '₹5.2 Cr', trend: stats?.growthRate ? `+${stats.growthRate}%` : '...', icon: IndianRupee, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Platform Revenue', value: stats ? `₹${(stats.totalRevenue / 100000).toFixed(1)} L` : '...', trend: '+12.5%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Active Campaigns', value: stats?.totalCampaigns || '...', trend: '+12 this week', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Users', value: stats?.totalUsers.toLocaleString() || '...', trend: '+840 this mo', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-slate-900 p-2 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin <span className="text-primary">Command</span></h1>
          </div>
          <p className="text-slate-500 font-medium">Global marketplace oversight and recursive performance monitoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200 shadow-sm">
            <Settings className="h-4 w-4 mr-2" /> Global Config
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6">
            <Sparkles className="h-4 w-4 mr-2" /> AI Platform Audit
          </Button>
        </div>
      </div>

      {/* Health Component */}
      <PlatformHealthMonitor />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat, i) => (
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
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-2 uppercase">
                <ArrowUpRight className="h-3 w-3" /> {stat.trend}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Charts Column */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Market Volume & Revenue</CardTitle>
                <CardDescription>Consolidated platform fee collection vs gross market volume.</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase">
                  <div className="h-2 w-2 rounded-full bg-primary" /> Revenue
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase">
                  <div className="h-2 w-2 rounded-full bg-slate-200" /> Total GMV
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_TRENDS}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#6C3AE8" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="gmv" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <TopOpportunities />
        </div>

        {/* Audit / Logs Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Live System Logs
              </CardTitle>
              <Badge variant="outline" className="text-[8px] font-black uppercase">Real-time</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors group">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      log.event === 'system_alert' ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary"
                    )}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-xs font-black text-slate-900 uppercase truncate pr-2">{log.event.replace('_', ' ')}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-slate-50/30 border-t flex justify-center">
              <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-primary">
                Full Audit Trail <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ShieldCheck className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <Zap className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Admin Protocol</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  You are in **Root Access Mode**. All actions taken here are permanently recorded in the immutable compliance ledger.
                </p>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg">
                Download Monthly Audit
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
