"use client";

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

/**
 * @fileOverview TrustBadges
 * High-fidelity verification signals for the Law Elite Network.
 */
export default function TrustBadges() {
  const badges = [
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Verified Practitioners" },
    { icon: <Lock className="w-3.5 h-3.5" />, label: "E2E Encrypted Sessions" },
    { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Escrow Protection" }
  ];

  return (
    <div className="flex flex-wrap gap-4 py-4 animate-in fade-in duration-700">
      {badges.map((badge, i) => (
        <div 
          key={i} 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10"
        >
          <div className="text-emerald-400">
            {badge.icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}
