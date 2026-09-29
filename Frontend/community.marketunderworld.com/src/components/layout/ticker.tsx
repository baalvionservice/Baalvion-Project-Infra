"use client"

import React from 'react';
import { MARKET_TICKER } from '@/data/mockData';
import { cn } from '@/lib/utils';

export const CryptoTicker = () => {
  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-black border-b border-[#1F232B] z-[1100] overflow-hidden whitespace-nowrap hidden md:block">
      <div className="flex h-full items-center animate-ticker">
        {[...MARKET_TICKER, ...MARKET_TICKER, ...MARKET_TICKER].map((item, idx) => (
          <div key={idx} className="inline-flex items-center mx-12 gap-3 group cursor-default">
            <span className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest">{item.pair}</span>
            <span className="text-white text-[11px] font-mono font-bold tracking-tight">${item.price}</span>
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
              item.pos ? "text-[#39FF14] bg-[#39FF14]/5" : "text-[#EF4444] bg-[#EF4444]/5"
            )}>
              {item.pos ? '▲' : '▼'} {item.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};