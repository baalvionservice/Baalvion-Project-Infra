'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { isRealImage } from '@/lib/image-utils';

/**
 * Single image primitive for the storefront.
 *
 * When `src` is a REAL uploaded photo it renders it edge-to-edge. When it is missing or
 * still a dev placeholder (picsum / placehold.co), it renders an ELEGANT branded panel
 * (cream gradient + Amarisé monogram) instead of a random stock photo — so the site reads
 * as an intentional luxury house until real product/editorial photography is uploaded,
 * and those photos then drop straight in with zero further changes.
 *
 * `isRealImage` lives in `@/lib/image-utils` (server-safe). Re-exported here so existing
 * client-side imports `from "@/components/ui/BrandImage"` keep working unchanged.
 */
export { isRealImage };

interface BrandImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  /** Optional caption shown on the placeholder (e.g. product/brand name). */
  label?: string;
  /** Visual weight of the monogram. */
  variant?: 'default' | 'compact';
}

export function BrandImage({
  src,
  alt = '',
  className,
  imgClassName,
  priority = false,
  sizes,
  label,
  variant = 'default',
}: BrandImageProps) {
  if (isRealImage(src)) {
    return (
      <div className={cn('relative overflow-hidden bg-[#f6f4f0]', className)}>
        <Image
          src={src as string}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn('object-cover', imgClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center',
        'bg-[radial-gradient(120%_120%_at_50%_0%,#faf8f4_0%,#efe9e0_60%,#e7e0d5_100%)]',
        className
      )}
      role="img"
      aria-label={alt || 'Amarisé Maison'}
    >
      {/* hairline frame for an editorial, intentional feel */}
      <div className="absolute inset-3 sm:inset-4 border border-[#d8cfbf]/50" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-1.5 px-4 text-center select-none">
        <span
          className={cn(
            'font-headline leading-none text-[#b6995f]',
            variant === 'compact'
              ? 'text-[clamp(1.5rem,3vw,2.25rem)]'
              : 'text-[clamp(2.25rem,5vw,4rem)]'
          )}
        >
          A
        </span>
        <span className="text-[7px] sm:text-[9px] font-semibold tracking-[0.45em] uppercase text-[#9a8d76]">
          Amarisé Maison
        </span>
        {label && (
          <span className="mt-1 max-w-[85%] text-[7px] sm:text-[8px] tracking-[0.18em] uppercase text-[#a99c83] line-clamp-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
