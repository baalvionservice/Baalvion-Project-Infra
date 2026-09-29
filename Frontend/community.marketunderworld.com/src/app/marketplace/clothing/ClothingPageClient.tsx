"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import type { StorefrontProduct } from "@/lib/api/commerce"
import {
  Heart,
  Grid,
  List,
  SlidersHorizontal,
  Star,
  ArrowRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface ClothingPageClientProps {
  products: StorefrontProduct[];
}

export function ClothingPageClient({ products }: ClothingPageClientProps) {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
  }, [products, priceRange]);

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
                👗 Global Brands • Real Inventory
              </NexusBadge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                Wear the Future. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Pay in Crypto.</span>
              </h1>
              <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
                Premium streetwear, luxury fashion and everyday essentials — curated globally. Delivered to your door.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filter Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-10">
            <div className="sticky top-32 space-y-10">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-6">💰 Price Range</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>0 USD</span>
                    <span>500 USD</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="500"
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-purple-600"
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  />
                  <div className="text-sm font-bold text-purple-400">Up to {priceRange[1]} USD</div>
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

            {filteredProducts.length === 0 ? (
              <div className="py-32 text-center text-gray-500">
                <p className="font-bold">No products in this range yet.</p>
                <p className="text-sm mt-2">Real inventory is still being onboarded for this category.</p>
              </div>
            ) : (
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
                          <Image
                            src={product.imageUrl?.[0] || `https://picsum.photos/seed/${product.slug}/600/800`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-1000"
                            alt={product.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-0 group-hover:opacity-60 transition-opacity" />
                          <div className="absolute top-4 right-4">
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-6 space-y-3">
                          <div>
                            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">{product.categoryName}</div>
                            <h4 className="font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">{product.name}</h4>
                          </div>
                          {product.ratingCount > 0 && (
                            <div className="flex items-center gap-2">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-bold text-gray-400">{product.ratingAverage.toFixed(1)}</span>
                            </div>
                          )}
                          <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                            <div>
                              <div className="text-xl font-bold text-white">{product.price} {product.currencyCode}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{product.inStock ? `${product.stock} in stock` : 'Out of stock'}</div>
                            </div>
                            <Link href={`/marketplace/clothing/product/${product.slug}`}>
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
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
