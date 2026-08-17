"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';

// Collapsible table-of-contents widget for /advertise -- split out as its own
// client component so the surrounding page can be a server component and
// compute real stats (see src/app/advertise/page.tsx).
export function AdvertiseToc({ links }: { links: { label: string; id: string }[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative border border-slate-200 p-8 pt-6 rounded-none bg-slate-50/30">
      <div className="flex items-center gap-2 mb-6">
        <List className="w-4 h-4 text-blue-600" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Table of Contents</span>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 animate-in fade-in duration-300">
          {links.map((link) => (
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
  );
}

function CoralArrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 text-[#ff6b6b]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 15l-3 3-3-3" /><path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
