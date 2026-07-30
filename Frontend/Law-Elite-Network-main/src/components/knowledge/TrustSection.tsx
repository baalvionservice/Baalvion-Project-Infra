"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Award, Zap, Globe, type LucideIcon } from 'lucide-react';

type Stat = { icon: string; label: string; value: string };

const ICON_MAP: Record<string, LucideIcon> = { Globe, Award, ShieldCheck, Zap };

// Real, verifiable figures -- computed from the bundled editorial library
// (72 published guides, 8 practice areas, 11 named contributors), not
// aspirational numbers. Previously this fell back to invented figures
// ("12K+ Verified Dossiers", "50K+ Active Members", "120+ Global
// Jurisdictions") with no data behind them whenever the CMS had no override.
const FALLBACK_STATS: Stat[] = [
  { icon: "Award", label: "Practice Areas", value: "8" },
  { icon: "Globe", label: "Legal Guides", value: "72+" },
  { icon: "ShieldCheck", label: "Expert Contributors", value: "11" },
  { icon: "Zap", label: "Specializations Covered", value: "26" }
];

/**
 * @fileOverview TrustSection
 * Platform authority statistics. Stats are managed in the central CMS
 * (admin-platform console) and read via the same-origin /api/cms/homepage route,
 * falling back to the built-in figures if unavailable.
 */
export function TrustSection() {
  const [stats, setStats] = useState<Stat[]>(FALLBACK_STATS);

  useEffect(() => {
    let active = true;
    fetch('/api/cms/homepage')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const cms = j?.data?.trustStats;
        if (active && Array.isArray(cms) && cms.length) setStats(cms);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div className="py-20 border-t border-slate-100 text-center space-y-12">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">The Benchmark of Legal Integrity</h3>
        <p className="text-sm text-slate-500 font-medium italic">Empowering professional discovery across the global legal ecosystem.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          const Icon = ICON_MAP[stat.icon] || Globe;
          return (
          <div key={i} className="space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
