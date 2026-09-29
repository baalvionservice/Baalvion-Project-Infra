
"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Crown, 
  ChevronDown, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get Started',
    priceMonthly: '0',
    priceAnnual: '0',
    color: 'gray',
    features: [
      { name: 'Browse all 343 teachers', included: true },
      { name: '1 free trial class/month', included: true },
      { name: 'Marketplace access (standard)', included: true },
      { name: 'Forum access (read)', included: true },
      { name: 'Basic crypto wallet', included: true },
      { name: 'Student dashboard', included: true },
      { name: 'Class discounts', included: false },
      { name: 'VIP forum access', included: false },
      { name: 'Priority matching', included: false },
      { name: 'Cashback rewards', included: false },
    ],
    cta: 'Get Started Free',
    variant: 'outline' as const
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For new learners',
    priceMonthly: '0.01',
    priceAnnual: '0.008',
    color: 'cyan',
    features: [
      { name: 'Everything in Free', included: true },
      { name: '5% discount on all classes', included: true },
      { name: '3 classes/month included', included: true },
      { name: 'Forum posting access', included: true },
      { name: 'Basic priority matching', included: true },
      { name: 'Order tracking premium', included: true },
      { name: '1% cashback on marketplace', included: true },
      { name: 'VIP forum access', included: false },
      { name: 'Dedicated support', included: false },
      { name: 'Group class access', included: false },
    ],
    cta: 'Start Starter',
    variant: 'primary' as const
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'For serious learners',
    priceMonthly: '0.03',
    priceAnnual: '0.022',
    color: 'gold',
    popular: true,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: '15% discount on ALL classes', included: true },
      { name: '10 classes/month included', included: true },
      { name: 'VIP forum full access 👑', included: true },
      { name: 'AI teacher matching priority', included: true },
      { name: '3% cashback on marketplace', included: true },
      { name: 'Early access to flash deals', included: true },
      { name: 'Group class access', included: true },
      { name: 'Priority customer support', included: true },
      { name: 'Monthly reward: 0.001 ETH', included: true },
    ],
    cta: 'Get Gold Plan',
    variant: 'vip' as const
  },
  {
    id: 'diamond',
    name: 'Diamond',
    tagline: 'For elite learners',
    priceMonthly: '0.1',
    priceAnnual: '0.075',
    color: 'holographic',
    inviteOnly: true,
    features: [
      { name: 'Everything in Gold', included: true },
      { name: '25% discount on ALL classes', included: true },
      { name: 'Unlimited classes included', included: true },
      { name: 'Personal success manager', included: true },
      { name: '5% cashback everywhere', included: true },
      { name: 'Diamond-only exclusive events', included: true },
      { name: 'First access to new teachers', included: true },
      { name: 'Custom learning roadmap', included: true },
      { name: '1-on-1 NEXUS advisor', included: true },
      { name: 'White-glove VIP orders', included: true },
    ],
    cta: 'Apply for Diamond',
    variant: 'primary' as const
  }
]

