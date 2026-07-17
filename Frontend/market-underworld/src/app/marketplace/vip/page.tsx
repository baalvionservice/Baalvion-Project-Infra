"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Crown, 
  Star, 
  Shield, 
  Zap, 
  MessageSquare, 
  Clock, 
  Gem, 
  Target, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Lock,
  Search,
  CheckCircle2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const VIP_TIERS = [
  {
    id: 'silver',
    name: 'Silver Priority',
    icon: '🥈',
    price: '0.01 ETH',
    priceUsd: '29',
    color: 'silver',
    tagline: 'Fast-track your experience',
    benefits: [
      'Skip standard delivery queue',
      'Priority customer support',
      'Real-time GPS order tracking',
      'Dedicated delivery agent',
      '10% discount on marketplace',
      'Silver badge on profile'
    ],
    locked: ['White-glove delivery', 'Personal shopping assistant', 'Exclusive VIP products']
  },
  {
    id: 'gold',
    name: 'Gold Priority',
    icon: '🥇',
    price: '0.03 ETH',
    priceUsd: '87',
    color: 'gold',
    tagline: 'The preferred VIP tier',
    popular: true,
    benefits: [
      'Everything in Silver',
      'White-glove delivery service',
      'Personal shopping assistant',
      'Same-day delivery guarantee',
      'Free premium gift wrapping',
      '20% discount on marketplace',
      'Gold badge on profile',
      'VIP lounge access (events)'
    ],
    locked: ['Helicopter courier option', '24/7 concierge hotline']
  },
  {
    id: 'platinum',
    name: 'Platinum Exclusive',
    icon: '💎',
    price: '0.1 ETH',
    priceUsd: '290',
    color: 'platinum',
    tagline: 'For those who demand the best',
    benefits: [
      'Everything in Gold',
      'Helicopter/express courier option',
      '24/7 personal concierge hotline',
      'Exclusive unlisted products',
      'NEXUS Superchat shoutout',
      '30% discount on marketplace',
      'Platinum badge on profile',
      'Front-row at NEXUS events',
      'Monthly surprise luxury gift'
    ],
    locked: ['Diamond experience board']
  },
  {
    id: 'diamond',
    name: 'Diamond Experience',
    icon: '👑',
    price: '0.5 ETH',
    priceUsd: '1,450',
    color: 'diamond',
    tagline: 'Beyond first class',
    benefits: [
      'Everything in Platinum',
      'Dedicated NEXUS concierge team',
      'Access to NEXUS Diamond Vault',
      'Private jet upgrade option',
      'Personal shopper worldwide',
      'Instant priority on any service',
      'Diamond profile badge',
      'Monthly luxury hamper',
      'Invitation to Annual Diamond Gala',
      'Direct line to NEXUS CEO'
    ],
    locked: []
  }
];

const MOCK_VIP_ORDERS = [
  { id: 1, name: 'Marcus T.', tier: 'DIAMOND', msg: 'Priority concierge for Dubai trip — need airport transfer + hotel upgrade', amount: '0.5 ETH', time: '2 min ago' },
  { id: 2, name: 'Elena K.', tier: 'PLATINUM', msg: 'Same day delivery PLEASE — birthday gift for tomorrow!', amount: '0.1 ETH', time: '5 min ago' },
  { id: 3, name: 'Aryan M.', tier: 'GOLD', msg: 'Extra spicy please and fast!', amount: '0.03 ETH', time: '8 min ago' },
  { id: 4, name: 'Priya S.', tier: 'SILVER', msg: 'Regular order — priority please', amount: '0.01 ETH', time: '12 min ago' },
  { id: 5, name: 'Carlos M.', tier: 'GOLD', msg: 'VIP ticket booking — concert tonight', amount: '0.03 ETH', time: '15 min ago' },
];

