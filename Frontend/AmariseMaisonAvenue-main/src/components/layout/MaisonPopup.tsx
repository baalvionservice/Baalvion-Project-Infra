'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { cn } from '@/lib/utils';

/**
 * MaisonPopup: Restored High-Fidelity Invitation Gateway.
 * Optimized for mobile viewport stability while maintaining expensive aesthetic.
 */
const POPUP_INTERVAL = 2 * 60 * 1000; // 2 minutes
const POPUP_KEY = 'maison_popup_last_shown';

export function MaisonPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem(POPUP_KEY);
    const now = Date.now();

    if (!lastShown || now - parseInt(lastShown) > POPUP_INTERVAL) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_KEY, Date.now().toString());
  };

  const handleCollect = (e: React.FormEvent) => {
    e.preventDefault();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-1000" role="dialog" aria-labelledby="popup-title">
      <div className="relative w-full max-w-[940px] max-h-[90vh] overflow-y-auto bg-white shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row animate-in zoom-in-95 duration-700 rounded-sm custom-scrollbar border border-white/10">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 z-30 text-gray-400 hover:text-black transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/80 rounded-full md:bg-transparent"
          type="button"
          aria-label="Close Private Invitation"
        >
          <X className="w-6 h-6 stroke-[1.5px]" />
        </button>

        {/* Visual Panel */}
        <div className="relative w-full md:w-[52%] h-[220px] md:h-auto bg-[#f8f8f8] shrink-0 overflow-hidden">
          <PlaceholderImage className="absolute inset-0 w-full h-full border-none transition-transform duration-[10s] hover:scale-110" />
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute top-6 left-6 luxury-blur bg-white/10 border border-white/20 px-4 py-1.5 hidden md:block">
             <span className="text-[8px] font-bold tracking-[0.5em] text-white uppercase">Archive No. 1924</span>
          </div>
        </div>

        {/* Content Panel */}
        <div className="w-full md:w-[48%] p-8 md:p-20 flex flex-col justify-center text-center space-y-8 md:space-y-12 bg-white">
          <div className="space-y-3 text-center flex flex-col items-center">
            <span className="font-headline text-3xl md:text-4xl font-bold tracking-[0.1em] text-gray-900 leading-none">
              AMARISÉ
            </span>
            <span className="text-[9px] md:text-[10px] font-bold tracking-[0.5em] text-gray-400 uppercase mt-1 italic">
              Maison Avenue
            </span>
          </div>

          <div className="space-y-4 md:space-y-6">
            <h2 id="popup-title" className="text-2xl md:text-[42px] font-headline font-medium text-gray-900 leading-[1.1] tracking-tighter italic">
              A Private Invitation <br /> to the Archive
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-light italic leading-relaxed max-w-[280px] mx-auto">
              Join our collector network for first access to the 1924 heritage series and bespoke curatorial guidance.
            </p>
          </div>

          <form onSubmit={handleCollect} className="space-y-4 max-w-[340px] mx-auto w-full pt-2">
            <div className="space-y-3">
              <Input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="h-12 md:h-16 rounded-none border-gray-100 bg-[#fcfcfc] text-center text-[10px] md:text-xs font-bold tracking-[0.3em] placeholder:text-gray-300 focus:ring-0 focus:border-black transition-all"
                required
                aria-label="Collector Email Address"
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full h-12 md:h-16 bg-black text-white hover:bg-plum rounded-none text-[10px] md:text-[11px] font-bold tracking-[0.4em] uppercase transition-all shadow-2xl"
            >
              REQUEST ACCESS <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </form>

          <div className="pt-4 flex items-center justify-center space-x-3 text-gray-400">
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <p className="text-[9px] md:text-[10px] font-bold tracking-[0.4em] uppercase">
              Exclusivity Guaranteed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
