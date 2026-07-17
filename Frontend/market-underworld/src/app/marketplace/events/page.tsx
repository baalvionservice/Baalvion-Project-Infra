
"use client"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { UPCOMING_EVENTS } from "@/lib/mock-marketplace-data"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Ticket, 
  Calendar as CalendarIcon, 
  MapPin, 
  Search, 
  Music, 
  Laptop, 
  GraduationCap, 
  Trophy, 
  ArrowRight,
  Zap,
  Users
} from "lucide-react"
import { motion } from "framer-motion"

export default function EventsPage() {
  const [activeFilter, setActiveTab] = useState('All');

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-pink-500/20">
      <Navbar isMarketplace />

      {/* Events Hero */}
      <section className="relative pt-44 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
          <div className="space-y-6 max-w-4xl mx-auto">
            <NexusBadge variant="live" className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-5 py-2">
              🎟️ Concerts • Conferences • Workshops
            </NexusBadge>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.05]">
              Discover Events. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Pay in Crypto.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Crypto tickets confirmed in seconds. Conferences, music festivals, and global workshops — all on the NEXUS chain.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl focus-within:border-pink-500/50 transition-all">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" placeholder="Search events, artists, venues..." className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-white placeholder:text-gray-600 font-medium" />
              </div>
              <NexusButton className="bg-pink-600 hover:bg-pink-500 px-8 h-12 shadow-lg shadow-pink-500/20">Find Events</NexusButton>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Event Card */}
      <section className="container mx-auto px-6 py-10">
        <NexusCard className="p-0 overflow-hidden border-pink-500/20 bg-gradient-to-br from-[#111118] to-[#0A0A0F] relative group">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 h-[400px] lg:h-auto relative shrink-0">
              <Image src="https://picsum.photos/seed/event-hero/800/600" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="Hero" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] to-transparent hidden lg:block" />
              <div className="absolute top-8 left-8">
                <NexusBadge className="bg-pink-600 text-white px-4 py-1 font-bold">FEATURED EVENT</NexusBadge>
              </div>
            </div>
            <div className="flex-1 p-12 lg:p-20 space-y-10 relative z-10">
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Global Strategy</div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Crypto Summit 2026</h2>
                <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                  The world's largest crypto and blockchain conference returns to Dubai. Keynotes from leading NEXUS teachers and industry pioneers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <CalendarIcon className="w-5 h-5 text-pink-500" /> March 20, 2026
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <MapPin className="w-5 h-5 text-pink-500" /> Dubai World Trade Centre
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <Users className="w-5 h-5 text-pink-500" /> 2,000+ Attending
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-pink-400">
                  <Zap className="w-5 h-5" /> Only 142 tickets left!
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Starting from</div>
                  <div className="text-3xl font-bold">40 USDT</div>
                </div>
                <NexusButton className="w-full sm:w-auto h-16 px-12 bg-pink-600 hover:bg-pink-500 text-lg font-bold shadow-xl shadow-pink-500/20">Get Tickets Now <ArrowRight className="ml-2 w-5 h-5" /></NexusButton>
              </div>
            </div>
          </div>
        </NexusCard>
      </section>

      {/* Events Grid */}
      <main className="container mx-auto px-6 py-32 space-y-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-4">Upcoming Global Events</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['All', 'Concerts', 'Tech & Crypto', 'Workshops', 'Festivals'].map(t => (
                <button key={t} className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:border-pink-500/30 transition-all whitespace-nowrap">{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {UPCOMING_EVENTS.map((evt, idx) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-pink-500/30 transition-all duration-500 flex flex-col h-full">
                <div className="relative aspect-video overflow-hidden bg-gray-900">
                  <Image src={`https://picsum.photos/seed/evt-${idx}/600/400`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" alt={evt.name} />
                  <div className="absolute top-4 left-4">
                    <NexusBadge className="bg-black/60 backdrop-blur-md border-pink-500/20 text-pink-400 text-[9px]">{evt.type.toUpperCase()}</NexusBadge>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white text-black font-bold text-[10px] px-3 py-1 rounded-lg">
                    {evt.date.split(' • ')[0]}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold leading-tight group-hover:text-pink-400 transition-colors">{evt.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                        <MapPin className="w-4 h-4 text-pink-500" /> {evt.location}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                        <Users className="w-4 h-4 text-pink-500" /> {evt.remaining}+ attending
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-white/5 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tickets from</div>
                      <div className="text-2xl font-bold">{evt.generalPrice} USDT</div>
                    </div>
                    <NexusButton size="sm" className="bg-white text-black hover:bg-gray-100 font-bold px-6">Get Ticket</NexusButton>
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
