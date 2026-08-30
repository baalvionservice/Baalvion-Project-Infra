import React from "react";

interface KeyTakeawaysBoxProps {
  items: string[];
  className?: string;
}

/**
 * Exact Investopedia "KEY TAKEAWAYS" Box.
 * Features:
 * - Coral/orange-red (#e8604c) top-left and bottom-right corner accent brackets
 * - Clean transparent/white background (no bulky card box)
 * - Uppercase bold tracking-widest header ("KEY TAKEAWAYS")
 * - Crisp disc bullets with optimal editorial reading line height
 */
export function KeyTakeawaysBox({ items, className = "" }: KeyTakeawaysBoxProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`relative my-8 py-6 px-6 sm:px-8 bg-transparent ${className}`}>
      {/* Top-left corner accent bracket (#e8604c) */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 w-28 sm:w-36 h-[2px] bg-[#e8604c]"
      />
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 w-[2px] h-10 bg-[#e8604c]"
      />

      {/* Bottom-right corner accent bracket (#e8604c) */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-28 sm:w-36 h-[2px] bg-[#e8604c]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[2px] h-10 bg-[#e8604c]"
      />

      {/* Header */}
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4 font-sans">
        KEY TAKEAWAYS
      </h3>

      {/* Bullet Points */}
      <ul className="space-y-3">
        {items.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-[15px] sm:text-[16px] leading-[1.65] text-foreground/90 font-normal"
          >
            <span
              aria-hidden="true"
              className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-foreground"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KeyTakeawaysBox;
