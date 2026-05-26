"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * @fileOverview AIAnswersCard
 * High-fidelity AI interface precisely matching the Investopedia style.
 * Features a soft gradient glow and a high-contrast action protocol.
 */
export function AIAnswersCard() {
  return (
    <div className="relative mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Soft Background Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-purple-100/50 via-blue-50/50 to-pink-100/50 blur-3xl opacity-60 rounded-[3rem] -z-10" />
      
      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-blue-600">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Law Elite Answers
            </h3>
            <span className="bg-[#d32f2f] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-tighter shadow-sm">
              NEW!
            </span>
          </div>
        </div>

        <p className="text-sm md:text-[15px] text-slate-500 font-medium italic mb-8">
          Get personalized, AI-powered answers built on 12+ years of trusted legal expertise.
        </p>

        <div className="relative flex items-stretch">
          <input 
            type="text"
            placeholder="Ask anything to get started..."
            className="flex-1 h-14 pl-6 pr-4 bg-slate-50 border-2 border-slate-100 rounded-l-xl text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-base"
          />
          <button className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-8 font-black uppercase text-xs tracking-widest rounded-r-xl transition-all shadow-lg active:scale-95 whitespace-nowrap">
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
