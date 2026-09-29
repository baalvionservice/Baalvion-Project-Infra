"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Globe, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Zap,
  RefreshCw,
  Search
} from 'lucide-react'
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
  Pie
} from 'recharts'
import { cn } from '@/lib/utils'

const GROWTH_DATA = [
  { name: 'Apr', students: 0, revenue: 0 },
  { name: 'May', students: 240, revenue: 1200 },
  { name: 'Jun', students: 580, revenue: 4500 },
  { name: 'Jul', students: 920, revenue: 12000 },
  { name: 'Aug', students: 1450, revenue: 28000 },
  { name: 'Sep', students: 1840, revenue: 45000 },
  { name: 'Oct', students: 2100, revenue: 68000 },
  { name: 'Nov', students: 2450, revenue: 110000 },
  { name: 'Dec', students: 2800, revenue: 160000 },
  { name: 'Jan', students: 3100, revenue: 210000 },
  { name: 'Feb', students: 3300, revenue: 254000 },
  { name: 'Mar', students: 3430, revenue: 284720 },
];

const REGION_STATS = [
  { name: 'South Asia', flag: '🌿', count: 1225, color: '#FF9500' },
  { name: 'East Asia', flag: '🌏', count: 820, color: '#00D4FF' },
  { name: 'Europe', flag: '🌍', count: 680, color: '#6C63FF' },
  { name: 'North America', flag: '🗽', count: 420, color: '#00E676' },
  { name: 'MENA', flag: '🕌', count: 285, color: '#FFD600' },
  { name: 'Latin America', flag: '🌎', count: 195, color: '#FF6584' },
  { name: 'Sub-Saharan Africa', flag: '🌍', count: 145, color: '#A855F7' },
];

const SUBJECT_DATA = [
  { name: 'Chemistry', value: 22, color: '#FF9500' },
  { name: 'Mathematics', value: 18, color: '#6C63FF' },
  { name: 'Physics', value: 15, color: '#00D4FF' },
  { name: 'Coding', value: 14, color: '#00E676' },
  { name: 'Languages', value: 12, color: '#FF6584' },
  { name: 'Data Science', value: 8, color: '#A855F7' },
  { name: 'Other', value: 11, color: '#5A5A7A' },
];

export default function StatsPage() {
  const [tickerIndex, setTickerIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tickerMessages = [
    "247 students online now",
    "12 classes in progress",
    "3 orders being placed",
    "Last class booked: 2 min ago",
    "Newest member: South Asia 🌿"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerMessages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      {/* Ticker Bar */}
      <div className="fixed top-28 left-0 right-0 h-10 bg-black/40 border-y border-white/5 backdrop-blur-xl z-40 flex items-center overflow-hidden">
        <div className="container mx-auto px-8 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">LIVE PLATFORM STATS</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[11px] font-bold text-gray-300"
            >
              {tickerMessages[tickerIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <main className="container mx-auto pt-52 pb-32 px-8 max-w-7xl space-y-32">
        {/* Hero */}
        <section className="text-center space-y-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="flex flex-col items-center gap-6">
            <NexusBadge variant="info" className="px-6 py-2">📊 NEXUS Platform Statistics</NexusBadge>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight nexus-gradient-text leading-[1.1]">
              NEXUS by the Numbers
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl font-medium leading-relaxed">
              Real-time platform statistics. Transparent growth metrics. The numbers behind the world's most ambitious learning platform.
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
              Last updated: 2 minutes ago
              <button 
                onClick={handleRefresh}
                className={cn("p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all", isRefreshing && "animate-spin")}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Big Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Active Students', val: '3,430', trend: '+12%', color: 'text-cyan-400', icon: Users },
            { label: 'Expert Teachers', val: '343', trend: '+8', color: 'text-purple-400', icon: GraduationCap },
            { label: 'Classes Completed', val: '47,832', trend: '+1,247', color: 'text-amber-400', icon: BookOpen },
            { label: 'Total Revenue', val: '$284,720', trend: '+$28k', color: 'text-emerald-400', icon: CreditCard },
            { label: 'Countries Represented', val: '49', trend: 'Across 7 regions', color: 'text-blue-400', icon: Globe },
            { label: 'Platform Uptime', val: '99.8%', trend: 'Last 90 days', color: 'text-emerald-500', icon: ShieldCheck },
          ].map((stat, i) => (
            <NexusCard key={i} variant="stats" className="p-10 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <stat.icon className="w-24 h-24" />
              </div>
              <div className={cn("text-5xl font-bold mb-2 tracking-tighter", stat.color)}>{stat.val}</div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">{stat.label}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <TrendingUp className="w-4 h-4" /> {stat.trend}
              </div>
            </NexusCard>
          ))}
        </section>

        {/* Growth Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-10">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" /> Student Growth
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="students" stroke="#6C63FF" strokeWidth={3} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </NexusCard>

          <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-10">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Revenue Growth (USDT)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </NexusCard>
        </section>

        {/* Distribution Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-12">
            <h2 className="text-3xl font-bold">🌍 Regional Distribution</h2>
            <NexusCard className="p-0 border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="p-10 space-y-10">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={REGION_STATS} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {REGION_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {REGION_STATS.map((region) => (
                    <div key={region.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: region.color }} />
                        <span className="text-xs font-bold text-white">{region.flag} {region.name}</span>
                      </div>
                      <div className="text-lg font-bold pl-4">{region.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </NexusCard>
          </div>

          <div className="lg:col-span-5 space-y-12">
            <h2 className="text-3xl font-bold">📊 Subject Popularity</h2>
            <NexusCard className="p-10 border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center space-y-10">
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SUBJECT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {SUBJECT_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Active</div>
                  <div className="text-2xl font-bold">3,430</div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {SUBJECT_DATA.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub.name}</span>
                  </div>
                ))}
              </div>
            </NexusCard>
          </div>
        </section>

        {/* Infrastructure Status */}
        <section className="space-y-12">
          <h2 className="text-3xl font-bold flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" /> Infrastructure Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Web Platform', status: 'Operational', uptime: '99.9%', ping: '124ms' },
              { name: 'Mobile Hub', status: 'Operational', uptime: '99.8%', ping: '98ms' },
              { name: 'Video Engine', status: 'Operational', uptime: '99.7%', ping: '245ms' },
              { name: 'Crypto Gateway', status: 'Operational', uptime: '100%', ping: '134ms' },
              { name: 'Auth System', status: 'Operational', uptime: '100%', ping: '45ms' },
              { name: 'Forum Engine', status: 'Operational', uptime: '99.9%', ping: '67ms' },
              { name: 'Search Service', status: 'Operational', uptime: '99.7%', ping: '203ms' },
              { name: 'Market API', status: 'Operational', uptime: '99.9%', ping: '112ms' },
            ].map((service, i) => (
              <NexusCard key={i} className="p-6 border-white/5 bg-white/[0.02] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white">{service.name}</div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase">Uptime</div>
                    <div className="text-xs font-bold text-gray-300">{service.uptime}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase">Latency</div>
                    <div className="text-xs font-bold text-gray-300">{service.ping}</div>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
