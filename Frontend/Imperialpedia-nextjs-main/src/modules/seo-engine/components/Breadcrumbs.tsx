'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Breadcrumb } from '../types';
import { cn } from '@/lib/utils';
import { JsonLd } from './JsonLd';
import { breadcrumbService } from '../services/breadcrumb-service';
import { getTopicColor } from '@/lib/topic-colors';

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
      className={cn("flex items-center gap-2 text-sm mb-8 overflow-x-auto pb-2 md:pb-0", className)}
    >
      {/* Inject JSON-LD Schema */}
      <JsonLd data={breadcrumbSchema} />

      {breadcrumb.items.map((item, index) => {
        const isLast = index === breadcrumb.items.length - 1;
        const isFirst = index === 0;
        const color = !isFirst && !isLast ? getTopicColor(item.name) : undefined;

        return (
          <React.Fragment key={item.item + index}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}

            {isLast ? (
              <span
                className="font-bold text-foreground max-w-[70vw] sm:max-w-[420px] truncate"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.item}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 font-semibold transition-colors hover:underline",
                  isFirst ? "text-muted-foreground hover:text-primary" : "text-muted-foreground",
                )}
                style={color ? { color } : undefined}
              >
                {isFirst ? <Home className="h-3.5 w-3.5" /> : null}
                {item.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
