
"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { MARKETPLACE_PRODUCTS } from "@/lib/mock-marketplace-data"
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  Grid, 
  List, 
  SlidersHorizontal,
  Star,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

const FASHION_PRODUCTS = MARKETPLACE_PRODUCTS.filter(p => p.category === 'Fashion' || p.category === 'Sports' || p.category === 'Beauty');

export default function ClothingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const brands = Array.from(new Set(FASHION_PRODUCTS.map(p => p.brand))).filter(Boolean);
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const filteredProducts = useMemo(() => {
    return FASHION_PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      const matchesPrice = Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1];
      return matchesSearch && matchesBrand && matchesPrice;
    });
  }, [searchQuery, selectedBrands, priceRange]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-purple-500/20">
      <Navbar isMarketplace />

      {/* Fashion Hero */}
      <section className="relative pt-44 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 space-y-8"
            >
              <NexusBadge variant="info" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-5 py-2">
                👗 10,000+ Items • Global Brands
              </NexusBadge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                Wear the Future. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Pay in Crypto.</span>
              </h1>
              <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
                Premium streetwear, luxury fashion and everyday essentials — curated globally. Delivered to your door.
              </p>
              <div className="flex gap-4">
                <NexusButton className="bg-purple-600 hover:bg-purple-500 px-10 h-14 font-bold shadow-2xl shadow-purple-500/20">Shop New Arrivals</NexusButton>
                <NexusButton variant="outline" className="border-white/10 h-14 px-10">Browse Brands</NexusButton>
              </div>
            </motion.div>

            <div className="hidden lg:flex flex-1 gap-6 items-center justify-center h-[400px]">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                  className="w-48 h-64 rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02] relative group cursor-pointer"
                >
                  <Image src={`https://picsum.photos/seed/fashion-${i}/300/400`} fill sizes="192px" className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="product" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-[10px] font-bold text-white mb-1">NEXUS Originals</div>
                    <div className="text-sm font-bold text-white">45 USDT</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filter Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-10">
            <div className="sticky top-32 space-y-10">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center justify-between">
                  <span>🏷️ Brands</span>
                  <button onClick={() => setSelectedBrands([])} className="text-purple-400 hover:underline capitalize">Clear</button>
                </h3>
                <div className="space-y-3">
                  {brands.slice(0, 6).map(brand => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                      <div 
                        onClick={() => toggleBrand(brand)}
                        className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${selectedBrands.includes(brand) ? 'bg-purple-600 border-purple-600' : 'border-white/10 group-hover:border-purple-500/50'}`}
                      >
                        {selectedBrands.includes(brand) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedBrands.includes(brand) ? 'text-white' : 'text-gray-500'}`}>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6">💰 Price Range</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>0 USDT</span>
                    <span>500 USDT</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="500" 
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-purple-600"
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  />
                  <div className="text-sm font-bold text-purple-400">Up to {priceRange[1]} USDT</div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6">📏 Sizes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      className="h-10 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-bold hover:border-purple-500/50 transition-all active:bg-purple-600"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Showing {filteredProducts.length} Products</h2>
              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
                </div>
                <NexusButton variant="outline" size="sm" className="h-10 border-white/5 text-gray-500">
                  <SlidersHorizontal className="w-4 h-4 mr-2" /> Sort: Featured
                </NexusButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: (idx % 6) * 0.05 }}
                  >
                    <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-purple-500/30 transition-all duration-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-900/50">
                        <Image src={product.image_url} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-0 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute top-4 right-4">
                          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                        {/* Quick View Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                          <NexusButton className="w-full bg-white text-black hover:bg-gray-100 h-12 font-bold rounded-xl mb-3">Quick Add</NexusButton>
                          <div className="flex justify-center gap-2">
                            {['S', 'M', 'L'].map(s => <span key={s} className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">{s}</span>)}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div>
                          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">{product.brand}</div>
                          <h4 className="font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">{product.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-bold text-gray-400">{product.rating}</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                          <div>
                            <div className="text-xl font-bold text-white">{product.price} USDT</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">≈ {product.crypto_price} ETH</div>
                          </div>
                          <Link href={`/marketplace/clothing/product/${product.id}`}>
                            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-purple-600 transition-all">
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </NexusCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
