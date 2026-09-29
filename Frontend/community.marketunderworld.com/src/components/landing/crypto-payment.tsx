"use client"

import { motion } from "framer-motion"
import { Shield, Zap, CheckCircle2 } from "lucide-react"

export const CryptoPayment = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 nexus-gradient-bg opacity-10" />
      
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="flex flex-col gap-8">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">Pay Globally<br />with Crypto</h2>
          <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-lg">
            All transactions on NEXUS are powered by cryptocurrency. Fast, borderless, and completely secure for both teachers and students.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Escrow Security</h4>
                <p className="text-sm text-gray-500">Funds are held safely until the session is completed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Zero Fees</h4>
                <p className="text-sm text-gray-500">No traditional banking fees or currency conversion loss.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            {["BTC", "ETH", "USDT", "BNB", "SOL", "MATIC"].map(coin => (
              <span key={coin} className="text-xl font-bold tracking-tighter">{coin}</span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-4 nexus-gradient-bg opacity-20 blur-2xl rounded-[2.5rem]" />
          <div className="glass-card p-10 relative overflow-hidden border-white/20">
            <div className="flex items-center justify-between mb-10">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Transaction Process</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-8">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Amount Paid</div>
                <div className="text-3xl font-bold">0.025 ETH <span className="text-lg text-gray-500 ml-2">($74.50)</span></div>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <img src="https://picsum.photos/seed/yuki/100/100" className="w-full h-full object-cover rounded-full" alt="Yuki" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Recipient</div>
                  <div className="font-bold">Teacher: Yuki Tanaka 🇯🇵</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-400 font-bold">✅ Confirmed</span>
                  <span className="text-[10px] text-gray-500">2.3 seconds</span>
                </div>
                <div className="font-mono text-[11px] text-gray-500 bg-black/40 p-3 rounded-lg border border-white/5 break-all">
                  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
