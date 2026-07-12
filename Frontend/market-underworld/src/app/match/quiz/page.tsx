
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { NexusButton } from "@/components/ui/nexus-button"
import { NexusCard } from "@/components/ui/nexus-card"
import { Slider } from "@/components/ui/slider"
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Target, 
  Lightbulb, 
  Clock, 
  ShieldCheck,
  Calculator,
  FlaskConical,
  Zap,
  Code,
  Globe,
  Database,
  Music,
  Palette,
  TrendingUp,
  FileText,
  Briefcase,
  Sparkles
} from "lucide-react"

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: Calculator },
  { id: 'chem', name: 'Chemistry', icon: FlaskConical },
  { id: 'phys', name: 'Physics', icon: Zap },
  { id: 'code', name: 'Coding & Dev', icon: Code },
  { id: 'lang', name: 'Languages', icon: Globe },
  { id: 'data', name: 'Data Science', icon: Database },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'trade', name: 'Trading & Finance', icon: TrendingUp },
  { id: 'write', name: 'English & Writing', icon: FileText },
  { id: 'biz', name: 'Business & MBA', icon: Briefcase },
  { id: 'other', name: 'Other / Custom', icon: Target },
]

const GOALS = [
  { id: 'exam', title: 'Pass an exam or test', desc: 'JEE, SAT, IELTS, University entrance...' },
  { id: 'pro', title: 'Professional development', desc: 'Upskill for career or job switch' },
  { id: 'growth', title: 'Personal interest & growth', desc: 'Learn for fun or self-improvement' },
  { id: 'fast', title: 'Fast-track skill building', desc: 'Master a skill as quickly as possible' },
]

export default function MatchQuiz() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<any>({
    subject: [],
    goal: null,
    level: 3,
    hoursPerWeek: 5,
  })

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
    else router.push("/match/analyzing")
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
    else router.push("/match")
  }

  return (
    <div className="min-h-screen pt-24 pb-32">
      {/* Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-14 bg-[#0D0D14] border-b border-white/5 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step {step} of 3</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'bg-white/5'}`} />
            ))}
          </div>
        </div>
        <button onClick={prevStep} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="container mx-auto px-6 max-w-4xl pt-20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">🎯 What do you want to achieve?</h2>
                <p className="text-gray-500">Question 1 of 3 — Learning Goals</p>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">What subject do you most want to learn?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SUBJECTS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          const has = answers.subject.includes(s.id)
                          setAnswers({ ...answers, subject: has ? answers.subject.filter((x: any) => x !== s.id) : [...answers.subject, s.id] })
                        }}
                        className={`p-6 rounded-2xl border transition-all text-center group ${
                          answers.subject.includes(s.id) 
                            ? 'bg-cyan-400/10 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,212,255,0.1)]' 
                            : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        <s.icon className={`w-8 h-8 mx-auto mb-4 group-hover:scale-110 transition-transform ${answers.subject.includes(s.id) ? 'text-cyan-400' : ''}`} />
                        <div className="text-xs font-bold">{s.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold">What is your main learning goal?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GOALS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setAnswers({ ...answers, goal: g.id })}
                        className={`p-6 rounded-2xl border transition-all text-left relative group ${
                          answers.goal === g.id 
                            ? 'bg-cyan-400/10 border-cyan-400' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold mb-1">{g.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{g.desc}</div>
                        {answers.goal === g.id && <div className="absolute top-4 right-4 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-10">
                <NexusButton onClick={nextStep} disabled={!answers.goal || answers.subject.length === 0} className="px-12 h-14 font-bold">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </NexusButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">🧠 How do you learn best?</h2>
                <p className="text-gray-500">Question 2 of 3 — Teaching Style</p>
              </div>

              <div className="space-y-12">
                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold">What is your current level?</h3>
                    <span className="text-cyan-400 font-bold text-lg">{['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'][answers.level - 1]}</span>
                  </div>
                  <div className="px-2">
                    <Slider 
                      defaultValue={[3]} 
                      max={5} 
                      min={1} 
                      step={1}
                      onValueChange={(v) => setAnswers({ ...answers, level: v[0] })}
                    />
                    <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold">Hours per week commitment?</h3>
                    <span className="text-cyan-400 font-bold text-lg">{answers.hoursPerWeek} Hours</span>
                  </div>
                  <div className="px-2">
                    <Slider 
                      defaultValue={[5]} 
                      max={20} 
                      min={1} 
                      step={1}
                      onValueChange={(v) => setAnswers({ ...answers, hoursPerWeek: v[0] })}
                    />
                    <div className="mt-6 p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl text-xs text-cyan-400 font-medium">
                      💡 At {answers.hoursPerWeek} hrs/week — estimated goal achievement in ~{Math.max(1, Math.floor(20/answers.hoursPerWeek))} months.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-10">
                <NexusButton onClick={nextStep} className="px-12 h-14 font-bold">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </NexusButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">📅 Schedule & Budget</h2>
                <p className="text-gray-500">Question 3 of 3 — Logistics</p>
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-bold">Final check — Ready to match?</h3>
                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Privacy Protected</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Your answers are only shared with teachers we match you with. You remain anonymous until you message them.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center justify-center text-purple-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Deterministic Accuracy</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Our AI analyzes 47 compatibility factors including timezone, teaching history, and curriculum specialization.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-10">
                <NexusButton onClick={nextStep} className="px-12 h-14 font-bold nexus-gradient-bg">
                  Find My Matches ✨
                </NexusButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
