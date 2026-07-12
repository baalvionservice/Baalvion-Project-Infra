"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NexusButton } from '@/components/ui/nexus-button'
import { ChevronRight, Globe, Zap, ShoppingBag, Users, Wallet, Sparkles, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    id: 1,
    title: "Learn from the World's Best Teachers",
    subtitle: "343 expert teachers across 7 global regions. Private 1-on-1 classes. Pay with crypto.",
    color: "from-purple-600/20 to-purple-900/20",
    icon: <Globe className="w-20 h-20 text-purple-400" />,
    stats: ["7 Regions", "343 Teachers", "3,430 Students"]
  },
  {
    id: 2,
    title: "Private 1-on-1 Classes, Anywhere",
    subtitle: "Book instant or scheduled classes with expert teachers across all STEM subjects.",
    color: "from-cyan-600/20 to-cyan-900/20",
    icon: <Zap className="w-20 h-20 text-cyan-400" />,
    features: ["HD Live Video", "Interactive Whiteboard", "AI Matching"]
  },
  {
    id: 3,
    title: "Shop Everything. Pay with Crypto.",
    subtitle: "Fashion, food delivery, travel, events and more. All powered by blockchain payments.",
    color: "from-emerald-600/20 to-emerald-900/20",
    icon: <ShoppingBag className="w-20 h-20 text-emerald-400" />,
    crypto: ["BTC", "ETH", "USDT", "SOL"]
  },
  {
    id: 4,
    title: "Join a Global Community",
    subtitle: "Connect with students and teachers from 49 countries. Discuss and grow together.",
    color: "from-blue-600/20 to-blue-900/20",
    icon: <Users className="w-20 h-20 text-blue-400" />,
    regions: ["East Asia", "Europe", "MENA", "South Asia"]
  },
  {
    id: 5,
    title: "Your Crypto Wallet, Built In.",
    subtitle: "Send, receive and spend crypto directly on NEXUS. No external wallet needed.",
    color: "from-amber-600/20 to-amber-900/20",
    icon: <Wallet className="w-20 h-20 text-amber-400" />,
    security: ["256-bit Encrypted", "Instant Payouts", "Global"]
  }
]

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const router = useRouter()

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      setIsFinished(true)
    }
  }

  if (isFinished) {
    return <SignupScreen onComplete={() => router.push('/app/home')} />
  }

  const slide = SLIDES[currentSlide]

  return (
    <div className="h-full flex flex-col justify-between p-8 relative overflow-hidden bg-[#050508]">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-all duration-700", slide.color)} />
      
      <div className="flex justify-end relative z-10">
        <button onClick={() => setIsFinished(true)} className="text-[#5A5A7A] text-sm font-bold uppercase tracking-widest">Skip</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 relative z-10">
        <motion.div
          key={slide.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-40 h-40 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl"
        >
          {slide.icon}
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            key={`title-${slide.id}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold tracking-tight text-white leading-tight"
          >
            {slide.title}
          </motion.h1>
          <motion.p
            key={`sub-${slide.id}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[#A0A0B8] text-base font-medium leading-relaxed px-4"
          >
            {slide.subtitle}
          </motion.p>
        </div>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/20"
              )} 
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 pb-8">
        <NexusButton onClick={handleNext} size="lg" className="w-full h-16 text-lg font-bold">
          {currentSlide === SLIDES.length - 1 ? "Get Started" : "Continue"} <ChevronRight className="ml-2 w-5 h-5" />
        </NexusButton>
      </div>
    </div>
  )
}

function SignupScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)

  return (
    <div className="h-full flex flex-col p-8 bg-[#050508] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
      
      <div className="mt-12 text-center space-y-4 mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 shadow-xl">NX</div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
        <p className="text-[#5A5A7A] font-medium">Join 3,430 global learners</p>
      </div>

      {step === 1 && (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
            <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-medium focus:border-blue-500/50 outline-none" placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
            <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-medium focus:border-blue-500/50 outline-none" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <input type="password" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-medium focus:border-blue-500/50 outline-none" placeholder="••••••••••••" />
          </div>
          <NexusButton onClick={() => setStep(2)} className="w-full h-16 text-lg font-bold mt-8">Continue</NexusButton>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-12">
          <h3 className="text-xl font-bold text-center">Where are you from?</h3>
          <div className="grid grid-cols-2 gap-4">
            {["South Asia 🌿", "East Asia 🌏", "Europe 🌍", "North America 🗽"].map(r => (
              <button key={r} onClick={() => setStep(3)} className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center hover:border-blue-500/50 transition-all group">
                <div className="text-sm font-bold text-gray-400 group-hover:text-white">{r}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Check className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-bold">Account Ready!</h3>
            <p className="text-[#A0A0B8]">Welcome to the NEXUS global ecosystem, Aryan Mehta. Ready to learn?</p>
          </div>
          
          <div className="w-full space-y-4 pt-8">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div className="text-sm font-bold text-white">5 Perfect Teacher Matches Found</div>
            </div>
            <NexusButton onClick={onComplete} className="w-full h-16 text-lg font-bold">🚀 Start Learning</NexusButton>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
