'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from './cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  label?: string;
}

/**
 * Page links write to the query string, so a result set is linkable and the back button
 * behaves. Renders nothing at a single page rather than showing a dead control.
 */
export function Pagination({ page, totalPages, total, label = 'results' }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const go = (next: number) => {
    const q = new URLSearchParams(params.toString());
    if (next <= 1) q.delete('page'); else q.set('page', String(next));
    router.push(`${pathname}${q.toString() ? `?${q}` : ''}`);
  };

  const btn = 'focus-ring rounded-md border border-line-strong bg-surface px-3 py-2 text-sm disabled:opacity-40 disabled:pointer-events-none';

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} · {total} {label}
      </p>
      <div className="flex gap-2">
        <button type="button" className={cn(btn)} onClick={() => go(page - 1)} disabled={page <= 1}>Previous</button>
        <button type="button" className={cn(btn)} onClick={() => go(page + 1)} disabled={page >= totalPages}>Next</button>
      </div>
    </nav>
  );
}
