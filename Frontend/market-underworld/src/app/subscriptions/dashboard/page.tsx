
"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { 
  Crown,
  Settings,
  LogOut,
  ArrowUpRight,
  Wallet,
  BookOpen,
  Zap,
  Gift,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  TrendingUp,
  Star
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { cn } from '@/lib/utils'

const SAVINGS_DATA = [
  { name: 'Mon', val: 0.002 },
  { name: 'Tue', val: 0.005 },
  { name: 'Wed', val: 0.001 },
  { name: 'Thu', val: 0.008 },
  { name: 'Fri', val: 0.004 },
  { name: 'Sat', val: 0.012 },
  { name: 'Sun', val: 0.003 },
];

export default function MembershipDashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">My Membership</h1>
          <p className="text-gray-500 font-medium text-lg">Managing your NEXUS Gold status and elite benefits.</p>
        </div>
        <div className="flex gap-4">
          <NexusButton variant="outline" className="border-white/10 h-12"><Download className="w-4 h-4 mr-2" /> Invoices</NexusButton>
          <NexusButton className="h-12 px-8 font-bold nexus-gradient-bg">Upgrade Plan</NexusButton>
        </div>
      </header>

      {/* Main Membership Card */}
      <NexusCard className="p-10 border-amber-500/30 bg-gradient-to-br from-amber-500/[0.03] to-transparent relative overflow-hidden group shadow-3xl shadow-amber-500/5">
        <div className="absolute top-0 right-0 p-8">
          <Crown className="w-16 h-16 text-amber-500 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <NexusBadge variant="vip" className="bg-amber-500 text-black border-none px-6 py-1.5 shadow-xl shadow-amber-500/20">
                🥇 NEXUS GOLD
              </NexusBadge>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Active Membership
                </div>
              </div>
            </div>
            
            <div className="flex gap-12">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Member Since</div>
                <div className="font-bold">Jan 15, 2026</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Next Billing</div>
                <div className="font-bold">Apr 10, 2026</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <img src="https://picsum.photos/seed/aryan/200/200" className="w-24 h-24 rounded-full border-4 border-amber-500/30 p-1 shadow-2xl" alt="Member" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0A0A0F] rounded-full border-2 border-amber-500/30 flex items-center justify-center font-bold text-amber-500 shadow-xl">7</div>
            </div>
            <div>
              <div className="text-xl font-bold mb-1">Aryan Mehta</div>
              <div className="text-sm font-bold text-amber-500 uppercase tracking-widest">NEXUS-GOLD-2026-08472</div>
            </div>
            <div className="w-full max-w-[240px] space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                <span>Diamond Progress</span>
                <span className="text-amber-500">68%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} className="h-full bg-gradient-to-r from-amber-500 to-yellow-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Saved this mo.', val: '0.18 ETH', sub: '≈ $522', icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Cashback', val: '0.008 ETH', sub: 'Ready to use', icon: Gift, color: 'text-cyan-400' },
              { label: 'Classes Left', val: '2 / 10', sub: 'Renews Apr 10', icon: BookOpen, color: 'text-purple-400' },
              { label: 'Rewards', val: '0.001 ETH', sub: 'Paid on 1st', icon: Star, color: 'text-amber-400' },
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 group/stat hover:bg-white/[0.08] transition-all">
                <stat.icon className={cn("w-4 h-4 mb-2", stat.color)} />
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                <div className="font-bold text-lg leading-none">{stat.val}</div>
                <div className="text-[9px] font-medium text-gray-600">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </NexusCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Usage Analytics */}
          <section className="space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> This Month's Savings
            </h3>
            <NexusCard className="p-8 border-white/5 bg-white/[0.02] h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SAVINGS_DATA}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {SAVINGS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#savingsGradient)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </NexusCard>
          </section>

          {/* Billing History */}
          <section className="space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" /> Billing History
            </h3>
            <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
              <table className="w-full text-left">
                <thead className="bg-white/[0.01] border-b border-white/5">
                  <tr>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Period</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { date: 'Mar 10, 2026', plan: 'NEXUS Gold', period: 'Monthly', amt: '0.03 ETH' },
                    { date: 'Feb 10, 2026', plan: 'NEXUS Gold', period: 'Monthly', amt: '0.03 ETH' },
                    { date: 'Jan 10, 2026', plan: 'NEXUS Gold', period: 'Monthly', amt: '0.03 ETH' },
                  ].map((inv, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-6 text-sm font-medium">{inv.date}</td>
                      <td className="p-6">
                        <div className="font-bold text-sm text-white">{inv.plan}</div>
                      </td>
                      <td className="p-6 text-center">
                        <NexusBadge className="bg-white/5 text-gray-400 border-none">{inv.period}</NexusBadge>
                      </td>
                      <td className="p-6 text-right font-bold text-white">{inv.amt}</td>
                      <td className="p-6 text-right">
                        <button className="p-2 text-gray-600 hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </NexusCard>
          </section>
        </div>

        <div className="space-y-12">
          {/* Active Benefits */}
          <section className="space-y-8">
            <h3 className="text-xl font-bold">Plan Controls</h3>
            <div className="space-y-4">
              <button className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Manage Subscription</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Auto-renew is ON</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>

              <button className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Update Payout Wallet</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">0x4f2a...8b3c</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors" />
              </button>

              <button className="w-full p-6 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all text-left flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-red-500">Cancel Membership</div>
                </div>
              </button>
            </div>
          </section>

          {/* Upgrade Card */}
          <NexusCard className="p-8 border-purple-500/30 bg-gradient-to-br from-purple-500/[0.05] to-transparent space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12 text-purple-400" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xl font-bold">💎 Upgrade to Diamond</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                You're 68% to qualifying naturally. Upgrade early for just 0.07 ETH more/month and unlock a personal success manager.
              </p>
            </div>

            <div className="space-y-3">
              {[
                'Unlimited private classes',
                'White-glove VIP concierge',
                'NEXUS Annual Summit VVIP access'
              ].map(f => (
                <div key={f} className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> {f}
                </div>
              ))}
            </div>

            <NexusButton className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 h-12 font-bold text-sm">Apply for Diamond</NexusButton>
          </NexusCard>
        </div>
      </div>
    </div>
  )
}
