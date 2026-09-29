"use client"

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { GiftCardBrand } from "@/lib/api/giftcards";

export function GiftCardTile({ brand, onSelect }: { brand: GiftCardBrand; onSelect: () => void }) {
  const priceLabel = brand.denominationType === "FIXED"
    ? `From ${brand.currencyCode} ${Math.min(...brand.fixedDenominations)}`
    : `${brand.currencyCode} ${brand.minDenomination}–${brand.maxDenomination}`;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative text-left rounded-3xl border border-white/8 bg-[#0d0d14] overflow-hidden
                 hover:border-fuchsia-500/40 transition-colors duration-300
                 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_60px_-15px_rgba(217,70,239,0.35)]"
    >
      {/* Brand banner */}
      <div className="relative h-36 flex items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.06] to-transparent">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.name} className="h-14 object-contain relative z-10 drop-shadow-lg" />
        ) : (
          <span className="text-2xl font-black tracking-tight text-white/80 relative z-10">{brand.name}</span>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
      </div>

      <div className="p-6 space-y-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
          <Zap className="w-3 h-3" /> Instant delivery
        </div>
        <h3 className="text-lg font-bold text-white leading-tight">{brand.name} Gift Card</h3>
        {brand.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{brand.description}</p>
        )}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xl font-black text-white">{priceLabel}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400 group-hover:translate-x-1 transition-transform">
            Buy →
          </span>
        </div>
      </div>
    </motion.button>
  );
}
