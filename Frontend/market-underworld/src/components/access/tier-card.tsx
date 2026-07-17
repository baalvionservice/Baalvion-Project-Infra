"use client"

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TierCardData {
  level: string;
  name: string;
  priceLabel: string;
  features: string[];
  ctaLabel: string;
  tone?: "default" | "elite" | "vip";
  badge?: string;
}

const TONE_STYLES = {
  default: {
    card: "border-white/10 bg-white/[0.02]",
    level: "text-emerald-500",
    cta: "border border-white/15 text-white hover:border-emerald-500/40 hover:text-emerald-300",
    badge: "text-emerald-400 border-emerald-500/30",
  },
  elite: {
    card: "border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_60px_-15px_rgba(16,185,129,0.35)]",
    level: "text-emerald-400",
    cta: "bg-emerald-500 text-black hover:bg-emerald-400",
    badge: "text-emerald-400 border-emerald-500/30",
  },
  vip: {
    card: "border-amber-400/50 bg-amber-500/[0.05] shadow-[0_0_70px_-15px_rgba(245,158,11,0.4)]",
    level: "text-amber-400",
    cta: "bg-amber-400 text-black hover:bg-amber-300",
    badge: "text-amber-300 border-amber-400/40",
  },
} as const;

export function TierCard({ tier, status, onSelect }: { tier: TierCardData; status: "member" | "pending" | "none"; onSelect: () => void }) {
  const tone = TONE_STYLES[tier.tone ?? "default"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn("relative rounded-3xl border p-10 backdrop-blur-xl overflow-hidden", tone.card)}
    >
      {tier.badge && (
        <div className={cn("absolute top-6 right-6 text-[10px] font-black uppercase tracking-widest border rounded-full px-3 py-1", tone.badge)}>
          {tier.badge}
        </div>
      )}

      <div className={cn("text-[11px] font-bold uppercase tracking-[0.2em] mb-3", tone.level)}>{tier.level}</div>
      <h3 className="text-3xl font-bold text-white mb-6">{tier.name}</h3>

      <div className="mb-8">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Deposit Required</div>
        <div className="text-5xl font-black text-white">{tier.priceLabel}</div>
      </div>

      <ul className="space-y-3 mb-10">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      {status === "member" ? (
        <div className="w-full h-14 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-300 font-bold text-sm uppercase tracking-widest">
          Access Active
        </div>
      ) : status === "pending" ? (
        <div className="w-full h-14 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-300 font-bold text-sm uppercase tracking-widest">
          Verifying Payment…
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={cn("w-full h-14 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all", tone.cta)}
        >
          {tier.ctaLabel} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
