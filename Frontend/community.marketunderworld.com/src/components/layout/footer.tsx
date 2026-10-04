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
    <footer className="bg-black border-t border-[#1F232B] pt-20 pb-10">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-16 mb-20">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex items-center justify-center bg-black">
                <img src="/logo.jpg" alt="Baalvion Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold tracking-widest uppercase font-display">BAALVION</span>
            </div>
            <p className="text-[#6B7280] max-w-sm text-sm leading-relaxed font-mono uppercase">
              An online community and marketplace for members: forums, classes, and goods from independent sellers.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">Navigation</h4>
            <ul className="space-y-4 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
              <li><Link href="/marketplace" className="hover:text-[#39FF14]">Marketplace</Link></li>
              <li><Link href="/live-sessions" className="hover:text-[#39FF14]">Live Streams</Link></li>
              <li><Link href="/forum" className="hover:text-[#39FF14]">Forum Hub</Link></li>
            </ul>
          </div>

          {topCategories.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8">Shop</h4>
              <ul className="space-y-4 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
                {topCategories.map((cat) => (
                  <li key={cat.id}><Link href={`/shop/${cat.id}`} className="hover:text-[#39FF14]">{cat.name}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-bold text-semantic-warning uppercase tracking-[0.2em] mb-8">Access Control</h4>
            <ul className="space-y-4 text-xs font-bold text-[#6B7280] uppercase tracking-widest">
              <li><Link href="/access" className="hover:text-[#39FF14]">Get Access</Link></li>
              <li><Link href="/auth/signin" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/seller/onboarding" className="hover:text-white">Become a Seller</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#1F232B] flex flex-col md:flex-row md:flex-wrap items-center justify-between gap-6">
          <p className="w-full text-[10px] leading-relaxed text-[#6B7280]">Baalvion Industries Private Limited · CIN U43121OD2025PTC048479 · GSTIN 21AANCB3490M1ZF · Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India · Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India · +91 89512 84770 · support@baalvion.com</p>
          <div className="text-[9px] font-bold text-[#3D4450] uppercase tracking-[0.3em] flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            V2.4.0 OPERATIONAL • SECURE TUNNEL ACTIVE
          </div>
          <div className="flex gap-8">
            <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/refund-policy" className="hover:text-white">Refunds</Link>
              <Link href="/shipping-policy" className="hover:text-white">Delivery</Link>
              <Link href="/payments" className="hover:text-white">Payments</Link>
              <Link href="/grievance" className="hover:text-white">Grievance</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </nav>
            <span className="text-[10px] font-bold text-[#3D4450] uppercase tracking-widest">© 2026 Baalvion Industries Private Limited</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
