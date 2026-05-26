"use client";

import React from 'react';
import { ShieldCheck, Award, Zap, Globe } from 'lucide-react';

/**
 * @fileOverview TrustSection
 * Building immediate platform authority with subtle statistics.
 */
export function TrustSection() {
  const stats = [
    { icon: <Globe className="w-5 h-5 text-blue-600" />, label: "Global Jurisdictions", value: "120+" },
    { icon: <Award className="w-5 h-5 text-blue-600" />, label: "Expert Topics", value: "500+" },
    { icon: <ShieldCheck className="w-5 h-5 text-blue-600" />, label: "Verified Dossiers", value: "12K+" },
    { icon: <Zap className="w-5 h-5 text-blue-600" />, label: "Active Members", value: "50K+" }
  ];

  return (
    <div className="py-20 border-t border-slate-100 text-center space-y-12">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">The Benchmark of Legal Integrity</h3>
        <p className="text-sm text-slate-500 font-medium italic">Empowering professional discovery across the global legal ecosystem.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
              {stat.icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
