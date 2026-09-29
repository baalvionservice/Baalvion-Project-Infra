'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Wallet,
  Star,
  Clock,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  IndianRupee,
  Briefcase,
  Plus,
  User,
  ArrowUpRight,
  MessageSquare,
  Instagram,
  Youtube,
  Music2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { AIInsightsPanel } from '@/components/dashboard/creator/AIInsightsPanel';
import { EarningsForecast } from '@/components/creator/EarningsForecast';
import { DeadlineReminders } from '@/components/dashboard/DeadlineReminders';
import Link from 'next/link';

const STATS = [
  { label: 'Active Campaigns', value: '4', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+1 this week' },
  { label: 'Pending Apps', value: '12', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', trend: '3 new updates' },
  { label: 'Completed', value: '28', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: 'High rating' },
];

const AI_MATCHES = [
  {
    id: '1',
    brand: 'Lumina Tech',
    logo: 'https://picsum.photos/seed/brand1/100/100',
    title: 'AI Smart Home Ecosystem Review',
    budget: '₹12,000',
    match: 98,
    platform: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    deadline: '2 days left'
  },
  {
    id: '2',
    brand: 'EcoVibe',
    logo: 'https://picsum.photos/seed/brand2/100/100',
    title: 'Sustainable Summer Reel',
    budget: '₹8,500',
    match: 94,
    platform: 'TikTok',
    icon: Music2,
    color: 'text-slate-900',
    deadline: '5 days left'
  },
  {
    id: '3',
    brand: 'FitFlow',
    logo: 'https://picsum.photos/seed/brand3/100/100',
    title: 'Yoga Challenge Series',
    budget: '₹25,000',
    match: 91,
    platform: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    deadline: '1 week left'
  }
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'MESSAGE', title: 'New message from Lumina Tech', time: '2 hours ago', icon: MessageSquare, color: 'text-blue-500' },
  { id: 2, type: 'PAYMENT', title: 'Payment processed for "Summer Vibes"', time: '5 hours ago', icon: Wallet, color: 'text-emerald-500' },
  { id: 3, type: 'STATUS', title: 'Application "Modern Kitchen" was reviewed', time: 'Yesterday', icon: Briefcase, color: 'text-purple-500' },
  { id: 4, type: 'SYSTEM', title: 'Your profile reached 100% completeness!', time: 'Yesterday', icon: Star, color: 'text-yellow-500' },
];

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const completeness = 85;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Your profile is visible to 1,500+ brands.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/creator/campaigns">
            <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Apply to Campaign
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
              <User className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </Link>
          <Link href="/dashboard/creator/wallet">
            <Button variant="secondary" className="rounded-xl font-bold h-11">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Deadline Reminders */}
      <section>
        <DeadlineReminders />
      </section>

      {/* Earnings Forecast Section */}
      <section className="space-y-6">
        <EarningsForecast />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Stats & Matches */}
        <div className="lg:col-span-8 space-y-8">

          {/* Earnings & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-slate-950 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wallet className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">₹4,22,500</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] tracking-widest">+12.5%</Badge>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">This Month</span>
                    <span className="font-black">₹42,500</span>
                  </div>
                  <Progress value={65} className="h-1 bg-slate-800" />
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Payout processing starts in 4 days</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl p-6 flex flex-col justify-between bg-white">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Profile Readiness</CardTitle>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-black">{completeness}%</span>
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                </div>
                <Progress value={completeness} className="h-2 bg-slate-100" />
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary font-bold leading-relaxed">
                  Complete your "About Me" section to unlock 4x more AI campaign invites.
                </p>
              </div>
            </Card>
          </div>

          {/* Core Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl p-6 bg-white">
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-xl w-fit mb-4`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tighter">{stat.trend}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* AI Matched Campaigns */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold text-slate-900">AI Matches For You</h2>
              <Link href="/dashboard/creator/campaigns">
                <Button variant="link" className="text-primary font-bold text-sm">View Discovery Feed <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AI_MATCHES.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                >
                  <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
                    <CardContent className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <Avatar className="h-12 w-12 rounded-2xl border border-slate-100">
                          <AvatarImage src={job.logo} />
                          <AvatarFallback>B</AvatarFallback>
                        </Avatar>
                        <div className="bg-primary/5 px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary/10">
                          <Zap className="h-3 w-3 text-primary fill-primary" />
                          <span className="text-[10px] font-black text-primary">{job.match}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{job.brand}</p>
                        <h4 className="text-md font-bold text-slate-900 leading-tight mt-1 line-clamp-2">{job.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <job.icon className={`h-4 w-4 ${job.color}`} />
                        <span className="text-xs font-bold text-slate-600">{job.platform}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0 border-t border-slate-50 mt-auto bg-slate-50/30">
                      <div className="flex items-center justify-between w-full pt-4">
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Budget</p>
                          <p className="text-sm font-black text-emerald-600">{job.budget}</p>
                        </div>
                        <Button size="sm" className="rounded-xl font-bold text-[10px] uppercase h-8 px-4">
                          Apply
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Panels */}
        <div className="lg:col-span-4 space-y-8">

          {/* AI Insights Panel */}
          <AIInsightsPanel />

          {/* Activity Feed */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="flex gap-4 relative last:after:hidden after:absolute after:left-5 after:top-10 after:bottom-0 after:w-px after:bg-slate-100">
                  <div className={`h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center relative z-10 border-2 border-white shadow-sm`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{activity.title}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{activity.time}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl h-10 hover:text-primary">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Summary */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <CalendarDays className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { task: 'Instagram Reel Draft', brand: 'EcoVibe', date: 'Jul 24', urgent: true },
                { task: 'YouTube Video Upload', brand: 'Lumina Tech', date: 'Jul 28', urgent: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{item.task}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black ${item.urgent ? 'text-red-500' : 'text-slate-500'}`}>{item.date}</p>
                    {item.urgent && <Badge className="bg-red-100 text-red-600 text-[8px] h-4 py-0 px-1 border-none font-black uppercase tracking-widest">Urgent</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upgrade Promo */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-indigo-700 text-white">
            <CardContent className="p-8">
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400 mb-4" />
              <h3 className="text-xl font-headline font-bold mb-2">Join Baalvion Pro</h3>
              <p className="text-white/80 text-xs mb-6 leading-relaxed font-medium">
                Get priority matching, 0% payout fees, and detailed audience demographic insights.
              </p>
              <Button size="sm" className="w-full bg-white text-primary hover:bg-indigo-50 font-black rounded-xl transition-all shadow-lg h-11 text-xs uppercase tracking-widest">
                View Pro Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
