
"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Flag, 
  Users, 
  XCircle, 
  TrendingUp
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function ForumModeratorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Moderation Terminal</h1>
          <p className="text-gray-500 font-medium text-lg">Maintaining community integrity across 7 regions.</p>
        </div>
        <div className="flex items-center gap-4">
          <NexusButton variant="outline" className="border-white/5 text-gray-400 font-bold h-12">
            View Mod Logs
          </NexusButton>
          <NexusButton className="bg-blue-600 hover:bg-blue-500 h-12 px-8 font-bold">
            Send Announcement
          </NexusButton>
        </div>
      </header>

      {/* Mod Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Reports Queue', val: '18', sub: '↑ +4 in last hour', icon: Flag, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Pending Posts', val: '12', sub: 'Needs approval', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Banned Today', val: '2', sub: 'Violation of Rule #4', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Active Mods', val: '7', sub: '🟢 Online Now', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <NexusCard key={i} variant="stats" className="bg-white/[0.02] border-white/5 p-8 h-full group hover:border-blue-500/20 transition-all">
            <div className="flex items-center justify-between mb-8">
              <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.sub}</div>
            </div>
          </NexusCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Reports Queue */}
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Flag className="w-6 h-6 text-red-500" /> Critical Reports Queue
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <NexusCard key={i} className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <NexusBadge className="bg-red-500/10 text-red-400 border-none text-[8px]">SPAM</NexusBadge>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reported by 3 users</div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed italic">"Check out this cool new crypto site for free tokens! Bit-Tokens-Free.com is the best way to earn..."</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      <span>Author: User_8472</span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span>Posted 12m ago</span>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                    <NexusButton size="sm" className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] h-9">Remove Post</NexusButton>
                    <NexusButton size="sm" variant="outline" className="border-white/10 text-gray-500 font-bold text-[10px] h-9">Dismiss</NexusButton>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>
        </div>

        {/* Community Stats */}
        <div className="lg:col-span-4 space-y-12">
          <section className="space-y-8">
            <h2 className="text-2xl font-bold">Community Health</h2>
            <div className="space-y-6">
              {[
                { label: 'Post Volume', val: 84, color: 'bg-blue-500' },
                { label: 'Moderation Speed', val: 92, color: 'bg-emerald-500' },
                { label: 'User Sentiment', val: 76, color: 'bg-purple-500' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>{stat.label}</span>
                    <span className="text-white">{stat.val}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      className={cn("h-full", stat.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <NexusCard className="p-8 border-white/5 bg-white/[0.02] space-y-6 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 mx-auto animate-spin" />
            <div>
              <h4 className="font-bold text-white mb-1">Platform-Wide Scan</h4>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">AI Audit in Progress...</p>
            </div>
          </NexusCard>
        </div>
      </div>
    </div>
  )
}
