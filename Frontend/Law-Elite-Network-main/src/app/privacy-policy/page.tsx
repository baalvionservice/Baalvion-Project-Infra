"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, ShieldCheck, Lock, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function PrivacyPolicyPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Information We Collect", id: "collection" },
    { label: "How We Use Information", id: "usage" },
    { label: "Data Security Protocols", id: "security" },
    { label: "Your Privacy Rights", id: "rights" },
    { label: "Cookie Policy", id: "cookies" },
    { label: "Third-Party Disclosures", id: "third-party" },
    { label: "International Data Transfers", id: "international" },
    { label: "Contact Privacy Team", id: "contact-privacy" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Compliance Dossier</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              Privacy Policy
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
            <div id="collection" className="space-y-6">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">Information We Collect</h2>
              <div className="prose-legal">
                <p>We implement rigorous protocols to ensure that only the most necessary professional data is synchronized with our network.</p>
              </div>
            </div>

            <div id="security" className="space-y-6">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">Data Security Protocols</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-blue-600 text-white shadow-xl flex items-start gap-4">
                  <Lock className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">E2E Encryption</h4>
                    <p className="text-xs text-blue-100 italic">All dossier communications are secured via AES-256 protocols.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Verified Audit</h4>
                    <p className="text-xs text-slate-500 italic">Regular security intelligence audits are performed on all network nodes.</p>
                  </div>
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
