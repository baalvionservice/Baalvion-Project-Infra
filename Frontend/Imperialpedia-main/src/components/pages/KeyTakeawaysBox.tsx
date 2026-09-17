import React from "react";

interface KeyTakeawaysBoxProps {
  items: string[];
  className?: string;
}

/**
  * Imperialpedia Style "THE QUICK READ" Key Takeaways Box.
  * Features:
  * - Thick black border with hard Imperialpedia box shadow
  * - Red banner tag ("IMPERIALPEDIA QUICK READ")
  * - Red numbered bullet points with bold high-contrast text
  */
export function KeyTakeawaysBox({ items, className = "" }: KeyTakeawaysBoxProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`my-10 p-6 sm:p-8 bg-[#fffdfa] dark:bg-slate-900 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] relative rounded-sm ${className}`}
    >
      {/* Top Red Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 border-b-2 border-black dark:border-slate-800 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
            IMPERIALPEDIA
          </span>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white font-mono">
            KEY TAKEAWAYS // THE QUICK READ
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400 font-mono hidden sm:inline">
          {items.length} POINTS
        </span>
      </div>

      {/* Bullet Points */}
      <ul className="space-y-3.5">
        {items.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-3.5 text-sm sm:text-base leading-relaxed text-black dark:text-slate-100 font-bold"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex-shrink-0 font-mono font-black text-sm text-[#c8102e]"
            >
              0{i + 1}.
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KeyTakeawaysBox;
