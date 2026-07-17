"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Search, Sparkles, Filter, ChevronRight, Star, Clock } from 'lucide-react'
import { TEACHERS } from '@/lib/mock-data'

export default function LearnTab() {
  return (
    <div className="pb-32">
      <header className="px-6 pt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-none">Learn</h1>
          <div className="flex gap-2">
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10"><Search className="w-5 h-5 text-gray-400" /></button>
            <button className="p-3 bg-[#6C63FF]/10 rounded-2xl border border-[#6C63FF]/20 text-[#6C63FF]"><Sparkles className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          {["All", "Chemistry", "Physics", "Math", "Coding", "Arts"].map((s, i) => (
            <button key={s} className={cn(
              "px-6 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
              i === 0 ? "bg-[#6C63FF] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30" : "bg-white/5 border-white/10 text-gray-500"
            )}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 mt-12 space-y-12">
        {/* My Teachers */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-white">My Teachers</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
            {[TEACHERS[0], TEACHERS[1]].map(t => (
              <div key={t.id} className="min-w-[140px] p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img src={t.avatar_url} className="w-16 h-16 rounded-full object-cover border-2 border-white/10" alt={t.name} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050508]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate w-24">{t.name.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{t.subject}</p>
                </div>
                <NexusButton size="sm" variant="outline" className="h-8 w-full border-white/10 text-[9px] font-bold uppercase tracking-widest">Message</NexusButton>
              </div>
            ))}
          </div>
        </section>

        {/* Discover Teachers */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Discover Experts</h3>
            <button className="p-2.5 bg-white/5 rounded-xl text-gray-500"><Filter className="w-4 h-4" /></button>
          </div>

          <div className="space-y-4">
            {TEACHERS.map(t => (
              <NexusCard key={t.id} className="p-5 border-white/5 bg-white/[0.01] flex gap-5 group cursor-pointer hover:border-[#6C63FF]/30 transition-all">
                <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border border-white/5 relative">
                  <img src={t.avatar_url} className="w-full h-full object-cover opacity-80" alt={t.name} />
                  {t.is_live && (
                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                      <div className="bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">LIVE</div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-base truncate">{t.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-current" /> {t.rating}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t.subject} • {t.country}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-emerald-400">{t.price_crypto} {t.currency}/hr</div>
                    <button className="text-xs font-bold text-[#6C63FF] flex items-center">Book <ChevronRight className="w-4 h-4 ml-1" /></button>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
