
"use client"

import { useState, useEffect } from "react"
import { 
  Trophy, 
  Zap, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Award,
  ChevronRight,
  MessageSquare,
  Calendar,
  Wallet
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { motion } from "framer-motion"
import { STUDENT_PROFILE } from "@/lib/mock-student-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function StudentAdminOverview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Hey Aryan! 👋</h1>
          <p className="text-gray-500 font-medium text-lg">Your learning protocols are 82% optimized this week.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/education">
            <NexusButton className="bg-cyan-600 hover:bg-cyan-500 h-12 px-8 font-bold shadow-lg shadow-cyan-500/20">
              <Calendar className="w-4 h-4 mr-2" /> Book a Class
            </NexusButton>
          </Link>
        </div>
      </header>

      {/* Gamified Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Platform Level', val: 'Level 7', sub: 'Advanced Learner', icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Total Classes', val: '24', sub: '↑ +3 this week', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Current Streak', val: '12 Days', sub: 'Personal best: 21', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Global Rank', val: '#412', sub: 'Top 12% globally', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Wallet Balance', val: '0.84 ETH', sub: '≈ $2,447.80', icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Badges', val: '8 Total', sub: '2 new this week', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <NexusCard className="p-6 bg-white/[0.02] border-white/5 h-full hover:border-cyan-500/30 transition-all group text-center flex flex-col items-center justify-center">
              <div className={cn("p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.val}</div>
              <div className="text-[9px] font-medium text-gray-500">{stat.sub}</div>
            </NexusCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-cyan-500" /> Active Subject Mastery
            </h2>
            <div className="space-y-4">
              {[
                { name: 'Chemistry', progress: 82, topics: '24/30', color: 'bg-orange-500', teacher: 'Priya Sharma' },
                { name: 'Advanced Calculus', progress: 54, topics: '13/24', color: 'bg-blue-500', teacher: 'Yuki Tanaka' },
                { name: 'Physics', progress: 22, topics: '4/18', color: 'bg-purple-500', teacher: 'Rahul Patel' },
              ].map((sub) => (
                <NexusCard key={sub.name} className="p-8 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all group cursor-pointer">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{sub.name}</h3>
                      <p className="text-xs text-gray-500">Mentored by {sub.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{sub.progress}%</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{sub.topics} Topics</div>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.progress}%` }}
                      className={cn("h-full", sub.color)} 
                    />
                  </div>
                </NexusCard>
              ))}
            </div>
          </section>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          <section className="space-y-8">
            <h2 className="text-2xl font-bold">Upcoming Missions</h2>
            <div className="space-y-4">
              {[
                { time: "Today 4:00 PM", task: "Class with Priya", sub: "Electrochemistry Prep", type: "class" },
                { time: "Tomorrow 10:00 AM", task: "Homework Due", sub: "Physics Assignment 4", type: "task" },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 hover:border-cyan-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                    {item.type === 'class' ? <Calendar className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">{item.time}</div>
                    <div className="font-bold text-white">{item.task}</div>
                    <div className="text-xs text-gray-500">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <NexusCard className="p-8 border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <h3 className="font-bold mb-4">Community Engagement</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">You haven't posted in your communities this week. Share your progress to earn 50 XP!</p>
            <Link href="/forum">
              <NexusButton variant="outline" className="w-full border-cyan-500/20 text-cyan-400 text-[10px] uppercase font-bold hover:bg-cyan-500/10">Go to Forums</NexusButton>
            </Link>
          </NexusCard>
        </div>
      </div>
    </div>
  )
}
