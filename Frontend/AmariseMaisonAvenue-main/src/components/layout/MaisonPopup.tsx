'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandImage } from '@/components/ui/BrandImage';
import type { WelcomeOfferContent } from '@/lib/cms';
import { cn } from '@/lib/utils';

/**
 * MaisonPopup: $100 welcome-offer gateway, shown once per visitor.
 * Once dismissed (X) or submitted, it is flagged as seen permanently — it will not
 * reappear on refresh, revisit, or later navigation for that browser.
 *
 * `initialOffer` is fetched server-side by the root layout (see src/app/layout.tsx)
 * and passed down as a prop — cms-service has no CORS headers, so fetching it
 * client-side here would silently fail on every load.
 */
const POPUP_SEEN_KEY = 'amarise_offer_seen';
const POPUP_SHOW_DELAY = 3000;
// Shipped campaign photo, used until the CMS `welcome-offer` entry has its own image set.
const DEFAULT_OFFER_IMAGE = '/images/campaign/welcome-offer.png';

interface MaisonPopupProps {
  initialOffer: WelcomeOfferContent | null;
}

export function MaisonPopup({ initialOffer: offer }: MaisonPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenOffer = localStorage.getItem(POPUP_SEEN_KEY) === 'true';
    if (hasSeenOffer) return;

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

  const headline = offer?.headline ?? '$100 Off, On Us?';
  const subtext =
    offer?.subtext ??
    'Join our collector network for first access to new arrivals and bespoke sourcing.';
  const ctaLabel = offer?.ctaLabel ?? 'Collect Your Offer';
  const disclaimer = offer?.disclaimer ?? '*Offer valid on all orders $2,500+.';

  const brandMark = (
    <div className="space-y-3 text-center flex flex-col items-center">
      <span className="font-headline text-3xl md:text-4xl font-bold tracking-[0.1em] text-gray-900 leading-none">
        AMARISÉ
      </span>
      <span className="text-[9px] md:text-[10px] font-bold tracking-[0.5em] text-gray-400 uppercase mt-1 italic">
        Maison Avenue
      </span>
    </div>
  );

  const offerCopy = (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-[42px] font-headline font-medium text-gray-900 leading-[1.1] tracking-tighter italic">
        {headline}
      </h2>
      <p className="text-xs md:text-sm text-gray-500 font-light italic leading-relaxed max-w-[280px] mx-auto">
        {subtext}
      </p>
    </div>
  );

  const offerForm = (
    <form onSubmit={handleCollect} className="space-y-4 max-w-[340px] mx-auto w-full pt-2">
      <Input
        type="email"
        placeholder="EMAIL ADDRESS"
        className="h-12 md:h-16 rounded-none border-gray-100 bg-[#fcfcfc] text-center text-[10px] md:text-xs font-bold tracking-[0.3em] placeholder:text-gray-300 focus:ring-0 focus:border-black transition-all"
        required
        aria-label="Collector Email Address"
      />
      <Button
        type="submit"
        className="w-full h-12 md:h-16 bg-black text-white hover:bg-plum rounded-none text-[10px] md:text-[11px] font-bold tracking-[0.4em] uppercase transition-all shadow-2xl"
      >
        {ctaLabel} <ArrowRight className="ml-3 w-4 h-4" />
      </Button>
    </form>
  );

  const trustRow = (
    <div className="pt-4 flex flex-col items-center justify-center space-y-3 text-gray-400">
      <div className="flex items-center justify-center space-x-3">
        <Sparkles className="w-4 h-4 text-gold animate-pulse" />
        <p className="text-[9px] md:text-[10px] font-bold tracking-[0.4em] uppercase">Exclusivity Guaranteed</p>
      </div>
      <p className="text-[10px] text-gray-400 font-light italic">{disclaimer}</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-1000"
      role="dialog"
      aria-label="Amarisé Maison Avenue welcome offer"
    >
      {/* Desktop/tablet: full-bleed photo fills the whole modal; the card floats on top of
          it, inset with margin — matching the competitor reference exactly (not a two-panel
          split). Close button sits over the photo, outside the card. */}
      <div className="hidden md:block relative w-full max-w-[1180px] h-[640px] lg:h-[680px] shadow-2xl animate-in zoom-in-95 duration-700">
        <BrandImage
          src={offer?.image || DEFAULT_OFFER_IMAGE}
          alt="Amarisé Maison Avenue welcome offer"
          className="absolute inset-0 w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-black/15" />

        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-20 text-white/90 hover:text-white transition-colors"
          type="button"
          aria-label="Close Private Invitation"
        >
          <X className="w-6 h-6 stroke-[1.5px]" />
        </button>

        <div className="absolute left-8 lg:left-14 top-1/2 -translate-y-1/2 z-10 w-[520px] max-w-[calc(100%-4rem)] bg-[#f8f6f3] rounded-lg shadow-[0_40px_100px_-15px_rgba(0,0,0,0.6)] px-12 py-14 lg:px-16 lg:py-16 space-y-10">
          {brandMark}
          {offerCopy}
          {offerForm}
          {trustRow}
        </div>
      </div>

      {/* Mobile: stacked, fully contained card — the bleed layout doesn't read below tablet width. */}
      <div className="md:hidden relative w-full max-h-[90vh] overflow-y-auto bg-white shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-700 rounded-2xl custom-scrollbar border border-white/10">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 text-gray-400 hover:text-black transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/80 rounded-full"
          type="button"
          aria-label="Close Private Invitation"
        >
          <X className="w-6 h-6 stroke-[1.5px]" />
        </button>

        <div className="relative w-full h-[220px] shrink-0 overflow-hidden">
          <BrandImage src={offer?.image || DEFAULT_OFFER_IMAGE} alt="Amarisé Maison Avenue welcome offer" className="absolute inset-0 w-full h-full" priority />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        <div className="w-full p-8 flex flex-col justify-center text-center space-y-8 bg-white">
          {brandMark}
          {offerCopy}
          {offerForm}
          {trustRow}
        </div>
      </div>
    </div>
  );
}
