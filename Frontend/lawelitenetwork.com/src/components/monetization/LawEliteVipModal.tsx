'use client';

import React, { useState } from 'react';

interface LawEliteVipModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function LawEliteVipModal({ isOpen = false, onClose }: LawEliteVipModalProps) {
  const [active, setActive] = useState(isOpen);

  if (!active && !isOpen) return null;

  const handleClose = () => {
    setActive(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 text-white rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl relative animate-scaleUp">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold"
        >
          ✕
        </button>

        {/* Top VIP Badge */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-full shadow">
            ★ LAW ELITE VIP & INSIDER PASS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
            Unlock Full Multi-Million Dollar Media & Legal Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Get unrestricted access to exclusive Law Elite scoops, SCOTUS docket analytics, unredacted court filings, and attorney briefs.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border-2 border-red-600 p-5 rounded-xl space-y-2 relative">
            <span className="absolute -top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
              POPULAR
            </span>
            <span className="text-xs text-slate-400 font-mono">MONTHLY VIP</span>
            <div className="text-2xl font-black text-white">$9.99 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
            <p className="text-[11px] text-slate-300">Cancel anytime. 7-day free trial included.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
            <span className="text-xs text-slate-400 font-mono">ANNUAL ALL-ACCESS</span>
            <div className="text-2xl font-black text-white">$99 <span className="text-xs font-normal text-slate-400">/ year</span></div>
            <p className="text-[11px] text-emerald-400 font-bold">Save 20% + Complimentary Law Briefs</p>
          </div>
        </div>

        {/* Perks list */}
        <div className="space-y-2 text-xs text-slate-300 font-sans border-t border-slate-900 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Unrestricted reading across all 1,300+ public figure topic hubs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Real-time SMS & Audio Breaking Scoop Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Certified PDF Court Document Viewer Access</span>
          </div>
        </div>

        <button
          onClick={() => {
            alert('Welcome to Law Elite VIP! Your 7-day free trial is activated.');
            handleClose();
          }}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition shadow-xl"
        >
          Start 7-Day Free Trial Now
        </button>
      </div>
    </div>
  );
}
