
"use client"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { RESTAURANTS } from "@/lib/mock-marketplace-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Search, 
  MapPin, 
  Clock, 
  Navigation, 
  Star, 
  Bike, 
  ShieldCheck,
  ChevronRight,
  UtensilsCrossed
} from "lucide-react"
import { motion } from "framer-motion"

const CUISINES = [
  { name: 'Burgers', icon: '🍔' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Sushi', icon: '🍣' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Mexican', icon: '🌮' },
  { name: 'Indian', icon: '🍛' },
  { name: 'Chinese', icon: '🍜' },
  { name: 'Italian', icon: '🍝' },
  { name: 'Japanese', icon: '🍱' },
  { name: 'Desserts', icon: '🧁' },
];

export default function FoodPage() {
  const [activeCuisine, setActiveCuisine] = useState('All');

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-orange-500/20">
      <Navbar isMarketplace />

      {/* Food Hero */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Hungry? Order Now. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Pay in Crypto.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-xl mx-auto leading-relaxed">
              500+ restaurants delivering to your area. Fast, fresh, and blockchain-verified checkout.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl focus-within:border-orange-500/50 transition-all">
              <div className="flex-1 flex items-center pl-4 gap-3 text-gray-400 border-r border-white/5">
                <MapPin className="w-5 h-5 text-orange-500" />
                <input className="bg-transparent border-none focus:ring-0 text-sm font-medium text-white placeholder:text-gray-600 w-full" placeholder="Enter delivery address..." defaultValue="Mumbai, India" />
              </div>
              <NexusButton className="bg-orange-600 hover:bg-orange-500 px-8 h-12 shadow-lg shadow-orange-500/20">Find Food</NexusButton>
            </div>
            <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Navigation className="w-3.5 h-3.5" /> Using Current Location</span>
              <span className="flex items-center gap-2">🟢 Delivering to your area</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisine Filter */}
      <div className="border-y border-white/5 bg-black/40 py-8 sticky top-20 z-40 backdrop-blur-xl">
        <div className="container mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveCuisine('All')}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all border ${activeCuisine === 'All' ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
            >
              All
            </button>
            {CUISINES.map(c => (
              <button 
                key={c.name}
                onClick={() => setActiveCuisine(c.name)}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all border whitespace-nowrap flex items-center gap-3 ${activeCuisine === c.name ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
              >
                <span>{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-2">🔥 Popular Near You</h2>
            <p className="text-gray-500">Highest rated and fastest delivery available.</p>
          </div>
          <div className="flex gap-2">
            {['Rating', 'Delivery Time', 'Offers'].map(t => (
              <button key={t} className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all">{t}</button>
            ))}
          </div>
        </div>

        <div className="space-y-8 max-w-5xl">
          {RESTAURANTS.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: (idx % 4) * 0.1 }}
              viewport={{ once: true }}
            >
              <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-orange-500/30 transition-all duration-500">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-72 h-48 md:h-auto relative overflow-hidden shrink-0">
                    <Image src={res.banner} fill sizes="(max-width: 768px) 100vw, 288px" className="object-cover group-hover:scale-105 transition-transform duration-1000" alt={res.name} />
                    <div className="absolute top-4 left-4 bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-xl">
                      {res.offer || "ORDER NOW"}
                    </div>
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="flex-1 p-8 flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-xl">
                          {res.logo}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold group-hover:text-orange-400 transition-colors">{res.name}</h3>
                          <div className="text-sm font-medium text-gray-500">{res.cuisine.join(' • ')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 py-4 border-y border-white/5">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Star className="w-4 h-4 text-orange-500 fill-orange-500" /> {res.rating}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                          <Clock className="w-4 h-4" /> {res.deliveryTime}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                          <Bike className="w-4 h-4" /> Free Delivery
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <NexusBadge variant="success" className="bg-emerald-500/10 text-emerald-400 border-none text-[9px]">BESTSELLER</NexusBadge>
                        <NexusBadge variant="info" className="bg-blue-500/10 text-blue-400 border-none text-[9px]">TRUSTED SELLER</NexusBadge>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Minimum Order</div>
                        <div className="text-lg font-bold">{res.minOrder}</div>
                      </div>
                      <NexusButton className="bg-orange-600 hover:bg-orange-500 px-10 h-12 font-bold w-full md:w-auto">Order Menu <ChevronRight className="ml-2 w-4 h-4" /></NexusButton>
                    </div>
                  </div>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
