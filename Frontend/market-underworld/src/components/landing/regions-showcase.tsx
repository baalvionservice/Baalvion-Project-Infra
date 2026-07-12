"use client"

import { motion } from "framer-motion"
import { NexusCard } from "@/components/ui/nexus-card"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

const REGIONS_DATA = [
  { id: 'eap', name: "East Asia & Pacific", desc: "4 Countries • 82 Teachers • 942 Students", color: "from-[#00D4FF] to-[#0066FF]", icon: "🌏" },
  { id: 'eca', name: "Europe & Central Asia", desc: "12 Countries • 104 Teachers • 1,120 Students", color: "from-[#6C63FF] to-[#9C44FF]", icon: "🌍" },
  { id: 'lac', name: "Latin America", desc: "6 Countries • 45 Teachers • 320 Students", color: "from-[#FF6584] to-[#FF3D57]", icon: "🌎" },
  { id: 'men', name: "Middle East & N. Africa", desc: "4 Countries • 32 Teachers • 240 Students", color: "from-[#FFD600] to-[#FF9500]", icon: "🕌" },
  { id: 'nam', name: "North America", desc: "2 Countries • 58 Teachers • 680 Students", color: "from-[#00E676] to-[#00BCD4]", icon: "🗽" },
  { id: 'sas', name: "South Asia", desc: "3 Countries • 22 Teachers • 128 Students", color: "from-[#FF9500] to-[#FF6584]", icon: "🌿" },
  { id: 'ssa', name: "Sub-Saharan Africa", desc: "5 Countries • 12 Teachers • 96 Students", color: "from-[#A855F7] to-[#EC4899]", icon: "🌍" },
]

export const RegionsShowcase = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">One Platform. Seven Regions.</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Find private teachers from your region, in your timezone, in your language.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REGIONS_DATA.map((region, idx) => (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`${idx >= 4 ? 'lg:col-span-1' : ''}`}
            >
              <Link href={`/education?region=${region.id}`}>
                <NexusCard className="group h-full relative overflow-hidden hover:scale-[1.02] transition-all duration-500 border-white/10 bg-white/[0.02]">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${region.color} opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rounded-full -mr-16 -mt-16`} />
                  
                  <div className="text-4xl mb-6">{region.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{region.name}</h3>
                  <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed">
                    {region.desc}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border border-background overflow-hidden">
                          <img src={`https://picsum.photos/seed/reg-${region.id}-${i}/50/50`} alt="t" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] font-bold text-blue-500 group-hover:translate-x-1 transition-transform flex items-center">
                      Explore Region <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </NexusCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
