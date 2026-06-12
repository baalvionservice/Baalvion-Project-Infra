import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProductBadgeVariant = "neutral" | "dark" | "accent";

export interface ProductBadgeInfo {
  label: string;
  variant: ProductBadgeVariant;
}

/**
 * Picks ONE merchandising badge for a product, by priority:
 *   isVip            -> "Private Allocation" (dark)
 *   stock === 1      -> "1 Left"             (accent)
 *   stock === 0      -> "Sold"               (neutral)
 *   condition ~ /new/i -> "New"              (accent)
 *   else             -> null
 */
export function getProductBadge(product: Product): ProductBadgeInfo | null {
  if (product.isVip) {
    return { label: "Private Allocation", variant: "dark" };
  }
  if (product.stock === 1) {
    return { label: "1 Left", variant: "accent" };
  }
  if (product.stock === 0) {
    return { label: "Sold", variant: "neutral" };
  }
  if (product.condition && /new/i.test(product.condition)) {
    return { label: "New", variant: "accent" };
  }
  return null;
}

const VARIANT_CLASSES: Record<ProductBadgeVariant, string> = {
  neutral: "bg-[#f8f6f3]/90 text-[#1a1a1a] border-[#1a1a1a]/10",
  dark: "bg-[#1a1a1a]/85 text-white border-white/10",
  accent: "bg-white/90 text-[#7E3F98] border-[#7E3F98]/25",
};

interface ProductBadgeProps {
  label: string;
  variant?: ProductBadgeVariant;
  className?: string;
}

/**
 * A small, elegant uppercase tracked merchandising badge.
 * Position it via the wrapping element (e.g. absolute top-left) at the call site.
 */
export function ProductBadge({
  label,
  variant = "neutral",
  className,
}: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 text-[8px] lg:text-[9px] font-semibold uppercase tracking-[0.25em] leading-none border backdrop-blur-md shadow-sm",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
