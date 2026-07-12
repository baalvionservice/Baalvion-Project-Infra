"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Crown, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Search,
  ChevronRight,
  Sparkles,
  Info,
  Globe,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TOP_THREE = [
  { rank: 2, name: 'Ananya K.', country: 'IN', region: 'South Asia', xp: '3,847', classes: 31, streak: 28, score: '9,234', change: '+287', avatar: 'https://picsum.photos/seed/user2/100/100' },
  { rank: 1, name: 'Rahul M.', country: 'IN', region: 'South Asia', xp: '4,920', classes: 47, streak: 45, score: '12,847', change: '+412', avatar: 'https://picsum.photos/seed/user1/100/100' },
  { rank: 3, name: 'Liu W.', country: 'CN', region: 'East Asia', xp: '3,129', classes: 24, streak: 12, score: '8,129', change: '+198', avatar: 'https://picsum.photos/seed/user3/100/100' },
]

const LEADERBOARD_DATA = Array.from({ length: 15 }).map((_, i) => {
  const rank = i + 4;
  return {
    rank,
    name: `User_${rank}842`,
    country: i % 2 === 0 ? 'IN' : 'US',
    region: i % 2 === 0 ? 'South Asia' : 'North America',
    xp: Math.floor(3000 - i * 150),
    classes: Math.floor(30 - i * 1.5),
    streak: Math.floor(20 - i),
    score: Math.floor(8000 - i * 400),
    change: Math.random() > 0.5 ? `+${Math.floor(Math.random() * 50)}` : `-${Math.floor(Math.random() * 20)}`,
    avatar: `https://picsum.photos/seed/user${rank}/100/100`
  }
})

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('Global')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container mx-auto pt-44 pb-32 px-8 max-w-7xl space-y-24">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-10">
            <NexusBadge variant="vip" className="px-6 py-2">🏆 Global NEXUS Leaderboard</NexusBadge>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
              Where Do You <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Rank Globally?</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-xl">
              Ranked by learning activity, community contribution and platform engagement. Compete with 3,430 students worldwide.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                LIVE UPDATES EVERY 5 MIN
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 shrink-0">
            <NexusCard className="p-8 border-amber-500/30 bg-amber-500/[0.03] shadow-3xl shadow-amber-500/5 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Globe className="w-24 h-24 text-amber-500" />
              </div>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Your Global Rank</div>
              <div className="space-y-1">
                <div className="text-7xl font-black tracking-tighter text-white">#412</div>
                <div className="text-sm font-bold text-gray-500">out of 3,430 students</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-500">Percentile</span>
                  <span className="text-amber-500">Top 12% Globally 🎯</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-gradient-to-r from-amber-500 to-amber-200" />
                </div>
              </div>
              <NexusButton className="w-full h-12 bg-amber-500 text-black hover:bg-amber-400 font-bold shadow-xl shadow-amber-500/20">
                🚀 Improve My Rank
              </NexusButton>
            </NexusCard>
          </div>
        </section>

        {/* Podium */}
        <section className="pt-20">
          <div className="flex items-end justify-center gap-4 md:gap-12 h-[500px]">
            {/* 2nd Place */}
            <div className="flex flex-col items-center gap-6 flex-1 max-w-[240px]">
              <div className="text-center space-y-2 mb-4">
                <div className="font-bold text-white text-lg">{TOP_THREE[0].name}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{TOP_THREE[0].score} pts</div>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: '240px' }}
                transition={{ duration: 1, delay: 0.3 }}
                className="w-full bg-white/[0.03] border-x border-t border-white/10 rounded-t-[2.5rem] relative flex flex-col items-center pt-12"
              >
                <div className="absolute -top-16">
                  <div className="w-20 h-20 rounded-full border-4 border-gray-400 p-1 relative">
                    <img src={TOP_THREE[0].avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-black font-bold text-sm">🥈</div>
                  </div>
                </div>
                <div className="text-6xl font-black text-white/5">2</div>
              </motion.div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-6 flex-1 max-w-[280px]">
              <div className="text-center space-y-2 mb-4 relative">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl"
                >
                  👑
                </motion.div>
                <div className="font-bold text-white text-2xl">{TOP_THREE[1].name}</div>
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{TOP_THREE[1].score} pts</div>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: '340px' }}
                transition={{ duration: 1 }}
                className="w-full bg-amber-500/10 border-x border-t border-amber-500/30 rounded-t-[2.5rem] relative flex flex-col items-center pt-12 shadow-[0_-20px_100px_rgba(245,158,11,0.1)]"
              >
                <div className="absolute -top-20">
                  <div className="w-28 h-28 rounded-full border-4 border-amber-500 p-1.5 relative">
                    <img src={TOP_THREE[1].avatar} className="w-full h-full rounded-full object-cover shadow-[0_0_30px_rgba(245,158,11,0.5)]" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-lg">🥇</div>
                  </div>
                </div>
                <div className="text-8xl font-black text-amber-500/10">1</div>
                <div className="mt-auto pb-12 flex gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </motion.div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center gap-6 flex-1 max-w-[220px]">
              <div className="text-center space-y-2 mb-4">
                <div className="font-bold text-white text-lg">{TOP_THREE[2].name}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{TOP_THREE[2].score} pts</div>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: '180px' }}
                transition={{ duration: 1, delay: 0.6 }}
                className="w-full bg-white/[0.03] border-x border-t border-white/10 rounded-t-[2.5rem] relative flex flex-col items-center pt-12"
              >
                <div className="absolute -top-14">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-700 p-1 relative">
                    <img src={TOP_THREE[2].avatar} className="w-full h-full rounded-full object-cover" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-700 rounded-full flex items-center justify-center text-black font-bold text-sm">🥉</div>
                  </div>
                </div>
                <div className="text-5xl font-black text-white/5">3</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Filters and Table */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-2 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
              {['Global', 'My Region', 'My Country', 'Teachers'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-500 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto px-4">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input className="w-full bg-black/40 border border-white/10 h-10 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-amber-500/50" placeholder="Search rankings..." />
              </div>
              <div className="h-8 w-px bg-white/5" />
              <button className="text-[10px] font-bold text-amber-500 uppercase tracking-widest hover:underline">This Week ▾</button>
            </div>
          </div>

          <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <table className="w-full text-left">
              <thead className="bg-white/[0.01] border-b border-white/5">
                <tr>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-20">Rank</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Region</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">XP</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Streak</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Score</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Change</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {LEADERBOARD_DATA.map((row) => (
                  <tr key={row.rank} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-6 text-sm font-black text-gray-500">{row.rank}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <img src={row.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                        <div>
                          <div className="font-bold text-white group-hover:text-amber-500 transition-colors">{row.name}</div>
                          <div className="text-[10px] font-bold text-gray-500">{row.country} 🇮🇳</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <NexusBadge className="bg-white/5 text-gray-400 border-none text-[8px]">{row.region}</NexusBadge>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-sm font-bold text-cyan-400">{row.xp}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-sm font-bold text-orange-500 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 fill-orange-500" /> {row.streak}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-base font-black text-white">{row.score}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1",
                        row.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {row.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {row.change}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-1">
                        {['🏆', '🔥', '💎'].slice(0, Math.floor(Math.random() * 3) + 1).map((b, i) => (
                          <div key={i} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs">{b}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Sticky Personal Row */}
            <div className="sticky bottom-0 bg-cyan-500/10 backdrop-blur-xl border-t border-cyan-500/30 p-6 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="text-2xl font-black text-cyan-400">#412</div>
                <div className="flex items-center gap-4">
                  <img src="https://picsum.photos/seed/aryan/100/100" className="w-10 h-10 rounded-xl border-2 border-cyan-400" alt="" />
                  <div>
                    <div className="font-bold text-white">Aryan Mehta (YOU)</div>
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Top 12% Globally</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Score</div>
                  <div className="text-2xl font-black text-white">4,240</div>
                </div>
                <NexusButton className="nexus-gradient-bg h-12 px-8 font-bold">Climb Higher</NexusButton>
              </div>
            </div>
          </NexusCard>
        </section>

        {/* Prize Countdown */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <NexusCard className="p-10 border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-transparent space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Crown className="w-24 h-24 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Monthly Rewards</h2>
              <p className="text-gray-400">Top 50 performers earn crypto prizes distributed on the 1st of every month.</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Days', val: '21' },
                { label: 'Hours', val: '04' },
                { label: 'Mins', val: '32' },
                { label: 'Secs', val: '17' },
              ].map(unit => (
                <div key={unit.label} className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                  <div className="text-3xl font-black text-amber-500 tracking-tighter">{unit.val}</div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{unit.label}</div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white/5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-500 uppercase">Prize Pool</span>
                <span className="text-white">2.5 ETH ($7,250)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-500 uppercase">My Potential</span>
                <span className="text-amber-500">0.025 ETH if #343 reach</span>
              </div>
            </div>
          </NexusCard>

          <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Info className="w-6 h-6 text-cyan-400" /> How to Score
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Class Done', pts: '+100', icon: BookOpen },
                { label: 'Daily Streak', pts: '+10', icon: Zap },
                { label: 'Best Answer', pts: '+20', icon: Star },
                { label: 'Market Order', pts: '+50', icon: ShoppingBag },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                    {typeof item.icon === 'string' ? item.icon : <item.icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] font-bold text-cyan-400">{item.pts} Points</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed italic pt-4 border-t border-white/5">
              "Scores are weighted by regional difficulty and consistency over time. Weekly rankings reset every Monday at 00:00 UTC."
            </p>
          </NexusCard>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function ShoppingBag(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  )
}
