"use client";

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Award,
  Zap,
  Globe,
  Languages,
  MapPin,
  BookMarked,
  RotateCcw,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

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

// The methodology we actually follow (mirrors /editorial-standards) --
// only principles the site's real practices back up, no invented claims.
const PRINCIPLES = [
  {
    icon: Languages,
    title: 'Plain language',
    body: 'Complex legal concepts are explained for ordinary readers, not for other lawyers.',
  },
  {
    icon: MapPin,
    title: 'Jurisdiction first',
    body: 'Legal rules are connected to the jurisdiction in which they apply, not treated as universal.',
  },
  {
    icon: ShieldCheck,
    title: 'Editorial independence',
    body: 'Educational content is kept separate from advertising and sponsorship decisions.',
  },
  {
    icon: BookMarked,
    title: 'Source-conscious',
    body: 'Legal claims are checked against authoritative sources where appropriate.',
  },
  {
    icon: RotateCcw,
    title: 'Corrections matter',
    body: 'Material errors are acknowledged and corrected transparently, not quietly edited away.',
  },
  {
    icon: GraduationCap,
    title: 'Education, not representation',
    body: "We provide general legal education. We don't replace qualified legal counsel.",
  },
];

/**
 * @fileOverview TrustSection
 * The homepage's editorial-standard statement (six methodology principles)
 * plus platform stats. Stats are managed in the central CMS (admin-platform
 * console) and read via the same-origin /api/cms/homepage route, falling
 * back to the built-in figures if unavailable.
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
    <div className="py-20 border-t border-slate-100">
      <div className="max-w-2xl mx-auto text-center space-y-2 mb-12">
        <span className="kicker justify-center">Editorial Standards</span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Our Editorial Standard</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Six principles govern everything we publish.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 max-w-5xl mx-auto">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <p.icon className="w-[18px] h-[18px] text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">{p.title}</h3>
            <p className="text-[13.5px] text-slate-500 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-14 border-t border-slate-100 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">By the Numbers</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
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
    </div>
  );
}
