'use client';

import React, { useState } from 'react';
import { LawEliteVipModal } from './LawEliteVipModal';

export function VipArticleTeaser() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="relative my-8 rounded-2xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-8 shadow-2xl">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold tracking-widest uppercase">
            ★ LAW ELITE VIP EXCLUSIVE
          </span>

          <h3 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight">
            Read the Full Unredacted Attorney Legal Brief
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            This article contains proprietary case strategy breakdowns and financial exposure models reserved exclusively for Law Elite VIP Subscribers.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg"
            >
              Unlock VIP Access — $9.99/mo
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-700"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>

      <LawEliteVipModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
