"use client"

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Zap, Globe2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GiftCardTile } from "@/components/giftcards/giftcard-tile";
import { GiftCardCheckoutModal } from "@/components/giftcards/giftcard-checkout-modal";
import { getCatalog, type GiftCardBrand } from "@/lib/api/giftcards";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IN", label: "India" },
];

export default function GiftCardStorePage() {
  const [country, setCountry] = useState("US");
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<GiftCardBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GiftCardBrand | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCatalog(country).then((data) => {
      setBrands(data);
      setLoading(false);
    });
  }, [country]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  const openBrand = (brand: GiftCardBrand) => {
    setSelected(brand);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navbar />

      <main className="container max-w-[1440px] mx-auto px-6 pt-44 pb-32">
        {/* Hero */}
        <header className="mb-16 space-y-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-fuchsia-400 uppercase tracking-[0.3em] border border-fuchsia-500/20 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> Gift Card Store
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]">
            Premium <span className="text-fuchsia-400">Gift Cards.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium">
            Real digital gift cards from leading global brands, paid for in crypto,
            delivered automatically the moment your payment confirms.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: Zap, label: "Instant delivery" },
              { icon: ShieldCheck, label: "Non-custodial crypto checkout" },
              { icon: Globe2, label: "7 countries and growing" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs font-bold text-gray-400 border border-white/10 rounded-full px-4 py-2">
                <b.icon className="w-3.5 h-3.5 text-fuchsia-400" /> {b.label}
              </div>
            ))}
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands…"
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
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-16 text-center space-y-3">
            <p className="text-gray-400 font-medium">
              No gift cards synced for {COUNTRIES.find((c) => c.code === country)?.label} yet.
            </p>
            <p className="text-gray-600 text-sm">
              The catalog is pulled live from a real supplier — an admin needs to run a catalog sync first.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filtered.map((brand) => (
              <GiftCardTile key={brand.slug} brand={brand} onSelect={() => openBrand(brand)} />
            ))}
          </motion.div>
        )}
      </main>

      <GiftCardCheckoutModal brand={selected} open={modalOpen} onOpenChange={setModalOpen} />
      <Footer />
    </div>
  );
}
