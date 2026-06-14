"use client";

import { cn } from "@/lib/utils";

/**
 * Amarisé Maison logomark.
 *
 * A serif "A" monogram set in the house gold (#b6995f) inside a hairline gold
 * ring — matching the BrandImage placeholder aesthetic — optionally paired with
 * the "AMARISÉ MAISON" wordmark. Pure inline SVG + text so it stays crisp at any
 * size, has no external request, and inherits the surrounding theme.
 */

const GOLD = "#b6995f";

interface BrandLogoProps {
  /** Render the "AMARISÉ MAISON" wordmark beside the monogram. */
  wordmark?: boolean;
  /** Pixel size of the square monogram glyph. */
  size?: number;
  className?: string;
}

export function BrandLogo({
  wordmark = false,
  size = 36,
  className,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Amarisé Maison"
        className="shrink-0"
      >
        {/* Hairline gold ring frame */}
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke={GOLD}
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        {/* Serif "A" monogram */}
        <text
          x="24"
          y="34"
          textAnchor="middle"
          fill={GOLD}
          fontFamily="var(--font-serif), 'Cormorant Garamond', Georgia, serif"
          fontSize="30"
          fontWeight="600"
        >
          A
        </text>
      </svg>

      {wordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[15px] sm:text-[18px] lg:text-[22px] font-semibold tracking-[0.12em] uppercase text-black">
            Amarisé Maison
          </span>
          <span className="hidden sm:block text-[8px] tracking-[0.45em] uppercase text-[#9a8d76] mt-1">
            Maison Avenue
          </span>
        </span>
      )}
    </span>
  );
}
