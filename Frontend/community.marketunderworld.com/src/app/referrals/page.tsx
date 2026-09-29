
"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Slider } from '@/components/ui/slider'
import { 
  Users, 
  TrendingUp, 
  Copy, 
  Share2, 
  Award, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Wallet,
  QrCode,
  Crown
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const EARNINGS_DATA = [
  { name: 'W1', val: 0.005 },
  { name: 'W2', val: 0.015 },
  { name: 'W3', val: 0.010 },
  { name: 'W4', val: 0.025 },
  { name: 'W5', val: 0.035 },
];

const REFERRALS = [
  { id: 1, name: 'Neha Gupta', date: 'Feb 8, 2026', status: 'active', earned: '0.015 ETH', actions: ['Class', 'Purchase', 'Gold'] },
  { id: 2, name: 'Rahul Kumar', date: 'Feb 15, 2026', status: 'active', earned: '0.005 ETH', actions: ['Class', 'Purchase'] },
  { id: 3, name: 'Priya Patel', date: 'Mar 1, 2026', status: 'pending', earned: '0.000 ETH', actions: ['Joined'] },
  { id: 4, name: 'Amit Shah', date: 'Mar 3, 2026', status: 'pending', earned: '0.000 ETH', actions: ['Joined'] },
];

export default function ReferralsPage() {
  const [friendsCount, setFriendsCount] = useState(5)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText("ARYAN2026")
    toast({ title: "Code Copied! ✅", description: "Referral code ARYAN2026 is ready to share." })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Hero Section */}
      <section className="relative pt-44 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <NexusBadge variant="info" className="px-6 py-2">👥 NEXUS Referral Program</NexusBadge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
                  Invite Friends. <br />
                  <span className="nexus-gradient-text">Earn Crypto.</span>
                </h1>
                <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
                  Earn 0.005 ETH for every friend who joins and completes their first class or purchase on NEXUS.
                </p>
              </div>

              {/* Calculator */}
              <NexusCard className="p-10 border-white/10 bg-white/[0.02] space-y-8 max-w-2xl">
                <div className="flex justify-between items-end">
                  <h3 className="text-xl font-bold">How much could you earn?</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cyan-400">{(friendsCount * 0.005).toFixed(3)} ETH</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">≈ ${(friendsCount * 0.005 * 2900).toFixed(0)} USD</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <Slider 
                    defaultValue={[5]} 
                    max={50} 
                    min={1} 
                    step={1}
                    onValueChange={(v) => setFriendsCount(v[0])}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                    <span>Invite 1 friend</span>
                    <span>Invite 50 friends</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    At <span className="text-white font-bold">{friendsCount} friends</span>, you'll reach <span className="text-cyan-400 font-bold">{friendsCount >= 25 ? 'Gold Referrer' : friendsCount >= 10 ? 'Silver Referrer' : 'Bronze Referrer'}</span> status, unlocking bonus rewards!
                  </p>
                </div>
              </NexusCard>
            </div>

            <div className="lg:col-span-5 relative group">
              <div className="absolute -inset-4 bg-cyan-500/10 blur-[80px] rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />
              <NexusCard className="p-10 border-white/10 bg-gradient-to-br from-[#111118] to-[#0A0A0F] shadow-3xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                  <QrCode className="w-24 h-24" />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Your Referral Code</div>
                  <div className="text-5xl font-black tracking-widest text-white">ARYAN2026</div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-medium">Share your unique link or code to start earning crypto rewards instantly.</p>
                  <div className="flex gap-3">
                    <NexusButton onClick={copyCode} className="flex-1 h-14 nexus-gradient-bg font-bold"><Copy className="w-4 h-4 mr-2" /> Copy Code</NexusButton>
                    <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  <span>Invite Friends</span>
                  <span className="w-1 h-1 bg-white/10 rounded-full" />
                  <span>Earn Crypto</span>
                  <span className="w-1 h-1 bg-white/10 rounded-full" />
                  <span>Grow Global</span>
                </div>
              </NexusCard>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-32 space-y-44">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Referred', val: '7 Friends', sub: '↑ +2 this month', color: 'text-cyan-400' },
            { label: 'Total Earned', val: '0.035 ETH', sub: '≈ $101.50 USD', color: 'text-amber-400' },
            { label: 'Active Users', val: '5 Active', sub: 'Using NEXUS daily', color: 'text-emerald-400' },
            { label: 'Status', val: 'Silver Referrer', sub: '3 more to Gold', color: 'text-purple-400' },
          ].map((stat, i) => (
            <NexusCard key={i} className="p-8 bg-white/[0.02] border-white/5 space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
              <div className={cn("text-3xl font-bold", stat.color)}>{stat.val}</div>
              <div className="text-[10px] font-bold text-gray-600">{stat.sub}</div>
            </NexusCard>
          ))}
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-6 h-6 text-cyan-400" /> My Referrals (7)
              </h3>
              <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.01] border-b border-white/5">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">User</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Joined</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {REFERRALS.map((ref) => (
                      <tr key={ref.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-sm text-gray-400">{ref.name.charAt(0)}</div>
                            <div>
                              <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{ref.name}</div>
                              <div className="flex gap-1.5 mt-1">
                                {ref.actions.map(a => <span key={a} className="text-[8px] font-bold text-gray-600 uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{a}</span>)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-xs text-gray-500 font-medium">{ref.date}</td>
                        <td className="p-6 text-center">
                          <NexusBadge 
                            variant={ref.status === 'active' ? 'success' : 'warning'} 
                            className="bg-transparent border-none px-0"
                          >
                            {ref.status === 'active' ? '● Active' : '● Pending'}
                          </NexusBadge>
                        </td>
                        <td className="p-6 text-right font-bold text-white">{ref.earned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </NexusCard>
            </section>

            <section className="space-y-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-500" /> Earnings Over Time
              </h3>
              <NexusCard className="p-8 border-white/5 bg-white/[0.02] h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EARNINGS_DATA}>
                    <defs>
                      <linearGradient id="refGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="val" stroke="#00D4FF" strokeWidth={3} fill="url(#refGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </NexusCard>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <section className="space-y-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-500" /> Top Referrers
              </h3>
              <div className="space-y-4">
                <div className="flex items-end justify-center gap-4 py-8 mb-8 border-b border-white/5 h-[240px]">
                  <PodiumBar rank={2} name="Vikash P." val="0.09 ETH" height="140px" />
                  <PodiumBar rank={1} name="Rahul M." val="0.272 ETH" height="180px" featured />
                  <PodiumBar rank={3} name="Sadia K." val="0.075 ETH" height="110px" />
                </div>
                
                <div className="space-y-3">
                  {[4, 5, 6].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600">#{i}</span>
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <span className="text-xs font-bold">Referrer_{i}</span>
                      </div>
                      <span className="text-xs font-bold text-cyan-400">0.0{8-i} ETH</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <NexusCard className="p-10 border-white/5 bg-gradient-to-br from-cyan-500/[0.05] to-transparent space-y-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto shadow-2xl">
                <Crown className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold">March Leaderboard</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Top 10 referrers win an extra 0.1 ETH + Diamond Membership 💎</p>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Ends In</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">21d 04h 32m 17s</div>
              </div>
              <NexusButton className="w-full h-12 nexus-gradient-bg font-bold">Invite More Friends</NexusButton>
            </NexusCard>
          </div>
        </div>
      </main>
    </div>
  )
}

function PodiumBar({ rank, name, val, height, featured }: any) {
  return (
    <div className="flex flex-col items-center gap-4 flex-1">
      <div className="text-center">
        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">{name}</div>
        <div className="text-xs font-bold text-cyan-400">{val}</div>
      </div>
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height }}
        className={cn(
          "w-full rounded-t-2xl relative flex flex-col items-center justify-center gap-2",
          featured ? "bg-gradient-to-t from-amber-500/40 to-amber-500/10 border-x border-t border-amber-500/30" : "bg-white/5 border-x border-t border-white/10"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
          rank === 1 ? "bg-amber-500 text-black shadow-xl shadow-amber-500/20" : "bg-white/10 text-white"
        )}>
          {rank === 1 ? '👑' : rank}
        </div>
      </motion.div>
    </div>
  )
}
