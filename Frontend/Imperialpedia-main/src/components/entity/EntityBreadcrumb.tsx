import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb } from '@/modules/seo-engine/types';

interface EntityBreadcrumbProps {
  breadcrumb: Breadcrumb;
}

/**
 * Visible breadcrumb trail matching the BreadcrumbList JSON-LD already generated for the
 * page — crawlers and AI answer engines read both the schema and the rendered text, and
 * search results can surface this trail directly, so it needs to exist on-page, not just
 * inside a <script> tag.
 */
export const EntityBreadcrumb = ({ breadcrumb }: EntityBreadcrumbProps) => {
  const { items } = breadcrumb;
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-8 text-xs font-medium text-muted-foreground flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.item} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="text-foreground font-semibold" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.item} className="hover:text-primary transition-colors">
                {item.name}
              </Link>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 opacity-50" />}
          </span>
        );
      })}
    </nav>
  );
};
