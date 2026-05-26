"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview AccessDeniedPage
 * Professional portal for restricted route deterrence.
 */
export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 flex flex-col items-center justify-center pt-32 pb-12">
        <div className="max-w-md w-full glass-panel p-12 rounded-3xl border-red-500/20 text-center space-y-8 shadow-2xl animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          
          <div className="space-y-3">
            <h1 className="font-headline text-4xl italic text-white leading-tight">Access Restricted</h1>
            <p className="text-muted-foreground text-sm italic leading-relaxed">
              Your current professional credentials do not authorize access to this specific network node. Authorization protocols are enforced across all modules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-12 font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-accent/10">
              <Link href="/dashboard">
                Return to Dashboard <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl h-12 font-bold uppercase text-[10px] tracking-[0.2em]">
              <Link href="/">
                <Home className="mr-2 w-4 h-4" /> Global Registry
              </Link>
            </Button>
          </div>

          <div className="pt-8 border-t border-white/5 opacity-40">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em]">Security Incident Logged • ID: SEC-{Date.now().toString().slice(-6)}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
