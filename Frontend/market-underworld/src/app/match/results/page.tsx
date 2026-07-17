
"use client"

import { motion } from "framer-motion"
import { TEACHERS } from "@/lib/mock-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Star, Users, ArrowRight, Check, Target, Zap, Globe, Sparkles } from "lucide-react"
import Link from "next/link"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const MATCHES = [
  { ...TEACHERS[0], score: 98, reasons: ["Specializes in exam preparation", "Available evenings & weekends", "Fast-paced teaching style"] },
  { ...TEACHERS[1], score: 91, reasons: ["Same region, great style match", "Physics overlap available"] },
  { ...TEACHERS[2], score: 87, reasons: ["Mathematics expert", "Proven high pass rate"] },
]

const RADAR_DATA = [
  { subject: 'Goal Clarity', A: 90 },
  { subject: 'Schedule', A: 70 },
  { subject: 'Budget', A: 60 },
  { subject: 'Style', A: 80 },
  { subject: 'Commitment', A: 80 },
  { subject: 'Regional', A: 90 },
];

export default function MatchResults() {
  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">✨ Your AI Matches</h1>
          <p className="text-gray-500 font-medium text-lg">Based on your learning profile — ranked by compatibility score</p>
          <div className="flex gap-2">
            <NexusBadge variant="info">Chemistry</NexusBadge>
            <NexusBadge variant="info">Exam Prep</NexusBadge>
            <NexusBadge variant="info">Fast Pace</NexusBadge>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/match/quiz">
            <NexusButton variant="outline" className="border-white/10">🔄 Retake Quiz</NexusButton>
          </Link>
        </div>
      </header>

      {/* #1 Match - Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NexusCard className="relative overflow-hidden border-[#FFD600]/30 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-10 group">
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="w-12 h-12 text-[#FFD600] opacity-20 group-hover:scale-110 transition-transform" />
          </div>
          <div className="absolute top-0 left-0 bg-[#FFD600] text-black px-6 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-br-2xl shadow-xl shadow-[#FFD600]/20">
            ✨ YOUR BEST MATCH
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6">
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-8 border-r border-white/5">
              <div className="relative">
                <img src={MATCHES[0].avatar_url} className="w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl" alt="Match" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#FFD600] text-black px-4 py-1 rounded-full text-xs font-bold">98% Match</div>
              </div>
              
              <div className="space-y-4 w-full px-4">
                {[
                  { label: "Goal Alignment", val: 100 },
                  { label: "Schedule Match", val: 98 },
                  { label: "Budget Fit", val: 95 },
                  { label: "Style Match", val: 93 },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5 text-left">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <span>{f.label}</span>
                      <span>{f.val}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${f.val}%` }} className="h-full bg-gradient-to-r from-amber-500 to-yellow-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">{MATCHES[0].name}</h2>
                <div className="text-lg text-gray-400 font-medium">{MATCHES[0].subject} Teacher • {MATCHES[0].country} {MATCHES[0].countryCode === 'IN' ? '🇮🇳' : ''}</div>
                <div className="flex items-center gap-2 text-yellow-500 font-bold">
                  <Star className="w-5 h-5 fill-yellow-500" /> {MATCHES[0].rating} <span className="text-gray-500 text-sm font-medium">({MATCHES[0].reviewCount} reviews)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">✨ Why Priya matches you:</h3>
                  <ul className="space-y-3">
                    {MATCHES[0].reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Availability</div>
                  <div className="text-lg font-bold">Next Slot: Today 4PM</div>
                  <div className="flex flex-wrap gap-2">
                    {['Today 4PM', 'Tomorrow 10AM', 'Mar 12 6PM'].map(s => <span key={s} className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-[10px] font-bold border border-cyan-400/20">{s}</span>)}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Hourly Rate</div>
                  <div className="text-2xl font-bold">{MATCHES[0].price_crypto} {MATCHES[0].currency}</div>
                </div>
                <div className="flex gap-4">
                  <NexusButton variant="outline" className="border-white/10 h-14 px-8">View Match Profile</NexusButton>
                  <Link href={`/education/teacher/${MATCHES[0].id}`}>
                    <NexusButton className="h-14 px-12 nexus-gradient-bg font-bold text-lg">Book Priya Now <ArrowRight className="ml-2 w-5 h-5" /></NexusButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </NexusCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-2xl font-bold">Other Strong Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MATCHES.slice(1).map((m, i) => (
              <NexusCard key={m.id} className="p-8 border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-white/5 px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">{m.score}% Score</div>
                <div className="flex items-center gap-6 mb-8">
                  <img src={m.avatar_url} className="w-16 h-16 rounded-full border-2 border-white/10" alt="avatar" />
                  <div>
                    <h3 className="text-xl font-bold">{m.name}</h3>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{m.subject}</div>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {m.reasons.map((r, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs font-medium text-gray-400">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {r}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="font-bold">{m.price_crypto} {m.currency}</div>
                  <NexusButton variant="ghost" className="h-10 text-[10px] font-bold border border-white/5 group-hover:border-cyan-400 group-hover:text-cyan-400">View Profile</NexusButton>
                </div>
              </NexusCard>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-2xl font-bold">Your Match Profile</h2>
          <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar
                    name="Aryan"
                    dataKey="A"
                    stroke="#6C63FF"
                    fill="#6C63FF"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-400 font-medium">Your profile is highly specific — excellent for finding a perfect match! 🎯</p>
            </div>
          </NexusCard>
        </div>
      </div>
    </div>
  )
}
