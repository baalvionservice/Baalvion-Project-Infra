'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Navigation for large-scale dataset traversal. Real <Link href> per page
 * (via Button's asChild/Slot) rather than a router.push-only onClick -- page
 * 2+ needs a crawlable anchor for Google to discover it at all, since these
 * pages self-canonicalize per page number specifically for indexability.
 */
export const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <nav className="flex items-center justify-center gap-4 mt-16 pt-8 border-t border-white/5">
      <Button
        asChild
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/10 hover:bg-primary hover:text-white transition-all"
      >
        {currentPage === 1 ? (
          <span aria-disabled="true">
            <ChevronLeft size={16} /> Previous
          </span>
        ) : (
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft size={16} /> Previous
          </Link>
        )}
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            asChild
            variant={currentPage === page ? "default" : "ghost"}
            size="sm"
            className={cn(
              "w-11 h-11 rounded-xl font-bold transition-all",
              currentPage === page
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            <Link href={createPageUrl(page)} aria-current={currentPage === page ? "page" : undefined}>
              {page}
            </Link>
          </Button>
        ))}
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/10 hover:bg-primary hover:text-white transition-all"
      >
        {currentPage === totalPages ? (
          <span aria-disabled="true">
            Next <ChevronRight size={16} />
          </span>
        ) : (
          <Link href={createPageUrl(currentPage + 1)}>
            Next <ChevronRight size={16} />
          </Link>
        )}
      </Button>
    </nav>
  );
};
