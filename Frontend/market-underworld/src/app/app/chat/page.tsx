"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard } from '@/components/ui/nexus-card'
import { Search, Edit, Pin, MoreVertical, Circle } from 'lucide-react'
import { CONVERSATIONS } from '@/lib/mock-messages-data'

export default function ChatTab() {
  return (
    <div className="pb-32">
      <header className="px-6 pt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-none">Chat</h1>
          <button className="p-3 bg-[#6C63FF]/10 rounded-2xl border border-[#6C63FF]/20 text-[#6C63FF]">
            <Edit className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
          <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white focus:border-[#6C63FF]/50 outline-none" placeholder="Search conversations..." />
        </div>
      </header>

      <main className="mt-8">
        <div className="px-6 space-y-1">
          {CONVERSATIONS.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 py-4 border-b border-white/5 cursor-pointer active:bg-white/5 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-gray-800 flex items-center justify-center text-xl">
                  {conv.avatar.length > 2 ? <img src={conv.avatar} alt="" className="w-full h-full object-cover" /> : conv.avatar}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#050508]",
                  conv.status === 'online' ? "bg-[#00E676]" : "bg-gray-600"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-base font-bold text-white truncate">{conv.name}</h4>
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{conv.lastMessageTime}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
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
