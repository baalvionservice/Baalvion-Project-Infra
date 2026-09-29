"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import {
  Zap,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Star,
  ChevronRight,
  Grid,
  List,
  Heart,
  Smartphone,
  Book,
  Home,
  Trophy,
  Gamepad2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { StorefrontProduct } from "@/lib/api/commerce"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"

const DEPARTMENTS = [
  { name: 'Electronics', icon: Smartphone, color: 'from-blue-500/20 to-blue-600/20' },
  { name: 'Books', icon: Book, color: 'from-purple-500/20 to-purple-600/20' },
  { name: 'Home & Kitchen', icon: Home, color: 'from-orange-500/20 to-orange-600/20' },
  { name: 'Sports & Fitness', icon: Trophy, color: 'from-green-500/20 to-green-600/20' },
  { name: 'Beauty & Health', icon: Heart, color: 'from-pink-500/20 to-pink-600/20' },
  { name: 'Gaming', icon: Gamepad2, color: 'from-cyan-500/20 to-cyan-600/20' },
];

interface CommoditiesPageClientProps {
  products: StorefrontProduct[];
}

export function CommoditiesPageClient({ products }: CommoditiesPageClientProps) {
  const [selectedDept, setSelectedDept] = useState("All")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { addItem } = useCart();
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedDept === "All" || p.categoryName === selectedDept);
  }, [products, selectedDept]);

  const handleAddToCart = async (product: StorefrontProduct) => {
    try {
      await addItem({ productId: product.id, sku: product.id, name: product.name, price: product.price });
      toast({ title: "Added to cart", description: `${product.name} is in your cart.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't add to cart", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

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
              📦 Real Inventory • Global Sellers
            </NexusBadge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Everything You Need. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-[#00BCD4]">Crypto Prices.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
              Electronics, books, home goods and more — delivered globally. Pay with BTC, ETH or USDT instantly.
            </p>
          </motion.div>
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
            {DEPARTMENTS.map((dept) => (
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
                </div>
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
                  <button onClick={() => setSelectedDept("All")} className="text-[#00E676] hover:underline capitalize">Clear</button>
                </h3>
                <div className="space-y-4">
                  {DEPARTMENTS.map(dept => (
                    <label key={dept.name} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedDept(dept.name)}>
                      <div className={`w-5 h-5 rounded border border-white/10 transition-all flex items-center justify-center ${selectedDept === dept.name ? 'bg-[#00E676] border-[#00E676]' : 'group-hover:border-[#00E676]/50'}`}>
                        {selectedDept === dept.name && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedDept === dept.name ? 'text-white' : 'text-gray-500'}`}>{dept.name}</span>
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
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-32 text-center text-gray-500">
                <p className="font-bold">No products in this department yet.</p>
                <p className="text-sm mt-2">Real inventory is still being onboarded.</p>
              </div>
            ) : (
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
                          <Image
                            src={product.imageUrl?.[0] || `https://picsum.photos/seed/${product.slug}/500/500`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            alt={product.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00E676] transition-colors">
                              <Heart className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute top-3 left-3">
                            <NexusBadge className="bg-[#00E676]/10 text-[#00E676] border-none text-[8px]">{product.categoryName.toUpperCase()}</NexusBadge>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-sm line-clamp-2 h-10 leading-tight group-hover:text-[#00E676] transition-colors">{product.name}</h4>
                            {product.ratingCount > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(product.ratingAverage) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />)}
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">({product.ratingCount})</span>
                              </div>
                            )}
                          </div>
                          <div className="pt-4 border-t border-white/5 space-y-4">
                            <div>
                              <div className="text-lg font-bold text-white">{product.price} {product.currencyCode}</div>
                              <div className="text-[9px] text-gray-500 font-bold">{product.inStock ? `${product.stock} in stock` : 'Out of stock'}</div>
                            </div>
                            <NexusButton
                              onClick={() => handleAddToCart(product)}
                              disabled={!product.inStock}
                              className="w-full bg-white/5 border border-white/10 text-white hover:bg-[#00E676] hover:text-black hover:border-[#00E676] h-10 text-[10px] font-bold"
                            >
                              Add to Cart
                            </NexusButton>
                          </div>
                        </div>
                      </NexusCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

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
