import React from 'react';
import { ResponsiveDisplayAd, type ResponsiveDisplayAdProps } from './ResponsiveDisplayAd';

// Google AdSense Compliant Ad Frame
export function AdSlot({ className = '', ...ad }: ResponsiveDisplayAdProps & { className?: string }) {
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
        <ResponsiveDisplayAd {...ad} />
      </div>
    </div>
  );
}
