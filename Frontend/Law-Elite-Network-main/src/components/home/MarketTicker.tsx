"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Globe, Clock } from 'lucide-react';

export function MarketTicker() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const marketData = [
    { label: 'SCOTUS DOCKET', val: '9 CASES IN HEARING', change: 'ACTIVE', positive: true },
    { label: 'MEDIA & IP INDEX', val: '4,812.40', change: '+1.4%', positive: true },
    { label: 'NY LITIGATION INDEX', val: '2,190.15', change: '+0.8%', positive: true },
    { label: 'ENTERTAINMENT 50', val: '1,450.80', change: '+2.1%', positive: true },
    { label: 'LEGAL TECH 100', val: '3,910.50', change: '+0.5%', positive: true },
  ];

  return (
    <div className="bg-slate-950 text-white text-[11px] border-b border-slate-800 font-sans uppercase tracking-wider overflow-x-auto no-scrollbar">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center justify-between gap-6 py-1.5 min-w-max">
        
        {/* Left: Date & Edition */}
        <div className="flex items-center gap-4 text-slate-400 font-bold shrink-0">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-[#E13131]" /> {timeStr || 'SEP 20, 2026'}
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1 text-[#E13131]">
            <Globe className="w-3 h-3" /> NY · LONDON · TOKYO
          </span>
        </div>

        {/* Right: Live Market & Docket Ticker */}
        <div className="flex items-center gap-6 shrink-0 font-medium">
          {marketData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">{item.label}:</span>
              <span className="text-white font-extrabold">{item.val}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-xs">
                <TrendingUp className="w-2.5 h-2.5" /> {item.change}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
