
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Sparkles, Brain, Zap, Target, CheckCircle2 } from "lucide-react"

export default function AIAnalyzing() {
  const router = useRouter()
  const [phase, setPhase] = useState(1)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => router.push("/match/results"), 500)
          return 100
        }
        return prev + 1
      })
    }, 40)

    const phaseTimer = setInterval(() => {
      setPhase(prev => (prev < 4 ? prev + 1 : 4))
    }, 1000)

    return () => {
      clearInterval(timer)
      clearInterval(phaseTimer)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-12">
        <div className="relative">
          {/* Progress Ring */}
          <div className="w-48 h-48 mx-auto relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-white/5"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-cyan-400"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={553}
                strokeDashoffset={553 - (553 * progress) / 100}
                transition={{ duration: 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {progress < 100 ? (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-3xl font-bold"
                  >
                    {progress}%
                  </motion.div>
                ) : (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Drifting Tags */}
          <AnimatePresence>
            {phase === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute -top-10 -left-10 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-bold">📚 Subject: Chemistry</motion.div>
            )}
            {phase === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute -bottom-10 -right-10 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-[10px] font-bold">🎯 Goal: Exam Prep</motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl font-bold h-8"
            >
              {phase === 1 && "🧠 Analyzing your profile..."}
              {phase === 2 && "📊 Scoring 343 teachers..."}
              {phase === 3 && "🎯 Calculating match scores..."}
              {phase === 4 && "✨ Your matches are ready!"}
            </motion.div>
          </AnimatePresence>
          <p className="text-gray-500 text-sm h-4">
            {phase === 1 && "Processing 13 preference signals"}
            {phase === 2 && "Evaluating 47 compatibility factors"}
            {phase === 3 && "Comparing teaching styles and timezone overlap"}
            {phase === 4 && "Found 5 perfect matches for you"}
          </p>
        </div>

        <div className="flex justify-center gap-4 opacity-20">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-gray-800 border border-white/10" />
          ))}
        </div>
      </div>
    </div>
  )
}
