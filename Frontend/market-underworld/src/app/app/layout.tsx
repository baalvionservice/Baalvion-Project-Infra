"use client"

import React from 'react'
import { PhoneFrame } from '@/components/mobile/phone-frame'
import { BottomNav } from '@/components/mobile/bottom-nav'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <PhoneFrame>
      <div className="relative h-full flex flex-col">
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 relative"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <BottomNav />
      </div>
    </PhoneFrame>
  )
}
