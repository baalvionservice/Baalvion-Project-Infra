
"use client"

import { motion } from "framer-motion"
import { NexusButton } from "@/components/ui/nexus-button"
import { NexusBadge } from "@/components/ui/nexus-card"
import { Sparkles, Brain, Zap, Target, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AIMatchLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
      <div className="max-w-4xl text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000" />
            <NexusBadge variant="info" className="relative bg-[#0A0A0F] border-none px-6 py-2">
              <span className="nexus-gradient-text flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Powered by NEXUS AI
              </span>
            </NexusBadge>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1]">
            Find Your Perfect <br />
            <span className="nexus-gradient-text">Teacher in 60 Seconds.</span>
          </h1>

          <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Our AI analyzes your learning style, goals, schedule and preferences to match you with the ideal private teacher from 343 global experts.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <NexusBadge variant="default" className="bg-white/5 border border-white/10 px-4 py-2">🎯 Personalized Match</NexusBadge>
            <NexusBadge variant="default" className="bg-white/5 border border-white/10 px-4 py-2">🌍 From 7 Regions</NexusBadge>
            <NexusBadge variant="default" className="bg-white/5 border border-white/10 px-4 py-2">⚡ 60-Second Quiz</NexusBadge>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Link href="/match/quiz">
              <NexusButton size="lg" className="px-16 h-20 text-xl shadow-2xl shadow-[#6C63FF]/30">
                ✨ Start AI Matching <ChevronRight className="ml-2 w-6 h-6" />
              </NexusButton>
            </Link>
            <Link href="/education" className="text-gray-500 hover:text-white transition-colors font-bold text-sm">
              Already have a teacher? Browse all teachers →
            </Link>
          </div>
        </motion.div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
          {[
            { icon: Brain, color: "bg-purple-500/10 text-purple-400", title: "Answer 13 Questions", desc: "Tell us your goals, style and availability" },
            { icon: Zap, color: "bg-cyan-500/10 text-cyan-400", title: "AI Analyzes 47 Factors", desc: "Our algorithm scores every teacher against your profile" },
            { icon: Target, color: "bg-amber-500/10 text-amber-400", title: "Get Your Matches", desc: "Ranked by compatibility with detailed match explanations" },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center space-y-4"
            >
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
