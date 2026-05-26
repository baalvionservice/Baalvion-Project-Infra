'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Navigation for large-scale dataset traversal.
 */
export const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  const navigateToPage = (page: number) => {
    router.push(createPageUrl(page));
  };

  return (
    <nav className="flex items-center justify-center gap-4 mt-16 pt-8 border-t border-white/5">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => navigateToPage(currentPage - 1)}
        className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/10 hover:bg-primary hover:text-white transition-all"
      >
        <ChevronLeft size={16} /> Previous
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "ghost"}
            size="sm"
            onClick={() => navigateToPage(page)}
            className={cn(
              "w-11 h-11 rounded-xl font-bold transition-all",
              currentPage === page 
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => navigateToPage(currentPage + 1)}
        className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/10 hover:bg-primary hover:text-white transition-all"
      >
        Next <ChevronRight size={16} />
      </Button>
    </nav>
  );
};
