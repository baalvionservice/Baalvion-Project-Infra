"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { Bell, ChevronLeft, ShoppingBag, BookOpen, MessageSquare, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

const NOTIFS = [
  { id: 1, type: 'class', title: 'Class starting in 10 minutes!', sub: 'Chemistry with Priya Sharma', time: '2 min ago', urgent: true },
  { id: 2, type: 'order', title: 'MacBook Air M4 shipped! 🚀', sub: 'Expected delivery: March 12', time: '45 min ago', urgent: false },
  { id: 3, type: 'message', title: 'Priya Sharma sent you a message', sub: 'I\'ve prepared some extra practice problems...', time: '2h ago', urgent: false },
  { id: 4, type: 'achievement', title: '🏆 New badge unlocked!', sub: 'Crypto Whale — almost there! 84% progress', time: '3h ago', urgent: false },
  { id: 5, type: 'forum', title: 'Your thread got 12 new replies', sub: 'Chemistry help thread — South Asia Forum', time: 'Yesterday', urgent: false },
]

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="min-h-full bg-[#050508] flex flex-col">
      <header className="px-6 pt-8 pb-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#050508]/80 backdrop-blur-xl z-10">
        <button onClick={() => router.back()} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold text-white">Notifications</h1>
        <button className="text-xs font-bold text-blue-400">Mark all read</button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="divide-y divide-white/5">
          {NOTIFS.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "p-6 flex gap-5 active:bg-white/5 transition-colors relative",
                n.urgent && "bg-blue-600/5"
              )}
            >
              {n.urgent && <div className="absolute left-0 top-6 bottom-6 w-1 bg-blue-500 rounded-r-full" />}
              
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                n.type === 'class' ? "bg-blue-500/10 text-blue-400" :
                n.type === 'order' ? "bg-emerald-500/10 text-emerald-400" :
                n.type === 'message' ? "bg-[#6C63FF]/10 text-[#6C63FF]" :
                "bg-amber-500/10 text-amber-400"
              )}>
                {n.type === 'class' ? <BookOpen size={24} /> :
                 n.type === 'order' ? <ShoppingBag size={24} /> :
                 n.type === 'message' ? <MessageSquare size={24} /> :
                 <Zap size={24} />}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <h4 className="text-sm font-bold text-white leading-tight">{n.title}</h4>
                  <span className="text-[9px] font-bold text-gray-600 uppercase shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{n.sub}</p>
                {n.type === 'class' && (
                  <button className="h-9 px-6 bg-blue-600 text-white text-[10px] font-bold rounded-xl mt-3 uppercase tracking-widest">Join Class</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
