"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { PublicFooter } from "@/components/knowledge/PublicFooter";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Branded 404 Discovery Page
 * Maintains platform fidelity even during routing exceptions.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center pt-32 pb-24">
        <div className="max-w-xl w-full text-center space-y-10 animate-in fade-in zoom-in duration-1000">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
              <SearchX className="w-16 h-16" />
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-2 border-4 border-white shadow-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-5xl md:text-6xl font-bold italic text-slate-900 tracking-tight">Intelligence Not Located</h1>
            <p className="text-slate-500 text-lg md:text-xl italic font-medium max-w-sm mx-auto leading-relaxed">
              The requested professional record could not be synchronized with our active network mapping.
            </p>
          </div>

          <div className="pt-6">
            <Button asChild className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-12 h-16 font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl transition-all interactive-lift">
              <Link href="/">
                <ArrowLeft className="mr-3 w-5 h-5" /> Return to Command Center
              </Link>
            </Button>
          </div>

          <div className="pt-16 border-t border-slate-50 opacity-40">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">
              Protocol Error 404 • Discovery Ledger Misaligned
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
