"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, Briefcase, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CareersPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Our Mission", id: "mission" },
    { label: "Culture & Values", id: "culture" },
    { label: "Benefits & Growth", id: "benefits" },
    { label: "Engineering Roles", id: "engineering" },
    { label: "Editorial Roles", id: "editorial" },
    { label: "Legal Research Roles", id: "legal-research" },
    { label: "Diversity & Inclusion", id: "diversity" },
    { label: "Application Process", id: "process" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          
          <header className="mb-12">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              Careers
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
            <div id="mission" className="space-y-6">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">Our Mission</h2>
              <div className="prose-legal">
                <p>Join a team dedicated to democratizing elite legal intelligence for global enterprises and individuals alike.</p>
              </div>
            </div>

            <div id="culture" className="space-y-6">
              <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">Culture & Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ValueCard icon={<Briefcase className="w-5 h-5" />} title="Excellence" />
                <ValueCard icon={<Users className="w-5 h-5" />} title="Collaboration" />
                <ValueCard icon={<Zap className="w-5 h-5" />} title="Innovation" />
              </div>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function ValueCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="p-6 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">{icon}</div>
      <h4 className="text-lg font-bold text-slate-900">{title}</h4>
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
