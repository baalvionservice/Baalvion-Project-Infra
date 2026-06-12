"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Gavel,
  ChevronRight
} from 'lucide-react';

/**
 * @fileOverview High-Fidelity Editorial Footer
 * Matches the Investopedia-style layout with dark navy aesthetics and A-Z strip.
 */
export function PublicFooter() {
  const letters = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <footer className="w-full flex flex-col">
      {/* Main Footer Section */}
      <div className="bg-[#222b3e] text-white pt-16 pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            
            {/* Left: Branding & Newsletter */}
            <div className="md:col-span-4 space-y-10">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl">
                  <Gavel className="text-[#222b3e] w-6 h-6" />
                </div>
                <span className="text-3xl font-bold tracking-tighter font-serif italic">
                  Law <span className="text-white/90">Elite</span>
                </span>
              </Link>

              <div className="space-y-6">
                <button className="bg-[#c2d4ef] hover:bg-white text-[#222b3e] font-bold uppercase text-[11px] tracking-[0.15em] px-10 h-12 rounded shadow-xl transition-all duration-300 w-full max-w-[280px]">
                  Newsletter Sign Up
                </button>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Follow Us</p>
                  <div className="flex items-center gap-6">
                    <Link href="#" className="text-white hover:text-blue-400 transition-colors" aria-label="Law Elite Network on Facebook"><Facebook className="w-5 h-5" aria-hidden="true" /></Link>
                    <Link href="#" className="text-white hover:text-pink-400 transition-colors" aria-label="Law Elite Network on Instagram"><Instagram className="w-5 h-5" aria-hidden="true" /></Link>
                    <Link href="#" className="text-white hover:text-blue-300 transition-colors" aria-label="Law Elite Network on LinkedIn"><Linkedin className="w-5 h-5" aria-hidden="true" /></Link>
                    <Link href="#" className="text-white hover:text-white/80 transition-colors font-bold text-lg" aria-label="Law Elite Network on TikTok">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.83 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
                    </Link>
                    <Link href="#" className="text-white hover:text-red-500 transition-colors" aria-label="Law Elite Network on YouTube"><Youtube className="w-6 h-6" aria-hidden="true" /></Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Primary Navigation */}
            <div className="md:col-span-3">
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest">
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Business & Corporate</Link></li>
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Criminal Law</Link></li>
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Family & Personal</Link></li>
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Tax & Finance</Link></li>
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Employment & Labor</Link></li>
                <li><Link href="/" className="hover:text-blue-300 transition-colors">Technology & IP</Link></li>
                <li><Link href="/lawyers" className="hover:text-blue-300 transition-colors">Counsel Registry</Link></li>
                <li><Link href="/legal" className="hover:text-blue-300 transition-colors">Encyclopedia</Link></li>
              </ul>
            </div>

            {/* Right: Secondary Links */}
            <div className="md:col-span-2 space-y-4 text-[11px] font-medium text-white/70">
              <ul className="space-y-3">
                <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4 text-[11px] font-medium text-white/70">
              <ul className="space-y-3">
                <li><Link href="/editorial-process" className="hover:text-white transition-colors">Editorial Process</Link></li>
                <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* A-Z Index Strip */}
      <div className="bg-[#1a2333] py-8 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-3">
            {letters.map((letter) => (
              <Link 
                key={letter} 
                href={letter === '#' ? '/legal' : `/legal/${letter.toLowerCase()}`}
                className="text-[13px] font-bold text-white/80 hover:text-white transition-all transform hover:scale-110"
              >
                {letter}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Network Strip */}
      <div className="bg-white py-6">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row items-center gap-4">
          <span className="font-serif text-xl font-bold text-slate-900 flex items-center gap-1">
            Law Elite <span className="text-slate-400">Network.</span>
          </span>
          <p className="text-[11px] font-medium text-slate-500">
            Law Elite is part of the <Link href="/" className="text-blue-600 hover:underline">Elite Knowledge Group</Link> publishing family. 
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
