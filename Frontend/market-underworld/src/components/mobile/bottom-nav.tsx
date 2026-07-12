"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BookOpen, ShoppingBag, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'home', label: 'Home', path: '/app/home', icon: Home },
  { id: 'learn', label: 'Learn', path: '/app/learn', icon: BookOpen },
  { id: 'shop', label: 'Shop', path: '/app/shop', icon: ShoppingBag },
  { id: 'chat', label: 'Chat', path: '/app/chat', icon: MessageSquare },
  { id: 'me', label: 'Me', path: '/app/me', icon: User },
]

export const BottomNav = () => {
  const pathname = usePathname()

  if (pathname.includes('/onboarding') || pathname.includes('/classroom')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[83px] bg-[#0D0D14]/95 backdrop-blur-2xl border-t border-white/5 z-[100] px-4">
      <div className="max-w-[390px] mx-auto h-full flex items-center justify-between gap-1 pb-[20px]">
        {TABS.map((tab) => {
          const isActive = pathname === tab.path
          return (
            <Link key={tab.id} href={tab.path} className="flex-1" aria-label={tab.label}>
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all relative",
                  isActive ? "text-[#6C63FF]" : "text-[#5A5A7A]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="absolute -inset-1 bg-[#6C63FF]/10 rounded-2xl z-[-1]"
                  />
                )}
                <tab.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                
                {tab.id === 'chat' && (
                  <span className="absolute top-1 right-4 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-[#0D0D14]">
                    5
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
