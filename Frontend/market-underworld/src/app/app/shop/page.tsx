"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Search, ShoppingCart, Zap, Heart, Plus, ChevronRight } from 'lucide-react'
import { MARKETPLACE_PRODUCTS } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ShopTab() {
  const { toast } = useToast();

  const handleAddToCart = (name: string) => {
    toast({
      title: "Added to Cart",
      description: `${name} has been added to your local node cart.`
    });
  };

  return (
    <div className="pb-32">
      <header className="px-6 pt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white tracking-tight leading-none">Shop</h1>
          <div className="flex gap-2">
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10"><Search className="w-5 h-5 text-gray-400" /></button>
            <Link href="/app/cart" className="relative p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[8px] font-bold flex items-center justify-center rounded-full">3</span>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
          {[
            { n: 'Fashion', icon: '👗' },
            { n: 'Electronics', icon: '💻' },
            { n: 'Food', icon: '🍔' },
            { n: 'Travel', icon: '✈️' },
            { n: 'Events', icon: '🎫' },
          ].map(c => (
            <div key={c.n} className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer">
                {c.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{c.n}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="px-6 mt-12 space-y-12">
        {/* Flash Sale Banner */}
        <div className="relative h-48 rounded-[2.5rem] overflow-hidden group cursor-pointer border border-emerald-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-cyan-600 opacity-20" />
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/shop-banner/800/400')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[10s]" />
          <div className="relative h-full p-8 flex flex-col justify-center space-y-4">
            <NexusBadge variant="live" className="bg-emerald-500 text-black border-none px-4 py-1">FLASH SALE</NexusBadge>
            <h3 className="text-2xl font-bold text-white leading-tight">Up to 60% OFF <br />on Tech & Gear</h3>
            <p className="text-xs font-bold text-emerald-400 flex items-center">Ends in 04:32:17 <ChevronRight className="w-4 h-4 ml-1" /></p>
          </div>
        </div>

        {/* Trending Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400 fill-current" /> Trending Now
            </h3>
            <span className="text-xs font-bold text-gray-500">42 Items</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {MARKETPLACE_PRODUCTS.slice(0, 6).map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group relative h-full flex flex-col">
                  <div className="relative aspect-square bg-gray-900/50 overflow-hidden shrink-0">
                    <img src={p.images?.[0] || 'https://picsum.photos/seed/p/400/400'} className="w-full h-full object-cover opacity-80" alt={p.title} />
                    <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-white leading-tight line-clamp-2">{p.title}</h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{p.category}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-sm font-bold text-white">{p.price} <span className="text-[8px] opacity-40">USDT</span></div>
                      <button 
                        onClick={() => handleAddToCart(p.title)}
                        className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </NexusCard>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
