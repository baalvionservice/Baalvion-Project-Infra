
"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-Fidelity "About Us" Page
 * Precisely mirrors the Investopedia reference design with multi-column TOC and coral arrow signatures.
 */
export default function AboutUsPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Who We Are", id: "who-we-are" },
    { label: "Law Elite in the Press", id: "press" },
    { label: "Editorial Team", id: "editorial" },
    { label: "News Team", id: "news" },
    { label: "Legal Research & Compliance Team", id: "compliance" },
    { label: "Law Elite By the Numbers", id: "numbers" },
    { label: "Editorial Standards", id: "standards" },
    { label: "Professional Review Board", id: "board" },
    { label: "Fact Checking", id: "fact-checking" },
    { label: "Corrections", id: "corrections" },
    { label: "Management Team", id: "management" },
    { label: "About Elite Knowledge Group", id: "about-group" },
    { label: "Careers", id: "careers" },
    { label: "Contact Us", id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          
          <header className="mb-12">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              About Us
            </h1>

            {/* HIGH-FIDELITY TABLE OF CONTENTS BOX */}
            <div className="relative border border-slate-200 p-8 pt-6 rounded-none">
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

              {/* THE "CLOSE -" / "EXPAND +" BUTTON OVERLAY */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#a3a3a3] hover:bg-slate-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-sm transition-all shadow-sm"
              >
                {isExpanded ? 'Close -' : 'Expand +'}
              </button>
            </div>
          </header>

          {/* MAIN CONTENT SECTION */}
          <section id="who-we-are" className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">
              Who We Are
            </h2>
            
            <div className="space-y-6 text-lg text-slate-700 leading-relaxed font-medium">
              <p>
                Law Elite was founded in 2011 with the mission of helping people improve their professional and legal outcomes.
              </p>

              <p>
                Our millions of readers come to us from all over the world and from all walks of life. Some are learning about legal structures and litigation for the first time, while others are experienced legal teams, business owners, professionals, and executives looking to improve their knowledge and success. No matter who they are, we are here to help.
              </p>

              <p>
                Law Elite is a part of the <Link href="/" className="text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-4 hover:decoration-blue-600 transition-all">Elite Knowledge Group</Link> publishing family.
              </p>
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

/**
 * Custom Coral Arrow SVG matching the reference image curved arrow
 */
function CoralArrow({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("w-4 h-4 text-[#ff6b6b]", className)} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M15 15l-3 3-3-3" />
      <path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
