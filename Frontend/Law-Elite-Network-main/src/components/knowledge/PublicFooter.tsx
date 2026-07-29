"use client";

import React from 'react';
import Link from 'next/link';
import { Linkedin } from 'lucide-react';
import { LawEliteMark } from '@/components/icons/LawEliteMark';
import { FooterNewsletterForm } from '@/components/knowledge/FooterNewsletterForm';

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
                  <LawEliteMark className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold tracking-tighter font-serif">
                  Law <span className="text-white/90">Elite</span>
                </span>
              </Link>

              <div className="space-y-6">
                <FooterNewsletterForm />

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Follow Us</p>
                  <div className="flex items-center gap-6">
                    <Link href="https://www.linkedin.com/company/law-elite-network" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300 transition-colors" aria-label="Law Elite Network on LinkedIn"><Linkedin className="w-5 h-5" aria-hidden="true" /></Link>
                    <Link href="https://x.com/lawelitenetwork" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors" aria-label="Law Elite Network on X">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Primary Navigation */}
            <div className="md:col-span-3">
              <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest">
                <li><Link href="/law/business-corporate" className="hover:text-blue-300 transition-colors">Business & Corporate</Link></li>
                <li><Link href="/law/criminal-law" className="hover:text-blue-300 transition-colors">Criminal Law</Link></li>
                <li><Link href="/law/family-personal" className="hover:text-blue-300 transition-colors">Family & Personal</Link></li>
                <li><Link href="/law/tax-finance" className="hover:text-blue-300 transition-colors">Tax & Finance</Link></li>
                <li><Link href="/law/employment-labor" className="hover:text-blue-300 transition-colors">Employment & Labor</Link></li>
                <li><Link href="/law/technology-ip" className="hover:text-blue-300 transition-colors">Technology & IP</Link></li>
                <li><Link href="/lawyers" className="hover:text-blue-300 transition-colors">Counsel Registry</Link></li>
                <li><Link href="/legal" className="hover:text-blue-300 transition-colors">Encyclopedia</Link></li>
              </ul>
            </div>

            {/* Right: Secondary Links */}
            <div className="md:col-span-2 space-y-4 text-[11px] font-medium text-white/70">
              <ul className="space-y-3">
                <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/authors" className="hover:text-white transition-colors">Our Contributors</Link></li>
                <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link></li>
                <li><Link href="/editorial-standards" className="hover:text-white transition-colors">Editorial Standards</Link></li>
                <li><Link href="/editorial-process" className="hover:text-white transition-colors">Editorial Process</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4 text-[11px] font-medium text-white/70">
              <ul className="space-y-3">
                <li><Link href="/corrections" className="hover:text-white transition-colors">Corrections</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          {/* Legal & Compliance: full-width band, kept out of the 12-col grid above
              since 12 additional links would otherwise force an unbalanced 18-unit row */}
          <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
            <div className="space-y-4 text-[11px] font-medium text-white/70">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Trust &amp; Compliance</p>
              <ul className="space-y-3">
                <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/ai-usage-policy" className="hover:text-white transition-colors">AI Usage Policy</Link></li>
                <li><Link href="/dmca-policy" className="hover:text-white transition-colors">DMCA Policy</Link></li>
                <li><Link href="/copyright-policy" className="hover:text-white transition-colors">Copyright Policy</Link></li>
              </ul>
            </div>

            <div className="space-y-4 text-[11px] font-medium text-white/70">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Accessibility &amp; Sourcing</p>
              <ul className="space-y-3">
                <li><Link href="/accessibility" className="hover:text-white transition-colors">Accessibility Statement</Link></li>
                <li><Link href="/source-attribution-policy" className="hover:text-white transition-colors">Source Attribution Policy</Link></li>
                <li><Link href="/diversity-policy" className="hover:text-white transition-colors">Diversity Policy</Link></li>
              </ul>
            </div>

            <div className="space-y-4 text-[11px] font-medium text-white/70">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Editorial Disclosures</p>
              <ul className="space-y-3">
                <li><Link href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</Link></li>
                <li><Link href="/sponsored-content-policy" className="hover:text-white transition-colors">Sponsored Content Policy</Link></li>
                <li><Link href="/ownership-disclosure" className="hover:text-white transition-colors">Ownership Disclosure</Link></li>
              </ul>
            </div>

            <div className="space-y-4 text-[11px] font-medium text-white/70">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Community</p>
              <ul className="space-y-3">
                <li><Link href="/conflict-of-interest-policy" className="hover:text-white transition-colors">Conflict of Interest Policy</Link></li>
                <li><Link href="/comment-policy" className="hover:text-white transition-colors">Comment & Review Policy</Link></li>
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