export default function SubscriptionsPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [expandedTable, setExpandedTable] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Hero Section */}
      <section className="relative pt-44 pb-20 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" 
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl space-y-12">
          <div className="space-y-6">
            <NexusBadge variant="vip" className="px-6 py-2">✨ NEXUS Membership — Unlock More</NexusBadge>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
              One Membership. <br />
              <span className="nexus-gradient-text">Unlimited Learning.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Get unlimited class discounts, marketplace deals, VIP forum access, and crypto rewards — all in one plan.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex items-center relative">
              <div 
                className={cn(
                  "absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white/10 rounded-xl transition-all duration-300 ease-out",
                  billingPeriod === 'annual' ? "translate-x-full" : "translate-x-0"
                )}
              />
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={cn(
                  "relative z-10 px-8 py-2.5 text-sm font-bold transition-colors",
                  billingPeriod === 'monthly' ? "text-white" : "text-gray-500"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingPeriod('annual')}
                className={cn(
                  "relative z-10 px-8 py-2.5 text-sm font-bold transition-colors flex items-center gap-2",
                  billingPeriod === 'annual' ? "text-white" : "text-gray-500"
                )}
              >
                Annually <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">-25%</span>
              </button>
            </div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
              {billingPeriod === 'annual' ? "Save up to 0.3 ETH/year with annual billing" : "Switch to annual to save up to 25%"}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12 pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">2,847</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">4.9/5</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">0.18 ETH</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg Monthly Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Grid */}
      <section className="py-32 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <NexusBadge variant="vip" className="bg-amber-500 text-black border-none px-6 py-1.5 shadow-xl shadow-amber-500/20">
                    ⭐ MOST POPULAR
                  </NexusBadge>
                </div>
              )}

              <NexusCard 
                className={cn(
                  "p-0 h-full flex flex-col overflow-hidden transition-all duration-500",
                  plan.popular ? "border-amber-500/30 bg-amber-500/[0.02] scale-[1.04] shadow-2xl shadow-amber-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
                  plan.id === 'diamond' && "diamond-holographic border-purple-500/20"
                )}
              >
                <div className="p-8 space-y-8 flex-1">
                  <div className="space-y-2">
                    <h3 className={cn("text-2xl font-bold", plan.color === 'gold' ? 'text-amber-500' : plan.color === 'cyan' ? 'text-cyan-400' : 'text-white')}>
                      {plan.name} {plan.id === 'starter' ? '🚀' : plan.id === 'gold' ? '🥇' : plan.id === 'diamond' ? '💎' : ''}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">{plan.tagline}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">
                        {billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceAnnual} ETH
                      </span>
                      <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">/ month</span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                      ≈ {billingPeriod === 'monthly' ? (Number(plan.priceMonthly) * 2900).toFixed(0) : (Number(plan.priceAnnual) * 2900).toFixed(0)} USDT
                    </p>
                    {plan.id === 'gold' && (
                      <p className="text-[10px] text-emerald-500 font-bold uppercase mt-2">
                        Members save avg 0.18 ETH/month! 💰
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 pt-8 border-t border-white/5">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={cn("w-4 h-4 shrink-0 mt-0.5", plan.popular ? "text-amber-500" : "text-emerald-500")} />
                        ) : (
                          <X className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                        )}
                        <span className={cn("text-xs font-medium", feature.included ? "text-gray-300" : "text-gray-600")}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <NexusButton 
                    variant={plan.variant} 
                    className={cn(
                      "w-full h-14 font-bold text-lg",
                      plan.id === 'diamond' && "bg-gradient-to-r from-blue-400 via-rose-400 to-amber-400 text-black border-none"
                    )}
                  >
                    {plan.cta} {plan.id !== 'free' && '→'}
                  </NexusButton>
                  {plan.id !== 'free' && (
                    <p className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">
                      {plan.inviteOnly ? "Only 12 Diamond spots left" : "7-day free trial included"}
                    </p>
                  )}
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Toggle */}
      <section className="pb-44 container mx-auto px-6 max-w-5xl text-center space-y-12">
        <button 
          onClick={() => setExpandedTable(!expandedTable)}
          className="inline-flex items-center gap-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
        >
          {expandedTable ? "Collapse full comparison" : "Expand full comparison"}
          <ChevronDown className={cn("w-4 h-4 transition-transform", expandedTable && "rotate-180")} />
        </button>

        <AnimatePresence>
          {expandedTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <NexusCard className="p-0 border-white/5 bg-white/[0.01] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Feature</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Free</th>
                      <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Starter</th>
                      <th className="p-6 text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center">Gold</th>
                      <th className="p-6 text-[10px] font-bold text-purple-400 uppercase tracking-widest text-center">Diamond</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <ComparisonRow label="Trial classes/month" vals={["1", "1", "10", "∞"]} />
                    <ComparisonRow label="Class discount" vals={["—", "5%", "15%", "25%"]} />
                    <ComparisonRow label="Cashback rewards" vals={["—", "1%", "3%", "5%"]} />
                    <ComparisonRow label="AI match priority" vals={["Basic", "Basic", "High", "Highest"]} />
                    <ComparisonRow label="VIP forum access" vals={[false, false, true, true]} />
                    <ComparisonRow label="Dedicated support" vals={[false, false, true, true]} />
                    <ComparisonRow label="Monthly ETH reward" vals={["—", "—", "0.001", "0.005"]} />
                    <ComparisonRow label="Success manager" vals={[false, false, false, true]} />
                  </tbody>
                </table>
              </NexusCard>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <style jsx global>{`
        .diamond-holographic {
          position: relative;
        }
        .diamond-holographic::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
          background-size: 200% 200%;
          animation: shimmer 3s infinite linear;
          z-index: 1;
          pointer-events: none;
        }
        .diamond-holographic {
          animation: holographic 10s infinite linear;
        }
        @keyframes holographic {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function ComparisonRow({ label, vals }: { label: string, vals: any[] }) {
  return (
    <tr className="hover:bg-white/[0.01] transition-colors group">
      <td className="p-6 text-sm font-medium text-gray-400 group-hover:text-white">{label}</td>
      {vals.map((v, i) => (
        <td key={i} className="p-6 text-center">
          {typeof v === 'boolean' ? (
            v ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-800 mx-auto" />
          ) : (
            <span className="text-sm font-bold">{v}</span>
          )}
        </td>
      ))}
    </tr>
  )
}
