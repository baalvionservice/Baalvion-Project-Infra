'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  TrendingUp,
  IndianRupee,
  Plus,
  Clock,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  AlertCircle,
  BarChart3,
  Sparkles
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { CreatorRecommendations } from '@/components/ai/CreatorRecommendations';
import { CampaignOptimizer } from '@/components/ai/CampaignOptimizer';
import { DeadlineReminders } from '@/components/dashboard/DeadlineReminders';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDoc } from '@/firebase';
import { BrandProfile } from '@/types';
import { formatCurrency, fromBase } from '@/lib/currency';

// Mock Data for Analytics (INR Base)
const PERFORMANCE_DATA = [
  { name: 'Mon', reach: 45000, engagement: 2400 },
  { name: 'Tue', reach: 52000, engagement: 3100 },
  { name: 'Wed', reach: 48000, engagement: 2800 },
  { name: 'Thu', reach: 61000, engagement: 4200 },
  { name: 'Fri', reach: 55000, engagement: 3900 },
  { name: 'Sat', reach: 67000, engagement: 4800 },
  { name: 'Sun', reach: 72000, engagement: 5100 },
];

const DEADLINES = [
  { id: 1, task: 'Deliverable Review', campaign: 'AI Smart Home Review', creator: 'Sarah Chen', date: 'Today, 5:00 PM', urgent: true },
  { id: 2, task: 'Campaign Launch', campaign: 'Summer Organic Collection', creator: 'N/A', date: 'Tomorrow, 9:00 AM', urgent: false },
  { id: 3, task: 'Payment Approval', campaign: 'Morning Vitality Series', creator: 'Marcus Thorne', date: 'Jul 24', urgent: false },
];

export default function BrandDashboard() {
  const { currentUser } = useAuth();
  const brandId = currentUser?.id ? `brand_${currentUser.id}` : null;
  const { data: brand } = useDoc<BrandProfile>(brandId ? `brands/${brandId}` : null);
  const preferredCurrency = brand?.currency || 'INR';

  const stats = useMemo(() => [
    { label: 'Spend This Month', value: formatCurrency(fromBase(422500, preferredCurrency), preferredCurrency), trend: '+12.5%', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Campaigns', value: '12', trend: '+2 new', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Approvals', value: '08', trend: '3 urgent', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Creators Hired', value: '42', trend: '+5 this mo', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ], [preferredCurrency]);

  return (
    <div className="space-y-12 pb-20">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">
            Brand Command Center
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {brand?.companyName || 'Corporate'} profile is healthy. 12 new matches today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <BarChart3 className="h-4 w-4 mr-2" />
            Download Reports
          </Button>
          <Link href="/dashboard/campaigns/new">
            <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* NEW: Operational Deadline Reminders */}
      <section>
        <DeadlineReminders />
      </section>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 text-[10px] font-bold">
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Campaign Optimizer Section */}
      <section className="space-y-6">
        <CampaignOptimizer />
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Charts & Recs */}
        <div className="lg:col-span-8 space-y-12">

          {/* Performance Chart */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Aggregate Performance</CardTitle>
                <CardDescription>Consolidated reach across all active creators</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Engagement</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="#6C3AE8"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorReach)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* PERSONALIZED RECOMMENDATIONS WIDGET */}
          <CreatorRecommendations />
        </div>

        {/* Right: Deadlines & Activity */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Upcoming Deadlines */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Task Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {DEADLINES.map((item) => (
                  <div key={item.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      item.urgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {item.urgent ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.task}</p>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", item.urgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500")}>
                          {item.date}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{item.campaign}</p>
                      <p className="text-[10px] text-primary font-bold mt-1">Creator: {item.creator}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-slate-50/30 border-t flex justify-center">
              <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-primary">
                View Full Schedule
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total reach</p>
                  <p className="text-2xl font-black">2.4M+</p>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Campaign Goal</span>
                  <span className="font-black text-emerald-400">85% Achieved</span>
                </div>
                <Progress value={85} className="h-1.5 bg-white/5" />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Your current active campaigns are performing 12% above niche benchmarks.
              </p>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-11 text-[10px] uppercase tracking-widest">
                Optimize Strategy
              </Button>
            </CardContent>
          </Card>

          {/* Trust Seal */}
          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Pro Matchmaking Active</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Our AI is currently vetting 15 new candidates for your "Tech Hub" campaign.
              </p>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
