
"use client"

import React, { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Gift, 
  CreditCard, 
  Send, 
  Copy, 
  Check, 
  Search, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const CARD_DESIGNS = [
  { id: 1, name: 'Classic NEXUS', gradient: 'from-[#6C63FF] to-[#00D4FF]' },
  { id: 2, name: 'Premium Gold', gradient: 'from-amber-400 to-amber-700' },
  { id: 3, name: 'Marketplace', gradient: 'from-[#00E676] to-teal-600' },
  { id: 4, name: 'Birthday Special', gradient: 'from-rose-400 to-purple-600' },
  { id: 5, name: 'Education Focus', gradient: 'from-blue-400 to-cyan-600' },
  { id: 6, name: 'Celebration', gradient: 'from-red-500 to-orange-500' }
]

const QUICK_MESSAGES = [
  { label: '🎂 Birthday', text: 'Wishing you a wonderful birthday! Enjoy learning on NEXUS 🎉' },
  { label: '🎓 Graduation', text: 'Congratulations on your graduation! Keep growing your skills 📚' },
  { label: '🎄 Holiday', text: 'Happy Holidays! Here is a little something for your next class 🎁' },
  { label: '⭐ Support', text: 'Hope this helps with your studies! You got this! 💪' }
]

export default function GiftCardsPage() {
  const [activeTab, setActiveTab] = useState<'buy' | 'redeem'>('buy')
  const [selectedDesign, setSelectedDesign] = useState(CARD_DESIGNS[0])
  const [amount, setAmount] = useState('0.05')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [isSent, setIsSent] = useState(false)
  const { toast } = useToast()

  // 3D Tilt Values
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleSend = () => {
    setIsSent(true)
    setTimeout(() => {
      toast({ title: "Gift Card Sent! 🎉", description: `Delivered to ${recipient} instantly.` })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Navigation Tabs */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center">
        <button 
          onClick={() => setActiveTab('buy')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'buy' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-500 hover:text-white"
          )}
        >
          <Gift className="w-4 h-4" /> Buy Gift Card
        </button>
        <button 
          onClick={() => setActiveTab('redeem')}
          className={cn(
            "px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'redeem' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-500 hover:text-white"
          )}
        >
          <CreditCard className="w-4 h-4" /> Redeem Card
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'buy' ? (
          <motion.div 
            key="buy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-44 pb-32 max-w-7xl mx-auto px-6"
          >
            {!isSent ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Customizer Form */}
                <div className="lg:col-span-7 space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-5xl font-bold tracking-tight leading-tight">
                      Give the Gift of <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">Global Learning.</span>
                    </h1>
                    <p className="text-gray-500 text-lg">Send crypto-powered NEXUS gift cards to anyone, anywhere. Delivered instantly via email.</p>
                  </div>

                  <div className="space-y-10">
                    <section className="space-y-6">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">1. Select Amount</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {['0.01', '0.03', '0.05', '0.1', '0.25', 'Custom'].map(amt => (
                          <button
                            key={amt}
                            onClick={() => amt !== 'Custom' && setAmount(amt)}
                            className={cn(
                              "p-6 rounded-3xl border transition-all text-center group",
                              amount === amt ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-xl shadow-amber-500/5" : "bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20"
                            )}
                          >
                            <div className="font-bold text-lg">{amt === 'Custom' ? 'Custom' : `${amt} ETH`}</div>
                            <div className="text-[10px] font-bold text-gray-600 mt-1">≈ ${amt === 'Custom' ? '??' : (Number(amt) * 2900).toFixed(0)} USDT</div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-6">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">2. Choose a Design</label>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {CARD_DESIGNS.map(design => (
                          <button
                            key={design.id}
                            onClick={() => setSelectedDesign(design)}
                            className={cn(
                              "aspect-square rounded-2xl bg-gradient-to-br transition-all relative overflow-hidden group",
                              design.gradient,
                              selectedDesign.id === design.id ? "ring-2 ring-white ring-offset-4 ring-offset-[#0A0A0F] scale-110 shadow-2xl" : "opacity-60 hover:opacity-100"
                            )}
                          >
                            {selectedDesign.id === design.id && <div className="absolute inset-0 bg-white/10 shimmer-fast" />}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-6">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">3. Recipient Details</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          placeholder="Recipient Name" 
                          className="h-14 bg-black/40 border-white/10" 
                          onChange={(e) => setRecipient(e.target.value)}
                        />
                        <Input placeholder="Recipient Email" className="h-14 bg-black/40 border-white/10" />
                      </div>
                      <div className="space-y-4">
                        <Textarea 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add a personal message..." 
                          className="min-h-[120px] bg-black/40 border-white/10 p-6 rounded-3xl"
                        />
                        <div className="flex flex-wrap gap-2">
                          {QUICK_MESSAGES.map(qm => (
                            <button 
                              key={qm.label}
                              onClick={() => setMessage(qm.text)}
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-gray-500 hover:bg-white/10 hover:text-white transition-all"
                            >
                              {qm.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="pt-12 border-t border-white/5">
                    <NexusButton 
                      onClick={handleSend}
                      className="w-full h-20 text-2xl font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-2xl shadow-amber-500/20 rounded-[2.5rem]"
                    >
                      🚀 Send Gift Card — {amount} ETH
                    </NexusButton>
                    <p className="text-center text-xs text-gray-600 font-bold uppercase tracking-widest mt-6">
                      ✅ 100% of value goes to recipient • No platform fees on gift cards
                    </p>
                  </div>
                </div>

                {/* Live Preview Column */}
                <div className="lg:col-span-5">
                  <div className="sticky top-44 space-y-12">
                    <div className="text-center space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Live Preview</label>
                      <p className="text-xs text-gray-600">Hover to see 3D tilt effect</p>
                    </div>

                    <motion.div
                      style={{ 
                        rotateX, 
                        rotateY, 
                        perspective: 1000,
                        transformStyle: "preserve-3d" 
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        "relative w-full aspect-[1.6/1] rounded-[2.5rem] bg-gradient-to-br p-10 flex flex-col justify-between overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] group",
                        selectedDesign.gradient
                      )}
                    >
                      {/* Holographic Overlays */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer-sweep" />
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
                      
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg">NX</div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">NEXUS GIFT CARD</div>
                          <div className="font-mono text-xs text-white/40 mt-1 tracking-tighter">XXXX-XXXX-XXXX</div>
                        </div>
                      </div>

                      <div className="relative z-10 text-center space-y-2">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em]">Amount</div>
                        <div className="text-6xl font-bold tracking-tighter drop-shadow-2xl">{amount} <span className="text-2xl opacity-60">ETH</span></div>
                        <div className="text-sm font-bold text-white/40">≈ ${(Number(amount) * 2900).toFixed(0)} USDT</div>
                      </div>

                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Recipient</div>
                          <div className="font-bold text-sm truncate max-w-[180px]">{recipient || 'Full Name'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">From</div>
                          <div className="font-bold text-sm">Aryan Mehta</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Email Mockup */}
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Recipient's Email View</div>
                      <div className="bg-[#050508] rounded-2xl p-6 space-y-4 border border-white/5">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500"><Gift className="w-4 h-4" /></div>
                          <div className="text-sm font-bold">You received a Gift Card!</div>
                        </div>
                        <p className="text-xs text-gray-400 italic">"{message || 'Your message will appear here...'}"</p>
                        <NexusButton size="sm" className="w-full bg-white/5 border border-white/10 text-[10px]">Claim My 0.05 ETH →</NexusButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto py-24 text-center space-y-12">
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto shadow-2xl border border-emerald-500/20"
                  >
                    <Check className="w-16 h-16" />
                  </motion.div>
                  <div className="absolute inset-0 sparkle-effect" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl font-bold tracking-tight">Gift Card Sent! 🎉</h2>
                  <p className="text-gray-500 text-lg">Recipient will receive it at their email in seconds.</p>
                </div>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Transaction Record</div>
                  <div className="font-mono text-lg font-bold text-amber-500 tracking-widest uppercase">NEXUS-5XK2-8JM4-9PL7</div>
                  <NexusButton variant="outline" className="w-full border-white/10 h-12 font-bold"><Copy className="w-4 h-4 mr-2" /> Copy Card Code</NexusButton>
                </div>
                <NexusButton onClick={() => setIsSent(false)} className="w-full h-14 bg-white/5 border border-white/10 text-white hover:bg-white/10">Send Another Gift Card</NexusButton>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="redeem"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-44 pb-32 max-w-2xl mx-auto px-6 text-center space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">Redeem Your Card</h1>
              <p className="text-gray-500">Enter your 12-character code below to add funds to your wallet.</p>
            </div>

            <div className="space-y-10">
              <div className="flex justify-center gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1">
                    <input 
                      maxLength={4}
                      placeholder="XXXX"
                      className="w-full h-20 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-mono font-bold text-white uppercase focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              <NexusButton className="w-full h-16 text-lg font-bold bg-amber-500 text-black hover:bg-amber-400">
                Redeem Now — 0.05 ETH <ArrowRight className="w-5 h-5 ml-2" />
              </NexusButton>
            </div>

            <div className="pt-24 space-y-8 text-left">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Transaction History</h3>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Gift className="w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-sm">Redeemed Card — Mar {10-i}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">From: Teacher Reward</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">+0.02 ETH</div>
                      <div className="text-[10px] text-gray-600">✅ COMPLETED</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .shimmer-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          animation: sweep 3s infinite;
        }
        .shimmer-fast::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: sweep 1.5s infinite;
        }
      `}</style>
    </div>
  )
}
