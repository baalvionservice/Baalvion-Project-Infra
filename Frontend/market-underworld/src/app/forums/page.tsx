
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageSquare, ChevronRight, Hash, ShieldCheck, Lock, Activity } from "lucide-react";
import Link from "next/link";
import { REGIONS } from "@/lib/api-mock";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Forums Overview Page with Entrance Animation.
 */
export default function ForumsOverview() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [progress, setProgress] = useState(0);
  const regions = REGIONS;

  useEffect(() => {
    if (isVerifying) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => setIsVerifying(false), 800);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 150);
      return () => clearInterval(timer);
    }
  }, [isVerifying]);

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {isVerifying ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[500] bg-[#0A0A0F] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md space-y-12 text-center">
              {/* Animated Brand Name */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-black tracking-tighter flex items-center justify-center gap-2"
              >
                <span className="text-white uppercase">Market</span>
                <span className="text-[#FF3D57] uppercase relative">
                  Underworld
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute bottom-0 left-0 h-1 bg-[#FF3D57] shadow-[0_0_15px_#FF3D57]"
                  />
                </span>
              </motion.div>

              {/* Bottle / Liquid Loader */}
              <div className="relative w-24 h-40 mx-auto">
                <div className="absolute inset-0 border-4 border-white/10 rounded-2xl overflow-hidden bg-white/5">
                  <motion.div 
                    initial={{ height: "0%" }}
                    animate={{ height: `${progress}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#FF3D57] to-[#FF6584]"
                  >
                    <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-6 bg-white/10 rounded-t-lg border-2 border-white/5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-mono font-bold text-white drop-shadow-md">{progress}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-3">
                  <Activity className="w-5 h-5 text-[#FF3D57] animate-pulse" />
                  Checking your browser
                </h2>
                <div className="space-y-1">
                  <p className="text-gray-500 text-sm font-medium">Please wait, verifying your connection...</p>
                  <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">This process takes just a few seconds.</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 flex items-center gap-4 text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em]">
              <Lock className="w-3 h-3" /> Encrypted Access Tunnel
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="container max-w-[1440px] mx-auto px-6 pt-20 pb-32"
          >
            <header className="mb-20 space-y-8">
              <div className="flex items-center gap-3 text-[#FF3D57] font-bold text-[12px] uppercase tracking-[0.2em]">
                <Hash className="w-4 h-4" /> COMMUNITY INTELLIGENCE
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[0.9]">
                Market <span className="text-[#FF3D57]">Underworld</span> <br />
                <span className="text-gray-600">Regional Nodes.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl font-medium">
                Connect with localized professional networks and specialized discussion nodes. Verified identity required for trade signals.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regions.map((reg) => (
                <Link key={reg.id} href={`/forums/${reg.id}`}>
                  <div className="mu-card group h-full flex flex-col p-10 relative overflow-hidden bg-[#111118] border border-white/5 hover:border-[#FF3D57]/40 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                      {reg.icon}
                    </div>
                    <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500 inline-block">{reg.icon}</div>
                    <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-[#FF3D57] transition-colors">{reg.name}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-10 flex-1 font-medium">
                      {reg.description}
                    </p>
                    <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-6 font-mono text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" /> 42 Nodes
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#FF3D57]" /> 156 Threads
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom Callout */}
            <div className="mt-32 p-12 rounded-[2.5rem] bg-gradient-to-br from-[#111118] to-black border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF3D57]/5 blur-[100px] rounded-full" />
              <div className="space-y-4 relative z-10">
                <h3 className="text-3xl font-bold text-white">Missing a node?</h3>
                <p className="text-gray-500 font-medium">Propose a new regional intelligence sector to the governing council.</p>
              </div>
              <button className="px-10 h-16 bg-white text-black font-bold rounded-2xl hover:bg-[#FF3D57] hover:text-white transition-all shadow-2xl relative z-10 whitespace-nowrap">
                Submit Proposal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
