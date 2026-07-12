"use client"

import { useState, useEffect, useMemo } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Search, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  Star, 
  ChevronRight,
  Filter,
  Grid,
  List,
  Heart,
  Plus,
  Minus,
  Clock,
  Smartphone,
  Book,
  Home,
  Trophy,
  Gamepad2,
  Headphones
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { MARKETPLACE_PRODUCTS } from "@/lib/mock-marketplace-data"

const DEPARTMENTS = [
  { name: 'Electronics', count: '8,420', icon: Smartphone, color: 'from-blue-500/20 to-blue-600/20' },
  { name: 'Books', count: '12,340', icon: Book, color: 'from-purple-500/20 to-purple-600/20' },
  { name: 'Home & Kitchen', count: '6,780', icon: Home, color: 'from-orange-500/20 to-orange-600/20' },
  { name: 'Sports & Fitness', count: '4,230', icon: Trophy, color: 'from-green-500/20 to-green-600/20' },
  { name: 'Beauty & Health', count: '5,670', icon: Heart, color: 'from-pink-500/20 to-pink-600/20' },
  { name: 'Gaming', count: '3,450', icon: Gamepad2, color: 'from-cyan-500/20 to-cyan-600/20' },
];

export default function CommoditiesPage() {
  const [timeLeft, setTimeLeft] = useState("08:24:33")
  const [selectedDept, setSelectedDept] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const mins = 59 - now.getMinutes();
      const secs = 59 - now.getSeconds();
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    return MARKETPLACE_PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "All" || p.category === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDept]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] selection:bg-[#00E676]/20">
      <Navbar isMarketplace />

      {/* Hero Section */}
      <section className="relative pt-44 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#00E676]/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-8"
          >
            <NexusBadge variant="success" className="bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 px-5 py-2">
              📦 50,000+ Products • Global Sellers
            </NexusBadge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Everything You Need. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-[#00BCD4]">Crypto Prices.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
              Electronics, books, home goods and more — delivered globally. Pay with BTC, ETH or USDT instantly.
            </p>
            <div className="flex gap-4">
              <NexusButton className="bg-[#00E676] text-black hover:bg-[#00ff84] px-10 h-14 font-bold shadow-2xl shadow-[#00E676]/20">Shop Now</NexusButton>
              <NexusButton variant="outline" className="border-white/10 h-14 px-10 text-white hover:bg-white/5">View Deals</NexusButton>
            </div>
          </motion.div>

          <div className="hidden lg:flex flex-1 gap-6 items-center justify-center relative h-[400px]">
            {[
              { name: 'iPhone 16 Pro', price: '1,200', id: 'p1' },
              { name: 'MacBook Air M4', price: '1,500', id: 'p2' },
              { name: 'AirPods Pro 3', price: '180', id: 'p3' }
            ].map((prod, i) => (
              <motion.div
                key={prod.id}
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                className="w-48 h-64 rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02] relative group cursor-pointer shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] font-bold text-[#00E676] mb-1">NEXUS PICK</div>
                  <div className="text-sm font-bold text-white mb-1 truncate">{prod.name}</div>
                  <div className="text-xs font-bold text-gray-400">{prod.price} USDT</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="border-y border-white/5 bg-black/40 py-8 relative z-10">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Zap, label: "Free Delivery", sub: "Above 20 USDT" },
            { icon: ShieldCheck, label: "Buyer Protection", sub: "100% Guaranteed" },
            { icon: RotateCcw, label: "Easy Returns", sub: "Within 7 days" },
            { icon: CheckCircle2, label: "Instant Crypto", sub: "Blockchain Verified" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00E676] group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-6 py-20 space-y-32">
        
        {/* Department Nav */}
        <section>
          <h2 className="text-2xl font-bold mb-10">🏪 Shop by Department</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {DEPARTMENTS.map((dept, i) => (
              <motion.div
                key={dept.name}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[#00E676]/30 transition-all cursor-pointer text-center space-y-4"
                onClick={() => setSelectedDept(dept.name)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                  <dept.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{dept.name}</h4>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">{dept.count} items</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Today's Deals */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-4">
                <Zap className="w-8 h-8 text-[#00E676] fill-[#00E676]" /> Today's Best Deals
              </h2>
              <p className="text-gray-500">Limited time offers from top verified sellers.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Resets In</span>
              <span className="font-mono text-2xl font-bold text-white">{timeLeft}</span>
            </div>
          </div>

          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-10 -mx-6 px-6">
            {MARKETPLACE_PRODUCTS.filter(p => p.discount).slice(0, 8).map((deal, i) => (
              <motion.div key={deal.id} className="min-w-[280px] max-w-[280px]">
                <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group relative">
                  <div className="absolute top-4 left-4 z-10">
                    <NexusBadge variant="success" className="bg-[#00E676] text-black border-none text-[9px]">{deal.discount}</NexusBadge>
                  </div>
                  <div className="aspect-square bg-gray-900/50 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <ShoppingBag className="w-20 h-20" />
                    </div>
                    <Image src={deal.image_url} fill sizes="280px" className="object-cover transition-transform duration-1000 group-hover:scale-110" alt={deal.name} />
                  </div>
                  <div className="p-6 space-y-4">
                    <h4 className="font-bold text-sm line-clamp-2 h-10">{deal.name}</h4>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[#00E676]">{deal.price} USDT</span>
                        <span className="text-xs text-gray-500 line-through">{deal.originalPrice}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase">≈ {deal.crypto_price} ETH</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold uppercase">
                        <span className="text-[#00E676]">🔥 Popular Choice</span>
                        <span className="text-gray-500">67% claimed</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: '67%' }} className="h-full bg-red-500" />
                      </div>
                    </div>
                    <NexusButton className="w-full bg-[#00E676] text-black hover:bg-[#00ff84] h-10 text-xs font-bold">Add to Cart</NexusButton>
                  </div>
                </NexusCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Main Feed */}
        <section className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-10">
            <div className="sticky top-32 space-y-10">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center justify-between">
                  <span>📂 Refine Results</span>
                  <button className="text-[#00E676] hover:underline capitalize">Clear</button>
                </h3>
                <div className="space-y-4">
                  {DEPARTMENTS.map(dept => (
                    <label key={dept.name} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border border-white/10 transition-all flex items-center justify-center ${selectedDept === dept.name ? 'bg-[#00E676] border-[#00E676]' : 'group-hover:border-[#00E676]/50'}`}>
                        {selectedDept === dept.name && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedDept === dept.name ? 'text-white' : 'text-gray-500'}`}>{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6">💰 Price Range</h3>
                <div className="space-y-4">
                  <input type="range" min="0" max="2000" className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-[#00E676]" />
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                    <span>0 USDT</span>
                    <span>2000 USDT</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6">⭐ Seller Type</h3>
                <div className="space-y-3">
                  {['NEXUS Official', 'Verified Sellers', 'Local Pickup'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-5 h-5 rounded border border-white/10 group-hover:border-[#00E676]/50 transition-all" />
                      <span className="text-sm font-medium text-gray-500 group-hover:text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Showing {filteredProducts.length} Results</h2>
              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
                </div>
                <NexusButton variant="outline" size="sm" className="h-10 border-white/10 text-gray-500 font-bold px-6 hover:text-white">
                  Sort: Best Match
                </NexusButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.slice(0, 24).map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: (idx % 8) * 0.05 }}
                  >
                    <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-[#00E676]/30 transition-all duration-500 h-full flex flex-col">
                      <div className="relative aspect-square bg-gray-900/50 overflow-hidden shrink-0">
                        <Image src={product.image_url} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-1000 group-hover:scale-110" alt={product.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00E676] transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute top-3 left-3">
                          <NexusBadge className="bg-[#00E676]/10 text-[#00E676] border-none text-[8px]">{product.category.toUpperCase()}</NexusBadge>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.brand}</div>
                          <h4 className="font-bold text-white text-sm line-clamp-2 h-10 leading-tight group-hover:text-[#00E676] transition-colors">{product.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />)}
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">(234)</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-4">
                          <div>
                            <div className="text-lg font-bold text-white">{product.price} USDT</div>
                            <div className="text-[9px] text-gray-500 font-bold">≈ {product.crypto_price} ETH</div>
                          </div>
                          <NexusButton className="w-full bg-white/5 border border-white/10 text-white hover:bg-[#00E676] hover:text-black hover:border-[#00E676] h-10 text-[10px] font-bold">
                            Add to Cart
                          </NexusButton>
                        </div>
                      </div>
                    </NexusCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-20 text-center">
              <NexusButton variant="outline" className="px-12 h-14 border-white/10 text-gray-500 font-bold hover:text-white">
                Load More Products <ChevronRight className="ml-2 w-4 h-4" />
              </NexusButton>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