export default function VIPPage() {
  const [liveOrders, setLiveOrders] = useState(MOCK_VIP_ORDERS);
  const [selectedTier, setSelectedDept] = useState('gold');

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveOrders(prev => {
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift({ ...last, id: Date.now() });
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#e5e7eb] selection:bg-amber-500/20">
      <Navbar isMarketplace />

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 overflow-hidden border-b border-white/5">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
          {/* Gold Dust Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * 100 + "%" }}
                animate={{ y: "120vh" }}
                transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
                className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[1px]"
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-pulse">
                <Crown className="w-10 h-10" />
              </div>
              <NexusBadge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-2 shimmer-fast uppercase tracking-widest text-[10px]">
                ⭐ NEXUS VIP — Ultra Premium Service
              </NexusBadge>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
              The Ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-rose-400">VIP Experience.</span>
            </h1>

            <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Like YouTube Superchat — but for real-world luxury orders. Skip every queue. Command any service. Delivered globally.
            </p>

            <div className="flex justify-center gap-4">
              <NexusButton className="bg-amber-500 text-black hover:bg-amber-400 px-12 h-16 text-lg font-bold shadow-2xl shadow-amber-500/20">Start VIP Order</NexusButton>
              <NexusButton variant="outline" className="border-amber-500/20 text-amber-500 h-16 px-12 hover:bg-amber-500/5">View Packages</NexusButton>
            </div>
          </motion.div>

          {/* Live Activity Ticker */}
          <div className="max-w-4xl mx-auto border border-amber-500/20 bg-black/40 h-14 rounded-2xl overflow-hidden flex items-center px-8 relative">
            <div className="absolute left-0 top-0 bottom-0 px-6 bg-amber-500 flex items-center justify-center text-black font-bold text-[10px] z-10 uppercase tracking-widest shadow-2xl">
              Live Feed
            </div>
            <div className="flex-1 flex items-center gap-12 animate-ticker whitespace-nowrap pl-32">
              {[...MOCK_VIP_ORDERS, ...MOCK_VIP_ORDERS].map((order, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-amber-500 font-bold">⭐ {order.name}</span>
                  <span className="text-gray-500 text-xs truncate max-w-[200px]">{order.msg}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-bold">{order.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-32 space-y-40">
        
        {/* Tier Cards */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Choose Your VIP Level</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">Each tier unlocks exclusive privileges across the NEXUS ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {VIP_TIERS.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <NexusCard className={`p-0 h-full overflow-hidden border-white/5 bg-white/[0.02] flex flex-col group transition-all duration-500 hover:border-amber-500/30 ${tier.id === 'diamond' ? 'diamond-holographic' : ''}`}>
                  <div className={`p-8 space-y-6 flex-1 ${tier.id === 'gold' ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="text-5xl">{tier.icon}</div>
                      {tier.popular && <NexusBadge className="bg-amber-500 text-black border-none text-[8px] font-bold">POPULAR</NexusBadge>}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{tier.tagline}</p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                      <div className="text-3xl font-bold text-white">{tier.price}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Per VIP Session</div>
                    </div>
                    <ul className="space-y-4 pt-6">
                      {tier.benefits.map(b => (
                        <li key={b} className="flex items-start gap-3 text-xs font-medium text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {b}
                        </li>
                      ))}
                      {tier.locked.map(b => (
                        <li key={b} className="flex items-start gap-3 text-xs font-medium text-gray-600">
                          <Lock className="w-4 h-4 text-gray-800 shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-8 pt-0">
                    <NexusButton className={`w-full h-12 font-bold ${tier.id === 'diamond' ? 'bg-gradient-to-r from-blue-400 via-rose-400 to-amber-400 text-black' : 'bg-amber-500 text-black'} group-hover:scale-[1.02] transition-transform`}>
                      Order {tier.id.toUpperCase()}
                    </NexusButton>
                  </div>
                </NexusCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Superchat Widget */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">⭐ Create Your VIP Order</h2>
            <p className="text-gray-500">Your order gets highlighted and prioritized instantly.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-7">
              <NexusCard className="p-10 border-white/10 bg-white/[0.02] space-y-10">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">1. Select Tier</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setSelectedDept(t.toLowerCase())}
                          className={`p-4 rounded-2xl border transition-all text-center ${selectedTier === t.toLowerCase() ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'}`}
                        >
                          <div className="font-bold text-xs">{t}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">2. Service Type</label>
                    <select className="w-full bg-black/40 border border-white/10 h-14 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-amber-500/50 appearance-none">
                      <option>Priority Food Delivery</option>
                      <option>VIP Fashion Order</option>
                      <option>Flight Class Upgrade</option>
                      <option>VIP Event Access</option>
                      <option>Custom Concierge Request</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">3. Superchat Message</label>
                    <textarea 
                      className="w-full bg-black/40 border border-white/10 h-32 rounded-2xl p-6 text-sm font-medium text-white outline-none focus:border-amber-500/50" 
                      placeholder="Add a priority note for your concierge..."
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">VIP Fee</div>
                    <div className="text-3xl font-bold text-amber-500">{VIP_TIERS.find(t => t.id === selectedTier)?.price}</div>
                  </div>
                  <NexusButton className="w-full sm:w-auto px-12 h-16 bg-amber-500 text-black font-bold text-lg hover:bg-amber-400">Place VIP Order</NexusButton>
                </div>
              </NexusCard>
            </div>

            <div className="lg:col-span-5 h-[600px] flex flex-col space-y-6">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse" /> Live VIP Feed
              </h3>
              <div className="flex-1 overflow-hidden relative rounded-[2.5rem] border border-white/5 bg-black/40">
                <div className="absolute inset-0 overflow-y-auto no-scrollbar p-6 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {liveOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                          order.tier === 'DIAMOND' ? 'bg-rose-500/10 border-rose-500/30' :
                          order.tier === 'PLATINUM' ? 'bg-blue-500/10 border-blue-500/30' :
                          'bg-amber-500/10 border-amber-500/30'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          {order.tier === 'DIAMOND' ? '👑' : order.tier === 'PLATINUM' ? '💎' : '🥇'}
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="font-bold text-xs">{order.name}</div>
                            <div className="text-[10px] font-bold text-amber-500">{order.amount}</div>
                          </div>
                          <p className="text-[11px] font-medium text-gray-300 leading-relaxed italic truncate">"{order.msg}"</p>
                          <div className="text-[8px] font-bold text-gray-500 uppercase">{order.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-10">
            <h2 className="text-3xl font-bold">👑 VIP Hall of Fame</h2>
            <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
              <table className="w-full text-left">
                <thead className="bg-white/[0.01] border-b border-white/5">
                  <tr>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rank</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Member</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Tier</th>
                    <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { rank: '🥇', name: 'Marcus T.', tier: 'DIAMOND', spent: '8.5 ETH', orders: 17, badge: 'Legendary' },
                    { rank: '🥈', name: 'Elena K.', tier: 'DIAMOND', spent: '6.2 ETH', orders: 12, badge: 'Elite' },
                    { rank: '🥉', name: 'Amir H.', tier: 'PLATINUM', spent: '4.8 ETH', orders: 24, badge: 'Premium' },
                  ].map(user => (
                    <tr key={user.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-6 text-xl">{user.rank}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800" />
                          <div className="font-bold text-sm">{user.name}</div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <NexusBadge className={`${user.tier === 'DIAMOND' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'} border-none text-[8px]`}>{user.tier}</NexusBadge>
                      </td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-sm text-amber-500">{user.spent}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold">{user.orders} Orders</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </NexusCard>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 h-fit">
            {[
              { label: 'Total VIP Volume', val: '42.7 ETH', sub: '≈ $123,830', icon: TrendingUp },
              { label: 'VIP Orders Placed', val: '847', sub: '↑ +23% this month', icon: Award },
              { label: 'Avg Concierge Time', val: '4.2 Min', sub: 'Agent assignment', icon: Clock }
            ].map(stat => (
              <NexusCard key={stat.label} className="p-8 border-white/5 bg-white/[0.02] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><stat.icon className="w-5 h-5" /></div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.val}</div>
                  <div className="text-xs font-medium text-amber-500/60">{stat.sub}</div>
                </div>
              </NexusCard>
            ))}
          </div>
        </section>

      </main>

      <Footer />

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
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer-fast {
          position: relative;
          overflow: hidden;
        }
        .shimmer-fast::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: sweep 2s infinite;
        }
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
