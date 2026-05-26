'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Breadcrumb } from '../types';
import { cn } from '@/lib/utils';
import { JsonLd } from './JsonLd';
import { breadcrumbService } from '../services/breadcrumb-service';

interface BreadcrumbsProps {
  breadcrumb: Breadcrumb;
  className?: string;
}

/**
 * Responsive breadcrumb navigation component.
 * Renders hierarchical links and injects JSON-LD for search engines.
 */
export const Breadcrumbs = ({ breadcrumb, className }: BreadcrumbsProps) => {
  // Generate schema for search engines
  const breadcrumbSchema = breadcrumbService.generateBreadcrumbSchema(breadcrumb);

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-2 text-xs text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap pb-2 md:pb-0", className)}
    >
      {/* Inject JSON-LD Schema */}
      <JsonLd data={breadcrumbSchema} />
      
      {breadcrumb.items.map((item, index) => {
        const isLast = index === breadcrumb.items.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={item.item + index}>
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />}
            
            {isLast ? (
              <span className="font-bold text-foreground truncate max-w-[200px]" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link 
                href={item.item}
                className="hover:text-primary transition-colors flex items-center gap-1 shrink-0"
              >
                {isFirst && <Home className="h-3 w-3" />}
                {item.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
