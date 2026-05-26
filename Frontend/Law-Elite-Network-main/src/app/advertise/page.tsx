"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, TrendingUp, Globe, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdvertisePage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Platform Demographics", id: "audience" },
    { label: "B2B Partnership Tiers", id: "partnerships" },
    { label: "Content Integration", id: "content" },
    { label: "Network Intelligence Ads", id: "ads" },
    { label: "Brand Integrity Standards", id: "standards" },
    { label: "Case Studies", id: "case-studies" },
    { label: "Request Media Kit", id: "media-kit" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          
          <header className="mb-12">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              Advertise
            </h1>

            <div className="relative border border-slate-200 p-8 pt-6 rounded-none bg-slate-50/30">
              <div className="flex items-center gap-2 mb-6">
                <List className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Table of Contents</span>
              </div>

              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 animate-in fade-in duration-300">
                  {tocLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2 group">
                      <CoralArrow className="mt-1 shrink-0" />
                      <Link 
                        href={`#${link.id}`}
                        className="text-[15px] font-medium text-slate-800 hover:text-blue-600 underline decoration-slate-200 hover:decoration-blue-600 decoration-1 underline-offset-4 transition-all"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#a3a3a3] hover:bg-slate-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-sm transition-all shadow-sm"
              >
                {isExpanded ? 'Close -' : 'Expand +'}
              </button>
            </div>
          </header>

          <section className="space-y-20">
            <div id="audience" className="space-y-6">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">Platform Demographics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">50K+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Active Members</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">120+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Jurisdictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600 font-serif">Top 1%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Decision Makers</p>
                </div>
              </div>
            </div>

            <div id="partnerships" className="space-y-8">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">B2B Partnership Tiers</h2>
              <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-bold italic font-serif">Elite Network Sponsorship</h3>
                  <p className="text-slate-400 leading-relaxed italic">Align your brand with high-intent legal intelligence and distinguished practitioners.</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all">Request Partnership Protocol</button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function CoralArrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 text-[#ff6b6b]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 15l-3 3-3-3" /><path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
