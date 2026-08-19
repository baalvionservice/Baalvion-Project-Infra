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
const EXPLORE_LINKS = [
  { href: '/news', label: 'Legal News' },
  { href: '/case-law', label: 'Case Law' },
  { href: '/legislation', label: 'Legislation' },
  { href: '/law-changes', label: 'Law Changes' },
  { href: '/countries', label: 'Browse by Country' },
];

const PRACTICE_AREA_LINKS = [
  { href: '/business', label: 'Business & Corporate' },
  { href: '/criminal-law', label: 'Criminal Law' },
  { href: '/family-law', label: 'Family & Personal' },
  { href: '/real-estate-law', label: 'Property & Real Estate' },
  { href: '/tax-finance', label: 'Tax & Finance' },
  { href: '/employment-law', label: 'Employment & Labor' },
  { href: '/tech-ip', label: 'Technology & IP' },
  { href: '/disputes', label: 'Dispute Resolution' },
];

const ABOUT_LINKS = [
  { href: '/about-us', label: 'About Us' },
  { href: '/authors', label: 'Contributors' },
  { href: '/editorial-standards', label: 'Editorial Standards' },
  { href: '/editorial-process', label: 'Editorial Process' },
  { href: '/corrections', label: 'Corrections' },
  { href: '/contact-us', label: 'Contact Us' },
  { href: '/careers', label: 'Careers' },
  { href: '/advertise', label: 'Advertise' },
];

const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/terms-of-service#disclaimers', label: 'Disclaimer' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/ai-usage-policy', label: 'AI Policy' },
  { href: '/editorial-disclosure-policy', label: 'DMCA' },
  { href: '/sponsored-content-policy', label: 'Advertising Disclosure' },
];

export function PublicFooter() {
  return (
    <footer className="w-full flex flex-col">
      {/* Main Footer Section */}
      <div className="bg-[#222b3e] text-white pt-10 pb-6 md:pt-16 md:pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">

            {/* Left: Branding & Newsletter */}
            <div className="md:col-span-4 space-y-6 md:space-y-10">
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

            <FooterLinkColumn
              colSpan="md:col-span-3"
              title="Explore"
              sections={[
                { heading: 'Explore', links: EXPLORE_LINKS },
                { heading: 'Practice Areas (Legal Guides)', links: PRACTICE_AREA_LINKS },
              ]}
            />

            <FooterLinkColumn
              colSpan="md:col-span-3"
              title="About"
              sections={[{ heading: 'About', links: ABOUT_LINKS }]}
            />

            <FooterLinkColumn
              colSpan="md:col-span-2"
              title="Legal"
              sections={[{ heading: 'Legal', links: LEGAL_LINKS }]}
            />
          </div>

          {/* Additional policies consolidated into dedicated page */}
          <div className="mt-8 pt-6 md:mt-14 md:pt-10 border-t border-white/10">
            <Link href="/policies" className="text-[11px] font-medium text-white/70 hover:text-white transition-colors">
              View all policies and guidelines →
            </Link>
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
            Law Elite Network is operated by Baalvion Industries Private Limited, part of the Baalvion Group.
            © {new Date().getFullYear()} All rights reserved. CIN: U43121OD2025PTC048479
          </p>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = { href: string; label: string };
type FooterLinkSection = { heading: string; links: FooterLink[] };

/**
 * Renders as a collapsed <details> disclosure on mobile (see the same
 * pattern in FrequentlyAskedQuestions.tsx) so the footer's ~28 links don't
 * all render at full height on small screens, and as the original static
 * column on md+.
 */
function FooterLinkColumn({ title, sections, colSpan }: { title: string; sections: FooterLinkSection[]; colSpan: string }) {
  return (
    <div className={colSpan}>
      <details className="group md:hidden border-b border-white/10">
        <summary className="cursor-pointer select-none list-none flex items-center justify-between py-4 text-[10px] font-bold uppercase tracking-widest text-white/50">
          {title}
          <span className="text-white/40 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="space-y-4 pb-4 text-[11px] font-medium text-white/70">
          {sections.map((section) => (
            <div key={section.heading} className="space-y-3">
              {section.heading !== title && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{section.heading}</p>
              )}
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div className="hidden md:block space-y-4 text-[11px] font-medium text-white/70">
        {sections.map((section) => (
          <div key={section.heading} className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{section.heading}</p>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
