import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

/** Numbered pagination — « Previous · 1 2 3 … N · Next » — with an ellipsis once there are
 * more pages than fit, same convention as most editorial listing pages. */
export function PromptPagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const href = (page: number) => (page <= 1 ? basePath : `${basePath}?page=${page}`);

  // Always show first, last, current ± 1, collapsing the rest into a single "…".
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items: (number | 'ellipsis')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('ellipsis');
    items.push(p);
  });

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5 text-sm">
      <Link
        href={href(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold ${currentPage === 1 ? 'pointer-events-none text-muted-foreground/40' : 'text-foreground hover:bg-muted'}`}
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </Link>

      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${item === currentPage ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={href(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold ${currentPage === totalPages ? 'pointer-events-none text-muted-foreground/40' : 'text-foreground hover:bg-muted'}`}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
