'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandImage } from '@/components/ui/BrandImage';
import { getWelcomeOfferContent, type WelcomeOfferContent } from '@/lib/cms';
import { cn } from '@/lib/utils';

/**
 * MaisonPopup: $100 welcome-offer gateway, shown once per visitor.
 * Once dismissed (X) or submitted, it is flagged as seen permanently — it will not
 * reappear on refresh, revisit, or later navigation for that browser.
 */
const POPUP_SEEN_KEY = 'amarise_offer_seen';
const POPUP_SHOW_DELAY = 3000;

export function MaisonPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [offer, setOffer] = useState<WelcomeOfferContent | null>(null);

  useEffect(() => {
    const hasSeenOffer = localStorage.getItem(POPUP_SEEN_KEY) === 'true';
    if (hasSeenOffer) return;

    getWelcomeOfferContent().then(setOffer);

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_SHOW_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_SEEN_KEY, 'true');
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

        {/* Visual Panel — sourced from the CMS welcome-offer image; falls back to the
            branded monogram panel until an admin uploads a real photo. */}
        <div className="relative w-full md:w-[52%] h-[220px] md:h-auto bg-[#f8f8f8] shrink-0 overflow-hidden">
          <BrandImage
            src={offer?.image}
            alt="Amarisé Maison Avenue welcome offer"
            className="absolute inset-0 w-full h-full border-none transition-transform duration-[10s] hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute top-6 left-6 luxury-blur bg-white/10 border border-white/20 px-4 py-1.5 hidden md:block">
             <span className="text-[8px] font-bold tracking-[0.5em] text-white uppercase">{offer?.archiveLabel ?? 'Archive No. 1924'}</span>
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
              {offer?.headline ?? '$100 Off, On Us?'}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-light italic leading-relaxed max-w-[280px] mx-auto">
              {offer?.subtext ??
                'Join our collector network for first access to the 1924 heritage series and bespoke curatorial guidance.'}
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
              {offer?.ctaLabel ?? 'Collect Your Offer'} <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </form>

          <div className="pt-4 flex flex-col items-center justify-center space-y-3 text-gray-400">
            <div className="flex items-center justify-center space-x-3">
              <Sparkles className="w-4 h-4 text-gold animate-pulse" />
              <p className="text-[9px] md:text-[10px] font-bold tracking-[0.4em] uppercase">
                Exclusivity Guaranteed
              </p>
            </div>
            <p className="text-[10px] text-gray-400 font-light italic">
              {offer?.disclaimer ?? '*Offer valid on all orders $2,500+.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
