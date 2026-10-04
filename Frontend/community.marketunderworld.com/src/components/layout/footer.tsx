"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { getStorefrontCategories, type StorefrontCategory } from '@/lib/api/commerce';

// Client component, not async server component: Footer is imported directly into many "use
// client" pages (including the homepage) across this app, and a Client Component cannot render
// an async Server Component it imports directly — only one rendered by a Server Component parent
// and passed down as children. Fetching client-side is the only approach that works uniformly at
// every call site. Real category links sourced from commerce-service either way — not a
// hardcoded list that drifts out of sync with what sellers actually have listed.
export const Footer = () => {
  const [topCategories, setTopCategories] = useState<StorefrontCategory[]>([]);

  useEffect(() => {
    getStorefrontCategories().then((cats) => setTopCategories(cats.slice(0, 6)));
  }, []);

  return (
    <footer className="bg-black border-t border-[#1F232B] pt-14 md:pt-20 pb-10">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10 md:gap-12 mb-14 md:mb-20">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex items-center justify-center bg-black">
                <img src="/logo.jpg" alt="Baalvion Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold tracking-widest uppercase font-display">BAALVION</span>
            </div>
            <p className="text-[#6B7280] max-w-sm text-sm leading-relaxed font-mono uppercase">
              The world's premier distributed intelligence and commodity exchange network.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-5">Explore</h4>
            <ul className="space-y-1 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
              <li><Link href="/clubs" className="hover:text-[#39FF14] inline-block py-2">Clubs</Link></li>
              <li><Link href="/calendar" className="hover:text-[#39FF14] inline-block py-2">Calendar</Link></li>
              <li><Link href="/locals" className="hover:text-[#39FF14] inline-block py-2">Locals</Link></li>
              <li><Link href="/education" className="hover:text-[#39FF14] inline-block py-2">Education</Link></li>
              <li><Link href="/marketplace" className="hover:text-[#39FF14] inline-block py-2">Marketplace</Link></li>
              <li><Link href="/live-sessions" className="hover:text-[#39FF14] inline-block py-2">Live Streams</Link></li>
              <li><Link href="/forum" className="hover:text-[#39FF14] inline-block py-2">Forum Hub</Link></li>
              <li><Link href="/bounty" className="hover:text-[#39FF14] inline-block py-2">Bug Bounty</Link></li>
            </ul>
          </div>

          {topCategories.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-5">Shop</h4>
              <ul className="space-y-1 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
                {topCategories.map((cat) => (
                  <li key={cat.id}><Link href={`/shop/${cat.id}`} className="hover:text-[#39FF14] inline-block py-2">{cat.name}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-bold text-semantic-warning uppercase tracking-[0.2em] mb-5">Access Control</h4>
            <ul className="space-y-1 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
              <li><Link href="/access" className="hover:text-[#39FF14] inline-block py-2">Get Access</Link></li>
              <li><Link href="/auth/signin" className="hover:text-white inline-block py-2">Operator Sign In</Link></li>
              <li><Link href="/seller/onboarding" className="hover:text-white inline-block py-2">Become a Seller</Link></li>
              <li><Link href="/support" className="hover:text-white inline-block py-2">Help &amp; Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-5">Legal</h4>
            <ul className="space-y-1 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
              <li><Link href="/about" className="hover:text-white inline-block py-2">About</Link></li>
              <li><Link href="/contact" className="hover:text-white inline-block py-2">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white inline-block py-2">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white inline-block py-2">Terms</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white inline-block py-2">Refunds</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white inline-block py-2">Shipping</Link></li>
              <li><Link href="/grievance" className="hover:text-white inline-block py-2">Grievance</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#1F232B] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[9px] font-bold text-[#3D4450] uppercase tracking-[0.3em] flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            Market Underworld
          </div>
          <div className="flex gap-8">
            <span className="text-[10px] font-bold text-[#3D4450] uppercase tracking-widest">© 2026 UNDERWORLD PROTOCOL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
