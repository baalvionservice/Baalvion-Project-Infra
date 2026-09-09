import type { ProductStatus } from '@/lib/products';
import { STATUS_LABEL } from '@/lib/products';

/**
 * The operating status of a product, stated plainly.
 *
 * "In development" means the domain does not serve traffic yet. It is deliberately not dressed up
 * as "coming soon" — someone deciding whether they can rely on something needs to know which of
 * these they can use today, and a portfolio where everything looks like it is thriving tells them
 * nothing.
 *
 * Square, with a leading rule rather than a pill: Carbon marks state with a bar, not a badge.
 */
export function StatusChip({ status }: { status: ProductStatus }) {
  const tone: Record<ProductStatus, string> = {
    live: 'border-[hsl(var(--live))] text-[hsl(var(--live))]',
    not_live: 'border-[hsl(var(--pending))] text-[hsl(var(--pending))]',
    internal: 'border-[hsl(var(--line))] text-[hsl(var(--muted-ink))]',
  };

  return (
    <span className={`label inline-flex shrink-0 items-center border-l-2 pl-2 ${tone[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
