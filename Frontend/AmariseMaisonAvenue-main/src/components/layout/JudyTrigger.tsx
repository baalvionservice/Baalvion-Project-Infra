'use client';

import React, { useState } from 'react';
import { Sparkles, X, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * MeowTrigger: The AI Autonomous Shopping Assistant.
 * Floating action that triggers a curatorial dialogue.
 */
export function MeowTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed top-1/2 rounded-bl-3xl rounded-tl-3xl right-0 z-[60] flex items-center space-x-4 bg-white text-black px-1 h-14 shadow-2xl transition-all hover:scale-105 active:scale-95 group border border-white/10",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <div className="relative bg-black p-4 text-white rounded-full w-12 h-12 flex items-center justify-center">
          <Sparkles className="absolute right-3 top-0 w-3 h-3 text-gold animate-pulse" />
          <div className="absolute flex flex-col items-start leading-none">
            <span className="font-sans tracking-wide text-[10px]  ">
              ASK
              <br/>MEOW</span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            className="fixed bottom-12 right-10 z-[70] w-[380px] bg-white border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.2)] font-body overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-headline text-3xl font-medium italic text-gray-900">Bonjour.</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Curatorial Dialogue Active</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-50 transition-colors">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-600 font-light italic leading-relaxed">
                  "I am Meow, the Maison's autonomous assistant. I can guide you through the 1924 series or assist with a private brief."
                </p>

                <div className="space-y-3">
                  <MeowOption label="How does Beton compare to Etoupe?" />
                  <MeowOption label="Show me Birkins under €30k" />
                  <MeowOption label="Initiate Private Curation" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 relative">
                <input
                  type="text"
                  placeholder="Inquire with Meow..."
                  className="w-full bg-[#fcfcfc] h-14 pl-6 pr-12 text-xs font-light italic border border-gray-100 focus:border-black transition-all outline-none"
                />
                <button className="absolute right-4 top-[3.25rem] text-gray-300 hover:text-black transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MeowOption({ label }: { label: string }) {
  return (
    <button className="w-full text-left p-4 bg-[#fcfcfc] border border-gray-50 hover:border-black transition-all group flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">{label}</span>
      <Plus className="w-3 h-3 text-gray-200 group-hover:text-black" />
    </button>
  );
}
