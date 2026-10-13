"use client"

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, Zap, Globe2, Tag, BookOpen, Key, Terminal, UserSquare, RefreshCw, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GiftCardTile } from "@/components/giftcards/giftcard-tile";
import { GiftCardCheckoutModal } from "@/components/giftcards/giftcard-checkout-modal";
import { getCatalog, type GiftCardBrand } from "@/lib/api/giftcards";
import { cn } from "@/lib/utils";
import { getStorefrontProducts, getStorefrontCategories, type StorefrontProduct, type StorefrontCategory } from "@/lib/api/commerce";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IN", label: "India" },
];


export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<"store" | "giftcards">("store");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Gift Card State
  const [country, setCountry] = useState("US");
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<GiftCardBrand | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Store listings: everything published by admin and approved sellers
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [storeCategories, setStoreCategories] = useState<StorefrontCategory[]>([]);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeCategory, setStoreCategory] = useState<string>("All");

  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getStorefrontProducts(undefined, { limit: 100 }), getStorefrontCategories().catch(() => [])])
      .then(([items, cats]) => { setProducts(items); setStoreCategories(cats); })
      .finally(() => setStoreLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "giftcards") {
      setLoading(true);
      getCatalog(country).then((data) => {
        setBrands(data);
        setLoading(false);
      });
    }
  }, [country, activeTab]);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  const filteredProducts = useMemo(() => {
    if (storeCategory === "All") return products;
    return products.filter((p) => p.categoryId === storeCategory);
  }, [products, storeCategory]);

  const handleApplyPromo = () => {
    if (promoCode.trim().length >= 3) {
      setPromoApplied(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navbar />

      <main className="container max-w-[1440px] mx-auto px-6 pt-44 pb-32">
        {/* Hero */}
        <header className="mb-12 space-y-8">
          <Breadcrumbs 
            items={[{ label: "Marketplace" }]} 
            className="mb-8"
          />
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-fuchsia-400 uppercase tracking-[0.3em] border border-fuchsia-500/20 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> Virtual Marketplace
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            The Underground <span className="text-fuchsia-400">Storefront.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium">
            Products from verified sellers, plus gift cards for 7 countries. Listings appear here as soon as they are approved.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: Zap, label: "Instant delivery" },
              { icon: ShieldCheck, label: "Crypto checkout" },
              { icon: Tag, label: "Promo Codes Accepted" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs font-bold text-gray-400 border border-white/10 rounded-full px-4 py-2">
                <b.icon className="w-3.5 h-3.5 text-fuchsia-400" /> {b.label}
              </div>
            ))}
          </div>
        </header>

        {/* Promo Code Section */}
        <div className="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center gap-4 max-w-2xl">
          <div className="flex-1 w-full relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fuchsia-500/50" />
            <input 
              type="text" 
              placeholder="Enter Promo Code"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
              className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors uppercase"
            />
          </div>
          <button 
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || promoApplied}
            className="w-full sm:w-auto px-6 h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            {promoApplied ? <><CheckCircle2 className="w-4 h-4" /> Applied (15% OFF)</> : "Apply Code"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("store")}
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap",
              activeTab === "store" ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20" : "text-gray-400 hover:text-white"
            )}
          >
            Store
          </button>
          <button
            onClick={() => setActiveTab("giftcards")}
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap",
              activeTab === "giftcards" ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20" : "text-gray-400 hover:text-white"
            )}
          >
            Gift Cards (KFC, Pizza Hut, etc.)
          </button>
          <Link
            href="/marketplace/clothing"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            Clothing
          </Link>
          <Link
            href="/shop/food"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            Food
          </Link>
          <Link
            href="/shop/events"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/shop/travel"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            Travel
          </Link>
          <Link
            href="/access"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            VIP
          </Link>
          <Link
            href="/marketplace/commodities"
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap text-gray-400 hover:text-white"
          >
            Commodities
          </Link>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-wrap gap-2 mb-8">
                {[{ id: "All", name: "All" }, ...storeCategories.filter((c) => products.some((p) => p.categoryId === c.id)).map((c) => ({ id: c.id, name: c.name }))].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStoreCategory(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                      storeCategory === cat.id ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {storeLoading ? (
                <div className="py-24 text-center text-gray-500">Loading listings…</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-24 text-center text-gray-500">No listings here yet. New listings appear as soon as they are approved.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const unit = Number(p.price ?? p.basePrice)
                    const finalPrice = promoApplied ? (unit * 0.85).toFixed(2) : unit.toFixed(2)
                    const href = `/shop/${p.categoryId}/${p.slug}`
                    return (
                      <div key={p.id} className="group relative flex flex-col bg-white/[0.02] border border-white/10 hover:border-fuchsia-500/30 rounded-3xl overflow-hidden transition-all">
                        <Link href={href} className="block">
                          <div className="aspect-square bg-white/5 overflow-hidden">
                            {p.imageUrl?.[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.imageUrl[0]} alt={p.name} className="w-full h-full object-cover" /> : null}
                          </div>
                        </Link>
                        <div className="p-5 flex flex-col flex-1">
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{p.categoryName}</div>
                          <Link href={href}><h3 className="font-bold text-lg mb-4 group-hover:text-fuchsia-400 transition-colors line-clamp-2">{p.name}</h3></Link>
                          <div className="flex items-end justify-between mt-auto">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-black text-2xl">{finalPrice} <span className="text-xs text-gray-500 font-bold">{p.currencyCode}</span></div>
                                {promoApplied && <div className="text-sm text-gray-500 line-through">{unit.toFixed(2)}</div>}
                              </div>
                              {!p.inStock && <div className="text-xs text-red-400 font-bold mt-1">Out of stock</div>}
                            </div>
                            <button
                              disabled={!p.inStock}
                              aria-label={`Add ${p.name} to cart`}
                              onClick={() => {
                                addItem({ sku: p.slug, name: p.name, price: Number(finalPrice), productId: p.id, quantity: 1 })
                                  .then(() => toast({ title: "Added to cart", description: `${p.name} has been added to your cart.` }))
                                  .catch((err) => toast({ variant: "destructive", title: "Couldn't add", description: err.message || "Please try again." }))
                              }}
                              className="w-10 h-10 rounded-full bg-white/5 hover:bg-fuchsia-500 disabled:opacity-40 flex items-center justify-center transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "giftcards" && (
            <motion.div
              key="giftcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-12">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search brands (e.g. KFC, Pizza Hut)…"
                    className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 pl-12 pr-4 text-sm outline-none focus:border-fuchsia-500/40 transition-colors"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCountry(c.code)}
                      className={cn(
                        "shrink-0 px-4 h-14 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border",
                        country === c.code
                          ? "bg-fuchsia-500 border-fuchsia-500 text-black"
                          : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      )}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-72 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-16 text-center space-y-3">
                  <p className="text-gray-400 font-medium">
                    No gift cards synced for {COUNTRIES.find((c) => c.code === country)?.label} yet.
                  </p>
                  <p className="text-gray-600 text-sm">
                    The catalog is pulled live from a real supplier — an admin needs to run a catalog sync first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredBrands.map((brand) => (
                    <GiftCardTile key={brand.slug} brand={brand} onSelect={() => { setSelectedBrand(brand); setModalOpen(true); }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <GiftCardCheckoutModal brand={selectedBrand} open={modalOpen} onOpenChange={setModalOpen} />
      <Footer />
    </div>
  );
}
