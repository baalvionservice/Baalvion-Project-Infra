"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Globe, Terminal } from 'lucide-react';
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
              <div className="w-8 h-8 rounded bg-[#39FF14] flex items-center justify-center text-black font-bold text-xs">MU</div>
              <span className="text-white font-bold tracking-tight uppercase font-display italic">Market Underworld</span>
            </div>
            <p className="text-[#6B7280] max-w-sm text-sm leading-relaxed font-mono uppercase">
              The world's premier distributed intelligence and commodity exchange network.
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
              <li><Link href="/auth/signin" className="hover:text-white">Operator Sign In</Link></li>
              <li>
                <Link href="/demo-access" className="flex items-center gap-2 text-semantic-warning hover:text-white transition-colors">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Demo Panel Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-[#1F232B] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[9px] font-bold text-[#3D4450] uppercase tracking-[0.3em] flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            V2.4.0 OPERATIONAL • SECURE TUNNEL ACTIVE
          </div>
          <div className="flex gap-8">
            <span className="text-[10px] font-bold text-[#3D4450] uppercase tracking-widest">© 2026 UNDERWORLD PROTOCOL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
