"use client"

import { motion } from "framer-motion"
import { NexusButton } from "@/components/ui/nexus-button"
import { NexusBadge } from "@/components/ui/nexus-card"
import { Shield, Zap, Globe, Star, Wallet, TrendingUp } from "lucide-react"
import Link from "next/link"

const CRYPTO_LOGOS = [
  { name: "BTC", icon: "₿" },
  { name: "ETH", icon: "Ξ" },
  { name: "USDT", icon: "₮" },
  { name: "BNB", icon: "BNB" },
  { name: "SOL", icon: "SOL" },
  { name: "MATIC", icon: "M" },
  { name: "LTC", icon: "Ł" },
]

export const Hero = () => {
  return (
    <section className="relative min-h-[95vh] flex flex-col justify-center pt-32 pb-20 overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-[120px]" />
        {/* Floating Orbs */}
        <motion.div 
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-[15%] w-72 h-72 bg-blue-200/20 rounded-full blur-[80px]" 
        />
        <motion.div 
          animate={{ y: [0, 40, 0], opacity: [0.05, 0.15, 0.05] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-[10%] w-96 h-96 bg-indigo-200/20 rounded-full blur-[100px]" 
        />
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-10"
        >
          <NexusBadge variant="info" className="w-fit bg-blue-50 text-blue-600 px-5 py-2">
            🌍 7 Regions • 343 Teachers • 3,430 Students
          </NexusBadge>

          <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight text-gray-900">
            Learn from the <br />
            <span className="nexus-gradient-text">World's Best.</span><br />
            Pay in Crypto.
          </h1>

          <p className="text-gray-500 text-xl md:text-2xl max-w-xl leading-relaxed font-medium">
            Join NEXUS — the elite platform connecting top private teachers with global students. Shop, Learn, Connect.
          </p>

          <div className="flex flex-wrap gap-5">
            <Link href="/education">
              <NexusButton size="lg" className="px-12 nexus-gradient-bg shadow-xl shadow-blue-500/20">
                Find a Teacher
              </NexusButton>
            </Link>
            <Link href="/marketplace">
              <NexusButton size="lg" variant="outline" className="px-12 bg-white">
                Explore Marketplace
              </NexusButton>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-10 pt-6">
            {[
              { icon: Shield, text: "Crypto Secured" },
              { icon: Zap, text: "Instant Access" },
              { icon: Globe, text: "Global Coverage" },
              { icon: Star, text: "Elite Experts" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                <item.icon className="w-4 h-4 text-blue-500" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Content - Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative flex justify-center items-center"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-[520px] bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src="https://picsum.photos/seed/yuki/200/200" className="w-full h-full object-cover" alt="Yuki" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Yuki Tanaka</h3>
                  <NexusBadge variant="live" className="text-[10px] py-1">Online Now</NexusBadge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Session Starts</div>
                <div className="font-mono text-2xl font-bold text-blue-600">00:14:32</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-10">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Balance</span>
                </div>
                <div className="text-xl font-bold text-gray-900">0.42 ETH</div>
                <div className="text-[11px] text-gray-400 font-semibold">$1,240.00 USD</div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Growth</span>
                </div>
                <div className="text-xl font-bold text-gray-900">+12.4%</div>
                <div className="text-[11px] text-emerald-500 font-bold">Stable Trend</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-50">
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white overflow-hidden shadow-sm">
                    <img src={`https://picsum.photos/seed/stud-${i}/100/100`} alt="student" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  +127
                </div>
              </div>
              <NexusButton size="md" className="nexus-gradient-bg">Join Session</NexusButton>
            </div>
          </motion.div>

          {/* Floating Notifications */}
          {[
            { text: "✅ Payment received 0.05 BTC", delay: 2, top: "5%", left: "-10%" },
            { text: "🎓 New student enrolled — Tokyo", delay: 3, bottom: "15%", right: "-12%" },
          ].map((note, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: note.delay, duration: 0.5 }}
              className="absolute whitespace-nowrap px-6 py-3 bg-white border border-gray-100 rounded-full text-[13px] font-bold shadow-xl pointer-events-none text-gray-900"
              style={{ top: note.top, left: note.left, bottom: note.bottom, right: note.right }}
            >
              {note.text}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Logo Ticker */}
      <div className="mt-32 border-y border-gray-100 bg-white py-10 overflow-hidden relative">
        <div className="flex animate-ticker whitespace-nowrap items-center">
          {[...CRYPTO_LOGOS, ...CRYPTO_LOGOS, ...CRYPTO_LOGOS].map((crypto, i) => (
            <div key={i} className="flex items-center gap-5 mx-16 text-gray-300 hover:text-gray-900 transition-colors cursor-default">
              <span className="text-3xl font-bold opacity-50">{crypto.icon}</span>
              <span className="text-[13px] font-bold tracking-widest uppercase">{crypto.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
