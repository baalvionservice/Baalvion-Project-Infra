"use client"

import { motion } from "framer-motion"
import { NexusCard } from "@/components/ui/nexus-card"
import { Quote, Star } from "lucide-react"

const TESTIMONIALS = [
  {
    text: "My private teacher from Tokyo helped me master calculus in 3 weeks. Paying in USDT was seamless and instant. High precision learning.",
    author: "Aryan M.",
    region: "South Asia 🇮🇳",
  },
  {
    text: "NEXUS is unlike anything else. I found a teacher from my exact timezone and language. Worth every satoshi. Truly globalized education.",
    author: "Elena K.",
    region: "Europe 🇩🇪",
  },
  {
    text: "Bought clothes, booked a flight, AND hired a private coding tutor — all on one platform. Mind blown at the convenience and elite feel.",
    author: "Marcus T.",
    region: "North America 🇺🇸",
  },
]

export const Testimonials = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold">What Our Students Say</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <NexusCard className="h-full p-12 glass-card relative border-white/10 hover:border-blue-500/20 transition-all">
                <Quote className="w-12 h-12 text-blue-500 opacity-20 absolute top-10 right-10" />
                
                <div className="flex gap-1 mb-8">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>

                <p className="text-gray-300 text-lg font-medium leading-relaxed mb-12 italic">
                  "{t.text}"
                </p>

                <div className="pt-8 border-t border-white/5">
                  <div className="font-bold text-lg mb-1">{t.author}</div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t.region}</div>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
