"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { 
  User, 
  Settings, 
  Wallet, 
  BookOpen, 
  ShoppingBag, 
  ChevronRight, 
  LogOut, 
  Shield, 
  Bell, 
  Globe,
  Trophy,
  Zap
} from 'lucide-react'
import { STUDENT_PROFILE } from '@/lib/mock-student-data'

export default function MeTab() {
  return (
    <div className="pb-32">
      {/* Profile Header */}
      <header className="px-6 pt-12 pb-8 text-center space-y-6 bg-gradient-to-b from-blue-600/5 to-transparent">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full border-4 border-[#050508] p-1 bg-gradient-to-br from-[#6C63FF] to-[#00D4FF]">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#050508]">
              <img src={STUDENT_PROFILE.avatar} className="w-full h-full object-cover" alt="Me" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#6C63FF] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-4 border-[#050508] shadow-lg">7</div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">{STUDENT_PROFILE.name}</h2>
          <p className="text-sm font-bold text-[#5A5A7A] uppercase tracking-[0.2em]">{STUDENT_PROFILE.region} • {STUDENT_PROFILE.country}</p>
        </div>

        <div className="flex justify-center gap-8 pt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white">24</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Classes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">12</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">#412</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global</p>
          </div>
        </div>
      </header>

      {/* Main Menu */}
      <main className="px-6 space-y-10 mt-8">
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex flex-col items-center gap-3 active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
          </NexusCard>
          <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex flex-col items-center gap-3 active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Badges</span>
          </NexusCard>
        </div>

        {/* List Groups */}
        <div className="space-y-1">
          <MenuSection title="Learning">
            <MenuItem icon={<BookOpen />} label="My Courses" />
            <MenuItem icon={<User />} label="My Teachers" />
            <MenuItem icon={<Settings />} label="Learning Preferences" />
          </MenuSection>

          <MenuSection title="Account & Security">
            <MenuItem icon={<Wallet />} label="Crypto Wallet" />
            <MenuItem icon={<ShoppingBag />} label="My Orders" />
            <MenuItem icon={<Shield />} label="Privacy & Security" />
            <MenuItem icon={<Bell />} label="Notification Settings" />
            <MenuItem icon={<Globe />} label="Language & Region" />
          </MenuSection>

          <div className="pt-8">
            <button className="w-full py-4 flex items-center justify-center gap-3 text-red-500 font-bold text-sm bg-red-500/5 rounded-2xl border border-red-500/10 active:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
            <p className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-6">NEXUS Mobile v2.6.0 (Build 847)</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function MenuSection({ title, children }: any) {
  return (
    <div className="space-y-4 py-4">
      <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] ml-2">{title}</h4>
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 hover:bg-white/5 active:bg-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className="text-[#5A5A7A]">{React.cloneElement(icon, { size: 20 })}</div>
        <span className="text-sm font-bold text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-[#2A2A3A]" />
    </button>
  )
}
