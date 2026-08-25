import { ResponsiveDisplayAd, type ResponsiveDisplayAdProps } from './ResponsiveDisplayAd';

// Labeled ad frame -- ResponsiveDisplayAd has no "Advertisement" label of
// its own, and every call site was hand-rolling the same wrapper markup.
export function AdSlot({ className = '', ...ad }: ResponsiveDisplayAdProps & { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50/40 p-3 ${className}`}>
      <span className="block mb-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
        Advertisement
      </span>
      <ResponsiveDisplayAd {...ad} />
    </div>
  );
}
