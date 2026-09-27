'use client';

import { useState } from 'react';
import { ResponsiveDisplayAd, type ResponsiveDisplayAdProps } from './ResponsiveDisplayAd';

// Google AdSense Compliant Ad Frame.
//
// The bordered "ADVERTISEMENT" label must collapse along with the ad it
// labels -- a labeled box with nothing inside (guaranteed while the AdSense
// account is unapproved, and not unheard of even once approved) reads as a
// broken layout, not an intentional empty state. See
// ResponsiveDisplayAd's onFilledChange for the fill-detection this reads.
export function AdSlot({ className = '', ...ad }: ResponsiveDisplayAdProps & { className?: string }) {
  const [filled, setFilled] = useState<boolean | null>(null);

  if (filled === false) return null;

  return (
    <div
      role="region"
      aria-label="Advertisement"
      className={`rounded-lg border border-slate-200 bg-slate-50/70 p-3 my-4 text-center transition ${className}`}
    >
      <span className="block mb-1.5 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
        ADVERTISEMENT
      </span>
      <div className="flex justify-center items-center overflow-hidden">
        <ResponsiveDisplayAd {...ad} onFilledChange={setFilled} />
      </div>
    </div>
  );
}
