"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { 
  Bell, 
  Wallet, 
  Zap, 
  BookOpen, 
  ShoppingBag, 
  ArrowUpRight, 
  ChevronRight,
  Star,
  Activity,
  Play
} from 'lucide-react'
import Link from 'next/link'

export default function MobileHome() {
  return (
    <div className="pb-32">
      {/* Header */}
      <header className="px-6 pt-6 pb-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Good Morning ☀️</h2>
            <p className="text-3xl font-bold tracking-tight text-white">Aryan Mehta</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/app/notifications" className="relative p-2.5 bg-white/5 rounded-2xl border border-white/10">
              <Bell className="w-6 h-6 text-[#5A5A7A]" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#050508]" />
            </Link>
            <div className="w-12 h-12 rounded-2xl border-2 border-[#6C63FF] p-0.5 overflow-hidden">
              <img src="https://picsum.photos/seed/aryan/100/100" className="w-full h-full object-cover rounded-xl" alt="Me" />
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <NexusCard className="p-8 border-white/10 bg-gradient-to-br from-[#1e1e2d] to-[#111118] relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D4FF]/10 blur-[60px] rounded-full group-hover:bg-[#00D4FF]/20 transition-all" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Balance</span>
              </div>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-3 mb-8">
              <h3 className="text-4xl font-bold text-white tracking-tighter">0.842 ETH</h3>
              <p className="text-lg font-bold text-gray-500">≈ $2,447</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NexusButton size="sm" className="h-12 bg-white/10 border border-white/10 text-white font-bold text-xs hover:bg-white/20">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Send
              </NexusButton>
              <NexusButton size="sm" className="h-12 nexus-gradient-bg font-bold text-xs">
                Receive
              </NexusButton>
            </div>
          </div>
        </NexusCard>
      </header>

      {/* Main Content Sections */}
      <div className="px-6 space-y-12">
        
        {/* Streak & Next Class */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
          <div className="min-w-[160px] p-6 rounded-3xl bg-[#FF9500]/10 border border-[#FF9500]/20 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9500]/20 flex items-center justify-center text-[#FF9500]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12 Days</p>
              <p className="text-[10px] font-bold text-[#FF9500] uppercase">Study Streak 🔥</p>
            </div>
          </div>
          
          <div className="min-w-[220px] p-6 rounded-3xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-widest mb-1">Next Class</p>
              <p className="text-lg font-bold text-white leading-tight">Chemistry w/ Priya</p>
              <p className="text-xs font-bold text-gray-500">Today 4:00 PM</p>
            </div>
            <Link href="/classroom/123">
              <NexusButton size="sm" className="h-9 w-fit px-6 bg-[#6C63FF] text-white text-[10px] font-bold mt-4">Join Now</NexusButton>
            </Link>
          </div>
        </div>

        {/* Continue Learning */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <BookOpen className="w-5 h-5 text-cyan-400" /> Continue Learning
            </h3>
            <Link href="/app/learn" className="text-xs font-bold text-[#5A5A7A] flex items-center">See All <ChevronRight className="w-4 h-4" /></Link>
          </div>
          
          <NexusCard className="p-6 border-white/5 bg-white/[0.02] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center text-3xl shadow-xl">⚗️</div>
              <div>
                <h4 className="font-bold text-white">Advanced Chemistry</h4>
                <p className="text-xs text-gray-500 font-bold uppercase">Topic 8: Faraday's Laws</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span>PROGRESS</span>
                <span className="text-cyan-400">82%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" />
              </div>
            </div>
            <NexusButton className="w-full h-12 nexus-gradient-bg font-bold text-xs"><Play className="w-4 h-4 mr-2" /> Resume Session</NexusButton>
          </NexusCard>
        </section>

        {/* Live Now Ticker */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Now
            </h3>
            <span className="text-xs font-bold text-[#5A5A7A]">12 Teachers</span>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl p-0.5 border-2 border-red-500 animate-pulse-glow">
                    <img src={`https://picsum.photos/seed/live-${i}/100/100`} className="w-full h-full object-cover rounded-[1.25rem]" alt="T" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">LIVE</div>
                </div>
                <p className="text-[10px] font-bold text-white">Teacher_{i}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="space-y-6 pb-8">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Star className="w-5 h-5 text-amber-400" /> Recommended
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex gap-5 hover:border-white/20 transition-all cursor-pointer">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                  <img src={`https://picsum.photos/seed/rec-${i}/200/200`} className="w-full h-full object-cover" alt="T" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-bold text-white">James Wright</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Physics • USA 🇺🇸</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#00E676]">15 USDT/hr</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-current" /> 4.9
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
