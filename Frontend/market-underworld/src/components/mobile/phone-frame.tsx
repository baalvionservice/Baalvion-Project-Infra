"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Wifi, Signal, Battery } from 'lucide-react'

interface PhoneFrameProps {
  children: React.ReactNode
}

export const PhoneFrame = ({ children }: PhoneFrameProps) => {
  const [isMobile, setIsMobile] = useState(false)
  const [currentTime, setCurrentTime] = useState('9:41')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`)
    }, 1000)

    return () => {
      window.removeEventListener('resize', checkMobile)
      clearInterval(timer)
    }
  }, [])

  if (isMobile) {
    return <div className="min-h-screen bg-[#050508]">{children}</div>
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center py-10 overflow-hidden">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-1">📱 NEXUS Mobile</h2>
        <p className="text-[#5A5A7A] text-sm font-medium uppercase tracking-[0.2em]">Elite Mobile Experience</p>
      </div>

      <div className="relative">
        {/* Shadow */}
        <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] rounded-full opacity-50" />
        
        {/* iPhone 15 Pro Frame */}
        <div className="relative w-[390px] h-[844px] bg-[#1C1C1C] rounded-[55px] p-[6px] shadow-2xl border border-white/10 ring-1 ring-white/5">
          <div className="relative w-full h-full bg-black rounded-[50px] overflow-hidden border border-black">
            
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-[44px] z-[100] flex items-center justify-between px-8 select-none">
              <div className="text-[14px] font-bold text-white">{currentTime}</div>
              
              {/* Dynamic Island */}
              <motion.div 
                initial={{ width: 126 }}
                animate={{ width: 126 }}
                className="absolute top-[11px] left-1/2 -translate-x-1/2 h-[37px] bg-black rounded-[20px] flex items-center justify-center"
              >
                <div className="w-3 h-3 rounded-full bg-[#1A1A1A] mr-auto ml-4" />
              </motion.div>

              <div className="flex items-center gap-1.5">
                <Signal className="w-4 h-4 text-white" />
                <Wifi className="w-4 h-4 text-white" />
                <Battery className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Screen Content */}
            <div className="w-full h-full pt-[44px] pb-[34px] overflow-y-auto no-scrollbar bg-[#050508]">
              {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full z-[100]" />
          </div>
        </div>

        {/* Side Buttons */}
        <div className="absolute left-[-8px] top-[180px] w-1.5 h-[60px] bg-[#2A2A2A] rounded-l-md border-l border-white/10" />
        <div className="absolute left-[-8px] top-[260px] w-1.5 h-[60px] bg-[#2A2A2A] rounded-l-md border-l border-white/10" />
        <div className="absolute right-[-8px] top-[220px] w-1.5 h-[100px] bg-[#2A2A2A] rounded-r-md border-r border-white/10" />
      </div>
    </div>
  )
}
