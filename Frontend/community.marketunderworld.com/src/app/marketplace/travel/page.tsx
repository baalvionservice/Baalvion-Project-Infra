
"use client"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { POPULAR_ROUTES } from "@/lib/mock-marketplace-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Plane, 
  Hotel, 
  Map as MapIcon, 
  Bus, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  ArrowRight, 
  TrendingUp,
  ShieldCheck,
  Globe
} from "lucide-react"
import { motion } from "framer-motion"

export default function TravelPage() {
  const [activeTab, setActiveTab] = useState('flights');

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-cyan-500/20">
      <Navbar isMarketplace />

      {/* Travel Hero */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 space-y-16">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
              Explore the World. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pay in Crypto.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
              Book flights, hotels and experiences globally. Instant crypto confirmation. Decentralized travel.
            </p>
          </div>

          {/* Search Widget */}
          <NexusCard className="p-8 border-white/10 bg-[#111118]/60 backdrop-blur-3xl shadow-3xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
            <div className="flex gap-8 mb-10 border-b border-white/5">
              {[
                { id: 'flights', icon: Plane, label: 'Flights' },
                { id: 'hotels', icon: Hotel, label: 'Hotels' },
                { id: 'trips', icon: MapIcon, label: 'Trips' },
                { id: 'bus', icon: Bus, label: 'Bus' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 pb-6 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="activeTabTravel" className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">From</label>
                <div className="bg-white/5 border border-white/10 h-14 rounded-2xl flex items-center px-4 gap-3 focus-within:border-cyan-500/50 transition-all">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <input className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full" defaultValue="Mumbai (BOM)" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">To</label>
                <div className="bg-white/5 border border-white/10 h-14 rounded-2xl flex items-center px-4 gap-3 focus-within:border-cyan-500/50 transition-all">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <input className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full" defaultValue="Dubai (DXB)" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Departure</label>
                <div className="bg-white/5 border border-white/10 h-14 rounded-2xl flex items-center px-4 gap-3 focus-within:border-cyan-500/50 transition-all">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <input className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full" defaultValue="Mar 15, 2026" />
                </div>
              </div>
              <div className="flex items-end">
                <NexusButton className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 shadow-xl shadow-cyan-500/20 font-bold text-lg">Search Flights</NexusButton>
              </div>
            </div>
          </NexusCard>
        </div>
      </section>

      <main className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-4 flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-cyan-400" /> Popular Routes
            </h2>
            <p className="text-gray-500">Top destinations booked via crypto this week.</p>
          </div>
          <button className="text-cyan-400 font-bold hover:underline flex items-center gap-2">View All Destinations <ArrowRight className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {POPULAR_ROUTES.map((route, idx) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-cyan-500/30 transition-all duration-500 cursor-pointer">
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  <Image src={`https://picsum.photos/seed/travel-${idx}/400/300`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" alt={route.to} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
                  <div className="absolute top-4 right-4">
                    <NexusBadge variant="info" className="bg-cyan-500 text-black px-3 py-1">SALE</NexusBadge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="text-sm font-bold text-white uppercase tracking-widest">{route.airline}</div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{route.from} → {route.to}</h3>
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-3">
                      <span>{route.date}</span>
                      <span className="w-1 h-1 bg-gray-700 rounded-full" />
                      <span>{route.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-6 border-t border-white/5">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">From</div>
                      <div className="text-2xl font-bold">{route.price} USDT</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">≈ {route.crypto} ETH</div>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-600 transition-all">
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>

        {/* Global Experiences Banner */}
        <section className="mt-40 h-[400px] rounded-[3rem] overflow-hidden relative border border-white/5 group">
          <Image src="https://picsum.photos/seed/travel-banner/1200/400" fill sizes="100vw" className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-10000" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#0A0A0F]/80 to-transparent" />
          <div className="absolute inset-0 flex items-center p-16 lg:p-24">
            <div className="max-w-xl space-y-8">
              <NexusBadge variant="info" className="bg-cyan-500/10 text-cyan-400 border-none px-4 py-1">NEW EXPERIENCE</NexusBadge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Private Island Retreat <br />in the Maldives</h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed">
                Pay with ETH or BTC. Instant flight + resort confirmation. Your private oasis awaits in the North Malé Atoll.
              </p>
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Escrow Protected</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Payouts</span>
                </div>
              </div>
              <NexusButton className="bg-white text-black hover:bg-gray-100 px-12 h-16 text-lg font-bold">Book Retreat Now</NexusButton>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
