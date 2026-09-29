"use client"

import { motion } from "framer-motion"
import { NexusCard } from "@/components/ui/nexus-card"
import { ShoppingBag, Utensils, Plane, Ticket, Laptop, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { title: "Fashion & Clothing", desc: "10,000+ items from global brands", icon: ShoppingBag, color: "from-purple-500/20 to-pink-500/20", count: "10k+" },
  { title: "Food Delivery", desc: "Order from 500+ restaurants", icon: Utensils, color: "from-orange-500/20 to-red-500/20", count: "500+" },
  { title: "Travel & Tickets", desc: "Flights, hotels, experiences", icon: Plane, color: "from-blue-500/20 to-cyan-500/20", count: "Active" },
  { title: "Event Booking", desc: "Concerts, workshops, meetups", icon: Ticket, color: "from-pink-500/20 to-purple-500/20", count: "New" },
  { title: "Commodities", desc: "Electronics, books, daily goods", icon: Laptop, color: "from-emerald-500/20 to-teal-500/20", count: "2k+" },
  { title: "VIP Orders", desc: "Priority service, exclusive access", icon: Star, color: "from-amber-500/20 to-yellow-500/20", count: "Premium" },
]

export const MarketplacePreview = () => {
  return (
    <section className="py-32 bg-black/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything You Need.</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Beyond education — shop, travel, eat, and attend events globally. One platform, total access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href="/marketplace">
                <NexusCard className="group h-full p-10 bg-white/[0.02] border-white/5 hover:bg-white/[0.05] transition-all duration-500">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">{cat.title}</h3>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{cat.count}</span>
                  </div>
                  
                  <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                    {cat.desc}
                  </p>

                  <div className="flex items-center text-sm font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
                    Explore Marketplace <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
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
